const express = require("express");
const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
const { z } = require("zod");

const { supabase } = require("../db/supabase");
const { signToken, setAuthCookie, requireAuth, requireAdmin } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscriptionStatus");
const { createOrRenewSubscription, activateSubscriptionFromPayment } = require("../services/subscriptionService");
const { simulateDraw, publishDraw, monthKey } = require("../services/drawService");
const { isStripeEnabled, createCheckoutSession, retrieveCheckoutSession } = require("../services/stripeService");
const { sendWinnerAlert, sendPayoutCompleted } = require("../services/emailService");

const router = express.Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  charityId: z.string().uuid(),
  charityPercentage: z.coerce.number().min(10).max(100)
});

const scoreSchema = z.object({
  value: z.coerce.number().int().min(1).max(45),
  playedOn: z.string().min(1)
});

const donationSchema = z.object({
  charityId: z.string().uuid(),
  amount: z.coerce.number().positive()
});

async function trimScores(userId) {
  const { data: scores } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", userId)
    .order("played_on", { ascending: false });

  if ((scores || []).length <= 5) return;

  const removeIds = scores.slice(5).map((s) => s.id);
  await supabase.from("scores").delete().in("id", removeIds);
}

router.get("/", async (req, res) => {
  const { data: charities } = await supabase
    .from("charities")
    .select("id, name, short_description, is_featured")
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  return res.render("home", {
    title: "Golf Charity Subscription Platform",
    charities: charities || [],
    month: monthKey()
  });
});

router.get("/register", async (req, res) => {
  const { data: charities } = await supabase.from("charities").select("id, name").order("name", { ascending: true });
  return res.render("register", { title: "Register", charities: charities || [], error: null });
});

router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    const { data: charities } = await supabase.from("charities").select("id, name").order("name", { ascending: true });
    return res.status(400).render("register", { title: "Register", charities: charities || [], error: "Please provide valid details." });
  }

  const payload = parse.data;
  const { data: existing } = await supabase.from("users").select("id").eq("email", payload.email).maybeSingle();
  if (existing) {
    const { data: charities } = await supabase.from("charities").select("id, name").order("name", { ascending: true });
    return res.status(400).render("register", { title: "Register", charities: charities || [], error: "Email already exists." });
  }

  const hash = await bcrypt.hash(payload.password, 10);
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      full_name: payload.fullName,
      email: payload.email,
      password_hash: hash,
      role: "subscriber",
      selected_charity_id: payload.charityId,
      charity_percentage: payload.charityPercentage
    })
    .select("id, email, role")
    .single();

  if (error) throw error;

  const token = signToken({ sub: user.id, role: user.role });
  setAuthCookie(res, token);
  return res.redirect("/dashboard");
});

