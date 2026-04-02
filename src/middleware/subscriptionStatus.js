const dayjs = require("dayjs");
const { supabase } = require("../db/supabase");

async function attachSubscriptionStatus(req, res, next) {
  if (!req.user) {
    req.subscription = null;
    res.locals.subscription = null;
    return next();
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let normalized = subscription || null;
  if (normalized && dayjs(normalized.renews_at).isBefore(dayjs())) {
    normalized = { ...normalized, status: "lapsed" };
  }

  req.subscription = normalized;
  res.locals.subscription = normalized;
  return next();
}

function requireActiveSubscription(req, res, next) {
  if (!req.subscription || req.subscription.status !== "active") {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ message: "You need an active subscription to access this feature." });
    }

    return res.status(403).render("error", {
      title: "Subscription Required",
      message: "You need an active subscription to access this feature.",
      user: req.user
    });
  }
  return next();
}

module.exports = { attachSubscriptionStatus, requireActiveSubscription };
