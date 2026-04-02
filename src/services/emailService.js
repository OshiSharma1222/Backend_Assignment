const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = env.smtpHost
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: false,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined
    })
  : null;

async function sendEmail(to, subject, text) {
  if (!transporter || !to) {
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text
  });
}

async function sendSubscriptionActivated(to, planType, renewDateText) {
  await sendEmail(to, "Subscription activated", `Your ${planType} subscription is active. Renewal date: ${renewDateText}.`);
}

async function sendWinnerAlert(to, fullName, matchType, payoutAmount) {
  await sendEmail(
    to,
    "You won in the monthly draw",
    `Congratulations ${fullName || "Subscriber"}. You won ${matchType} with payout $${Number(payoutAmount).toFixed(2)}.`
  );
}

async function sendPayoutCompleted(to, payoutAmount) {
  await sendEmail(to, "Payout completed", `Your winning payout of $${Number(payoutAmount).toFixed(2)} has been marked as paid.`);
}

module.exports = { sendEmail, sendSubscriptionActivated, sendWinnerAlert, sendPayoutCompleted };
