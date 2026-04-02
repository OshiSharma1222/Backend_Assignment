create extension if not exists "pgcrypto";

create table if not exists charities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_description text not null,
  long_description text,
  image_url text,
  upcoming_event text,
  is_featured boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('subscriber', 'admin')) default 'subscriber',
  selected_charity_id uuid references charities(id) on delete set null,
  charity_percentage numeric(5,2) not null default 10 check (charity_percentage >= 10 and charity_percentage <= 100),
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_type text not null check (plan_type in ('monthly', 'yearly')),
  amount_paid numeric(10,2) not null,
  status text not null check (status in ('active', 'cancelled', 'lapsed')) default 'active',
  charity_percentage numeric(5,2) not null,
  charity_amount numeric(10,2) not null,
  payment_provider text not null default 'manual',
  external_payment_id text,
  starts_at timestamptz not null,
  renews_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table subscriptions
  add column if not exists payment_provider text not null default 'manual';

alter table subscriptions
  add column if not exists external_payment_id text;

create unique index if not exists uq_subscriptions_external_payment_id
  on subscriptions (external_payment_id)
  where external_payment_id is not null;

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  value int not null check (value >= 1 and value <= 45),
  played_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists draws (
  id uuid primary key default gen_random_uuid(),
  month_key text not null unique,
  draw_type text not null check (draw_type in ('random', 'algorithm')),
  numbers int[] not null,
  status text not null check (status in ('draft', 'published')) default 'published',
  created_at timestamptz not null default now()
);

create table if not exists monthly_pools (
  id uuid primary key default gen_random_uuid(),
  month_key text not null unique,
  gross_pool_amount numeric(12,2) not null default 0,
  rollover_amount numeric(12,2) not null default 0,
  match_5_pool numeric(12,2) not null default 0,
  match_4_pool numeric(12,2) not null default 0,
  match_3_pool numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  match_type text not null check (match_type in ('match_5', 'match_4', 'match_3')),
  payout_amount numeric(12,2) not null,
  payout_status text not null check (payout_status in ('pending', 'paid')) default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists winner_verifications (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references winners(id) on delete cascade,
  screenshot_url text not null,
  review_status text not null check (review_status in ('pending', 'approved', 'rejected')) default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists independent_donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  charity_id uuid not null references charities(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

insert into charities (id, name, short_description, long_description, is_featured)
values
  ('11111111-1111-1111-1111-111111111111', 'Junior Golf Access Fund', 'Supports youth golf training and equipment grants.', 'Builds local opportunities for first-time golfers from underserved communities.', true),
  ('22222222-2222-2222-2222-222222222222', 'Cancer Relief Sport Trust', 'Funds patient support through community sporting events.', 'Combines golf charity days with treatment support initiatives.', true),
  ('33333333-3333-3333-3333-333333333333', 'Green Course Climate Initiative', 'Improves sustainable practices in community courses.', 'Focuses on water-saving, biodiversity, and low-impact turf management.', false),
  ('44444444-4444-4444-4444-444444444444', 'Women in Golf Foundation', 'Creates access and mentorship for women in golf.', 'Provides coaching grants, equipment, and outreach for girls and women entering the sport.', true),
  ('55555555-5555-5555-5555-555555555555', 'Veterans Fairway Support', 'Helps veterans rebuild community through sport.', 'Funds mental health, recreation, and rehabilitation programs linked to golf activities.', false),
  ('66666666-6666-6666-6666-666666666666', 'Community Sports Meals Network', 'Provides meals tied to local sports and charity events.', 'Supports food programs that partner with amateur tournaments and fundraising days.', false)
on conflict (name) do update set
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  is_featured = excluded.is_featured;
