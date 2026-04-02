const express = require("express");

const { constructWebhookEvent } = require("../services/stripeService");
const { activateSubscriptionFromPayment } = require("../services/subscriptionService");

const router = express.Router();

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    const event = constructWebhookEvent(req.body, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await activateSubscriptionFromPayment({
        userId: session.metadata?.userId,
        planType: session.metadata?.planType,
        charityPercentage: Number(session.metadata?.charityPercentage || 10),
        externalPaymentId: session.id,
        paymentProvider: "stripe"
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);
    return res.status(400).json({ message: "Webhook signature verification failed." });
  }
});

module.exports = router;
