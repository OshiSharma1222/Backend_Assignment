# Golf Charity Subscription Platform (Express + Supabase)

This project implements the PRD requirements for the Digital Heroes full-stack trainee assignment using:
- Express.js backend
- Supabase PostgreSQL database
- EJS server-rendered dashboards (clean, simple UI)

## What Is Implemented

- User roles: public, subscriber, admin
- Auth: signup/login/logout with JWT cookie
- Subscriptions: monthly/yearly, renewal date, active/lapsed state
- Stripe billing flow:
  - Checkout Session for monthly/yearly plan
  - Success callback activation
  - Verified webhook activation (idempotent)
- Subscription gate: protected features require active plan
- Scores: Stableford `1-45`, rolling latest 5 scores only
- Draw engine:
  - Random or algorithmic generation
  - Simulation mode
  - Monthly publish mode
  - 5/4/3-match winner detection
  - Jackpot rollover for 5-match when no winner
- Prize logic:
  - 40% -> 5 match (rollover eligible)
  - 35% -> 4 match
  - 25% -> 3 match
  - Equal split within each tier
- Charity system:
  - Charity selection at signup
  - Min 10% subscription charity contribution
  - Independent donations
  - Charity directory + featured display
- Winner verification:
  - User uploads proof URL
  - Admin approve/reject
  - Payout status pending -> paid
- Email notifications:
  - Subscription activation
  - Draw winner alerts
  - Payout completed alerts
- Admin tools:
  - Draw controls
  - Charity CRUD (create implemented)
  - Winner payout controls
  - Summary metrics

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
copy .env.example .env
```

Fill `.env` values for Supabase and Stripe.

Stripe variables:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`

3. Create database schema

- Open Supabase SQL editor.
- Run [supabase/schema.sql](supabase/schema.sql).

4. Seed admin account (run in Supabase SQL editor)

```sql
insert into users (full_name, email, password_hash, role, charity_percentage)
values ('Admin User', 'admin@example.com', '$2b$10$GdSTI5Nw9uG2lM3L5m8U7eQ6hS8w5uC8UiU2xXf4nBf8mSaY2I8qi', 'admin', 10)
on conflict (email) do nothing;
```

Admin password for above hash: `admin123`

5. Run locally

```bash
npm run dev
```

## Main Routes

- `/` Home
- `/register` Register
- `/login` Login
- `/dashboard` Subscriber dashboard
- `/billing/success` Stripe checkout success callback
- `/charities` Charity directory
- `/winner-proof` Winner proof upload
- `/admin` Admin dashboard
- `/admin/winners` Winner verification review
- `/webhooks/stripe` Stripe webhook endpoint

## PRD Mapping Notes

- Real-time subscription check on every authenticated request is handled by middleware.
- Score replacement logic keeps the latest 5 by date.
- Draw execution is admin-triggered (monthly cadence controlled operationally).
- UI avoids golf cliche motifs and stays minimal/modern.

## Incremental Git Push Plan (one by one)

Use these exact commands in sequence:

```bash
git add package.json package-lock.json .gitignore .env.example
git commit -m "chore: initialize express project and environment setup"
git push

git add src/config src/db src/middleware src/app.js
git commit -m "feat: add app bootstrap, auth middleware, and subscription status checks"
git push

git add src/services src/routes
git commit -m "feat: implement subscription, score, draw, charity, and admin workflows"
git push

git add views public/css
git commit -m "feat: add clean server-rendered UI for public, user, and admin panels"
git push

git add supabase/schema.sql README.md
git commit -m "docs: add supabase schema and PRD-aligned setup documentation"
git push
```

## Known Practical Tradeoffs

- Stripe needs live keys and configured recurring prices in dashboard.
- Email notifications require SMTP env configuration.
- Image upload is URL-based to keep deployment simple for assignment constraints.
