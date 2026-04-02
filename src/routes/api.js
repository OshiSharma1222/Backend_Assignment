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

// ============ AUTH ENDPOINTS ============

router.post("/auth/register", async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Please provide valid details." });
    }

    const payload = parse.data;
    const { data: existing } = await supabase.from("users").select("id").eq("email", payload.email).maybeSingle();
    if (existing) {
      return res.status(400).json({ message: "Email already exists." });
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
      .select("id, email, full_name, role")
      .single();

    if (error) throw error;

    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    return res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, token });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase();
    const password = String(req.body.password || "");

    const { data: user } = await supabase
      .from("users")
      .select("id, email, full_name, password_hash, role")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);

    return res.json({ 
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, 
      token 
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
});

router.get("/auth/user", requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("id, email, full_name, role, selected_charity_id, charity_percentage")
      .eq("id", req.user.id)
      .single();

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

// ============ SUBSCRIPTIONS ============

router.get("/subscriptions/status", requireAuth, async (req, res) => {
  try {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return res.json({ subscription });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch subscription status" });
  }
});

router.post("/subscriptions", requireAuth, async (req, res) => {
  try {
    const { planType, charityPercentage } = req.body;
    const subscription = await createOrRenewSubscription(req.user.id, planType, charityPercentage);
    return res.json({ subscription });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/subscriptions/checkout", requireAuth, async (req, res) => {
  try {
    const { planType, charityPercentage } = req.body;
    
    if (!isStripeEnabled()) {
      return res.status(400).json({ message: "Stripe not configured" });
    }

    const checkoutUrl = await createCheckoutSession({
      user: req.user,
      planType,
      charityPercentage
    });

    return res.json({ checkoutUrl });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ============ SCORES ============

router.get("/scores", requireAuth, async (req, res) => {
  try {
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", req.user.id)
      .order("played_on", { ascending: false })
      .limit(5);

    return res.json({ scores });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch scores" });
  }
});

router.post("/scores", requireAuth, requireActiveSubscription, async (req, res) => {
  try {
    const parse = scoreSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid score data" });
    }

    const { data: score, error } = await supabase
      .from("scores")
      .insert({
        user_id: req.user.id,
        value: parse.data.value,
        played_on: parse.data.playedOn
      })
      .select()
      .single();

    if (error) throw error;

    await trimScores(req.user.id);
    return res.json({ score });
  } catch (err) {
    return res.status(500).json({ message: "Failed to add score" });
  }
});

// ============ CHARITIES ============

router.get("/charities", async (req, res) => {
  try {
    const { data: charities } = await supabase
      .from("charities")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });

    return res.json({ charities });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch charities" });
  }
});

router.get("/charities/featured", async (req, res) => {
  try {
    const { data: charities } = await supabase
      .from("charities")
      .select("*")
      .eq("is_featured", true)
      .order("name", { ascending: true });

    return res.json({ charities });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch charities" });
  }
});

router.post("/charities/donate", async (req, res) => {
  try {
    const parse = donationSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid donation data" });
    }

    const { data: donation, error } = await supabase
      .from("independent_donations")
      .insert({
        charity_id: parse.data.charityId,
        amount: parse.data.amount,
        donor_name: req.user?.id || "Anonymous"
      })
      .select()
      .single();

    if (error) throw error;
    return res.json({ donation });
  } catch (err) {
    return res.status(500).json({ message: "Failed to process donation" });
  }
});

// ============ DRAWS ============

router.get("/draws", async (req, res) => {
  try {
    const { data: draws } = await supabase
      .from("draws")
      .select("*")
      .order("created_at", { ascending: false });

    return res.json({ draws });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch draws" });
  }
});

router.post("/draws/simulate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { drawType } = req.body;
    const simulation = await simulateDraw(drawType, new Date());
    return res.json(simulation);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/draws/publish", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { drawType } = req.body;
    const result = await publishDraw(drawType, monthKey());
    
    // Send winner emails
    if (result.winnersCount > 0) {
      const { data: winnerUsers } = await supabase
        .from("winners")
        .select("id, user_id, match_type, payout_amount, users(email, full_name)")
        .eq("draw_month", monthKey());

      await Promise.all((winnerUsers || []).map((w) => 
        sendWinnerAlert(w.users?.email, w.users?.full_name, w.match_type, w.payout_amount)
      ));
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ============ WINNERS ============

router.get("/winners", requireAuth, async (req, res) => {
  try {
    const { data: winners } = await supabase
      .from("winners")
      .select("*")
      .order("created_at", { ascending: false });

    return res.json({ winners });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch winners" });
  }
});

router.get("/winners/winnings", requireAuth, async (req, res) => {
  try {
    const { data: winnings } = await supabase
      .from("winners")
      .select("id, match_type, payout_amount, payout_status, draws(month_key)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    return res.json({ winnings });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch winnings" });
  }
});

router.post("/winners/proof", requireAuth, async (req, res) => {
  try {
    const { winnerId, proof } = req.body;
    const { data: verification, error } = await supabase
      .from("winner_verifications")
      .insert({
        winner_id: winnerId,
        proof_file: proof,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;
    return res.json({ verification });
  } catch (err) {
    return res.status(500).json({ message: "Failed to upload proof" });
  }
});

// ============ DASHBOARD ============

router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const [{ data: scores }, { data: draws }, { data: winnings }, { data: subscription }, { data: charities }] = 
      await Promise.all([
        supabase.from("scores").select("*").eq("user_id", req.user.id).order("played_on", { ascending: false }).limit(5),
        supabase.from("draws").select("month_key, draw_type, status, created_at").order("created_at", { ascending: false }).limit(6),
        supabase
          .from("winners")
          .select("id, match_type, payout_amount, payout_status, draws(month_key)")
          .eq("user_id", req.user.id)
          .order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false }).maybeSingle(),
        supabase.from("charities").select("id, name").order("name", { ascending: true })
      ]);

    return res.json({
      scores: scores || [],
      drawCount: (draws || []).length,
      totalWon: (winnings || []).reduce((sum, w) => sum + (w.payout_status === 'paid' ? parseFloat(w.payout_amount) : 0), 0),
      subscription,
      charities: charities || [],
      winnings: winnings || []
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

router.get("/dashboard/admin", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [{ data: users }, { data: subscriptions }, { data: winners }] = 
      await Promise.all([
        supabase.from("users").select("id").eq("role", "subscriber"),
        supabase.from("subscriptions").select("id").eq("status", "active"),
        supabase.from("winners").select("id").eq("payout_status", "pending")
      ]);

    return res.json({
      totalUsers: users?.length || 0,
      activeSubscriptions: subscriptions?.length || 0,
      unpaidWinners: winners?.length || 0,
      recentWinners: []
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch admin stats" });
  }
});

module.exports = router;