router.get("/login", (_req, res) => {
  return res.render("login", { title: "Login", error: null });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const password = String(req.body.password || "");

  const { data: user } = await supabase
    .from("users")
    .select("id, email, password_hash, role")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    return res.status(400).render("login", { title: "Login", error: "Invalid credentials." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(400).render("login", { title: "Login", error: "Invalid credentials." });
  }

  const token = signToken({ sub: user.id, role: user.role });
  setAuthCookie(res, token);

  if (user.role === "admin") {
    return res.redirect("/admin");
  }

  return res.redirect("/dashboard");
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  return res.redirect("/");
});

router.get("/dashboard", requireAuth, async (req, res) => {
  const [{ data: scores }, { data: draws }, { data: winnings }, { data: charities }] = await Promise.all([
    supabase.from("scores").select("*").eq("user_id", req.user.id).order("played_on", { ascending: false }).limit(5),
    supabase.from("draws").select("month_key, draw_type, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase
      .from("winners")
      .select("id, match_type, payout_amount, payout_status, draws(month_key)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false }),
    supabase.from("charities").select("id, name").order("name", { ascending: true })
  ]);

  const drawCount = draws?.filter((d) => d.status === "published").length || 0;
  const totalWon = (winnings || []).reduce((s, w) => s + Number(w.payout_amount || 0), 0);

  return res.render("dashboard", {
    title: "User Dashboard",
    scores: scores || [],
    draws: draws || [],
    winnings: winnings || [],
    drawCount,
    totalWon,
    charities: charities || []
  });
});

router.post("/dashboard/subscribe", requireAuth, async (req, res) => {
  const planType = req.body.planType === "yearly" ? "yearly" : "monthly";
  const charityPercentage = Math.max(10, Number(req.body.charityPercentage || req.user.charity_percentage || 10));

  if (isStripeEnabled()) {
    const session = await createCheckoutSession({
      user: req.user,
      planType,
      charityPercentage
    });

    await supabase
      .from("users")
      .update({ charity_percentage: charityPercentage })
      .eq("id", req.user.id);

    return res.redirect(303, session.url);
  }

  await createOrRenewSubscription(req.user.id, planType, charityPercentage, {
    paymentProvider: "manual"
  });
  await supabase
    .from("users")
    .update({ charity_percentage: charityPercentage })
    .eq("id", req.user.id);

  return res.redirect("/dashboard");
});

router.get("/billing/success", requireAuth, async (req, res) => {
  const sessionId = String(req.query.session_id || "");
  if (!sessionId) {
    return res.redirect("/dashboard");
  }

  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status !== "paid") {
    return res.redirect("/dashboard");
  }

  await activateSubscriptionFromPayment({
    userId: session.metadata?.userId,
    planType: session.metadata?.planType,
    charityPercentage: Number(session.metadata?.charityPercentage || 10),
    externalPaymentId: session.id,
    paymentProvider: "stripe"
  });

  return res.redirect("/dashboard");
});

router.post("/dashboard/scores", requireAuth, requireActiveSubscription, async (req, res) => {
  const parsed = scoreSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).render("error", {
      title: "Invalid Score",
      message: "Score must be between 1 and 45 and include a date.",
      user: req.user
    });
  }

  await supabase.from("scores").insert({
    user_id: req.user.id,
    value: parsed.data.value,
    played_on: parsed.data.playedOn
  });

  await trimScores(req.user.id);
  return res.redirect("/dashboard");
});

router.post("/dashboard/charity", requireAuth, async (req, res) => {
  const charityId = String(req.body.charityId || "");
  const charityPercentage = Math.max(10, Number(req.body.charityPercentage || req.user.charity_percentage || 10));

  await supabase
    .from("users")
    .update({ selected_charity_id: charityId, charity_percentage: charityPercentage })
    .eq("id", req.user.id);

  return res.redirect("/dashboard");
});

router.get("/charities", async (_req, res) => {
  const { data: charities } = await supabase
    .from("charities")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  return res.render("charities", {
    title: "Charities",
    charities: charities || []
  });
});

router.post("/charities/donate", requireAuth, async (req, res) => {
  const parsed = donationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.redirect("/charities");
  }

  await supabase.from("independent_donations").insert({
    user_id: req.user.id,
    charity_id: parsed.data.charityId,
    amount: parsed.data.amount
  });

  return res.redirect("/charities");
});

router.get("/winner-proof", requireAuth, async (req, res) => {
  const { data: winnerRows } = await supabase
    .from("winners")
    .select("id, match_type, payout_status, draws(month_key)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  return res.render("winner-proof", {
    title: "Winner Verification",
    winners: winnerRows || []
  });
});

router.post("/winner-proof", requireAuth, async (req, res) => {
  const winnerId = String(req.body.winnerId || "");
  const screenshotUrl = String(req.body.screenshotUrl || "");

  await supabase.from("winner_verifications").insert({
    winner_id: winnerId,
    screenshot_url: screenshotUrl,
    review_status: "pending"
  });

  return res.redirect("/winner-proof");
});

