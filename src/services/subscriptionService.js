const dayjs = require("dayjs");
const env = require("../config/env");
const { supabase } = require("../db/supabase");
const { sendSubscriptionActivated } = require("./emailService");

function getPlanAmount(planType) {
  return planType === "yearly" ? env.yearlyPlanAmount : env.monthlyPlanAmount;
}

function getNextRenewal(planType, start = dayjs()) {
  return planType === "yearly" ? start.add(1, "year") : start.add(1, "month");
}

async function createOrRenewSubscription(userId, planType, charityPercentage, options = {}) {
  const amount = getPlanAmount(planType);
  const startDate = dayjs();
  const renewalDate = getNextRenewal(planType, startDate).toISOString();
  const charityAmount = Number(((amount * charityPercentage) / 100).toFixed(2));
  const externalPaymentId = options.externalPaymentId || null;
  const paymentProvider = options.paymentProvider || "manual";

  if (externalPaymentId) {
    const { data: existingByPayment } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("external_payment_id", externalPaymentId)
      .maybeSingle();

    if (existingByPayment) {
      return existingByPayment;
    }
  }

  const payload = {
    user_id: userId,
    plan_type: planType,
    amount_paid: amount,
    status: "active",
    charity_percentage: charityPercentage,
    charity_amount: charityAmount,
    starts_at: startDate.toISOString(),
    renews_at: renewalDate,
    payment_provider: paymentProvider,
    external_payment_id: externalPaymentId
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  await sendSubscriptionActivated(user?.email, planType, new Date(renewalDate).toDateString());

  return data;
}

async function activateSubscriptionFromPayment({
  userId,
  planType,
  charityPercentage,
  externalPaymentId,
  paymentProvider
}) {
  if (!userId || !planType) {
    throw new Error("Missing payment metadata for subscription activation.");
  }

  return createOrRenewSubscription(userId, planType, Math.max(10, Number(charityPercentage || 10)), {
    externalPaymentId,
    paymentProvider
  });
}

module.exports = { createOrRenewSubscription, getPlanAmount, activateSubscriptionFromPayment };
