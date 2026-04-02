const dotenv = require("dotenv");

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const required = [
  "JWT_SECRET",
  "APP_BASE_URL"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  supabaseUrl,
  supabaseServiceRoleKey,
  jwtSecret: process.env.JWT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  monthlyPlanAmount: Number(process.env.MONTHLY_PLAN_AMOUNT || 49),
  yearlyPlanAmount: Number(process.env.YEARLY_PLAN_AMOUNT || 490),
  defaultCharityPct: Number(process.env.DEFAULT_CHARITY_PCT || 10),
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "noreply@golfcharity.app",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePriceMonthly: process.env.STRIPE_PRICE_MONTHLY || "",
  stripePriceYearly: process.env.STRIPE_PRICE_YEARLY || ""
};