router.get("/admin", requireAuth, requireAdmin, async (_req, res) => {
  const [usersResult, poolsResult, donationsResult, drawsResult, winnersResult] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("monthly_pools").select("gross_pool_amount,match_5_pool,match_4_pool,match_3_pool"),
    supabase.from("subscriptions").select("charity_amount"),
    supabase.from("draws").select("month_key, draw_type, status, numbers").order("created_at", { ascending: false }).limit(6),
    supabase
      .from("winners")
      .select("id, payout_amount, payout_status, match_type, users(full_name), draws(month_key)")
      .order("created_at", { ascending: false })
  ]);

  const totalPool = (poolsResult.data || []).reduce((sum, p) => sum + Number(p.gross_pool_amount || 0), 0);
  const charityTotal = (donationsResult.data || []).reduce((sum, d) => sum + Number(d.charity_amount || 0), 0);

  return res.render("admin", {
    title: "Admin Dashboard",
    totalUsers: usersResult.count || 0,
    totalPool,
    charityTotal,
    draws: drawsResult.data || [],
    winners: winnersResult.data || []
  });
});

router.post("/admin/charities", requireAuth, requireAdmin, async (req, res) => {
  await supabase.from("charities").insert({
    name: req.body.name,
    short_description: req.body.shortDescription,
    long_description: req.body.longDescription,
    image_url: req.body.imageUrl,
    upcoming_event: req.body.upcomingEvent,
    is_featured: req.body.isFeatured === "on"
  });

  return res.redirect("/admin");
});

router.post("/admin/draws/simulate", requireAuth, requireAdmin, async (req, res) => {
  const drawType = req.body.drawType === "algorithm" ? "algorithm" : "random";
  const result = await simulateDraw(drawType, dayjs());

  return res.render("draw-simulation", {
    title: "Draw Simulation",
    result
  });
});

router.post("/admin/draws/publish", requireAuth, requireAdmin, async (req, res) => {
  const drawType = req.body.drawType === "algorithm" ? "algorithm" : "random";
  const result = await publishDraw(drawType, monthKey());

  if (result.winnersCount > 0) {
    const { data: winnerUsers } = await supabase
      .from("winners")
      .select("users(email,full_name), payout_amount, match_type")
      .eq("draw_id", result.draw.id);

    await Promise.all(
      (winnerUsers || []).map((winner) =>
        sendWinnerAlert(winner.users?.email, winner.users?.full_name, winner.match_type, winner.payout_amount)
      )
    );
  }

  return res.redirect("/admin");
});

router.post("/admin/winner/review", requireAuth, requireAdmin, async (req, res) => {
  const verificationId = String(req.body.verificationId || "");
  const status = req.body.status === "approved" ? "approved" : "rejected";

  await supabase
    .from("winner_verifications")
    .update({ review_status: status, reviewed_at: new Date().toISOString() })
    .eq("id", verificationId);

  return res.redirect("/admin/winners");
});

router.post("/admin/winner/paid", requireAuth, requireAdmin, async (req, res) => {
  const winnerId = String(req.body.winnerId || "");
  const { data: winner } = await supabase
    .from("winners")
    .select("id, payout_amount, users(email)")
    .eq("id", winnerId)
    .maybeSingle();

  await supabase.from("winners").update({ payout_status: "paid" }).eq("id", winnerId);
  await sendPayoutCompleted(winner?.users?.email, winner?.payout_amount || 0);

  return res.redirect("/admin");
});

router.get("/admin/winners", requireAuth, requireAdmin, async (_req, res) => {
  const { data } = await supabase
    .from("winner_verifications")
    .select("id, screenshot_url, review_status, created_at, winners(id,match_type,payout_status,users(full_name),draws(month_key))")
    .order("created_at", { ascending: false });

  return res.render("admin-winners", {
    title: "Winner Verification",
    verifications: data || []
  });
});

module.exports = router;
