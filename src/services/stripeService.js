const Stripe = require("stripe");
const env = require("../config/env");

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

function isStripeEnabled() {
  return Boolean(stripe && env.stripeWebhookSecret && env.stripePriceMonthly && env.stripePriceYearly);
}

function getPriceId(planType) {
  return planType === "yearly" ? env.stripePriceYearly : env.stripePriceMonthly;
}

async function createCheckoutSession({ user, planType, charityPercentage }) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const priceId = getPriceId(planType);
  if (!priceId) {
    throw new Error("Stripe price ID is missing for selected plan.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    success_url: `${env.appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appBaseUrl}/dashboard`,
    metadata: {
      userId: user.id,
      planType,
      charityPercentage: String(charityPercentage)
    }
  });

  return session;
}

async function retrieveCheckoutSession(sessionId) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  return stripe.checkout.sessions.retrieve(sessionId);
}

function constructWebhookEvent(rawBody, signature) {
  if (!stripe || !env.stripeWebhookSecret) {
    throw new Error("Stripe webhook is not configured.");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

module.exports = {
  isStripeEnabled,
  createCheckoutSession,
  retrieveCheckoutSession,
  constructWebhookEvent
};
