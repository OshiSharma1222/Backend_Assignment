const dayjs = require("dayjs");
const { supabase } = require("../db/supabase");

const PRIZE_SPLIT = {
  match_5: 0.4,
  match_4: 0.35,
  match_3: 0.25
};

function monthKey(date = dayjs()) {
  return date.format("YYYY-MM");
}

function randomUniqueNumbers(count = 5, min = 1, max = 45) {
  const set = new Set();
  while (set.size < count) {
    set.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return [...set].sort((a, b) => a - b);
}

function weightedNumbersFromScores(scores) {
  const freq = new Map();
  for (const score of scores) {
    freq.set(score.value, (freq.get(score.value) || 0) + 1);
  }

  const ranked = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([value]) => value);

  if (ranked.length >= 5) {
    return ranked.slice(0, 5).sort((a, b) => a - b);
  }

  const fillers = randomUniqueNumbers(5 + ranked.length).filter((n) => !ranked.includes(n));
  return [...ranked, ...fillers.slice(0, 5 - ranked.length)].sort((a, b) => a - b);
}

function countMatches(a, b) {
  const bSet = new Set(b);
  return a.reduce((sum, v) => sum + (bSet.has(v) ? 1 : 0), 0);
}

async function getOrCreateMonthlyPool(month) {
  const { data: existing } = await supabase
    .from("monthly_pools")
    .select("*")
    .eq("month_key", month)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("amount_paid")
    .eq("status", "active");

  const gross = (activeSubs || []).reduce((sum, row) => sum + Number(row.amount_paid || 0), 0);
  const existingRollover = await supabase
    .from("monthly_pools")
    .select("rollover_amount")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rollover = Number(existingRollover.data?.rollover_amount || 0);

  const payload = {
    month_key: month,
    gross_pool_amount: gross,
    rollover_amount: rollover,
    match_5_pool: Number((gross * PRIZE_SPLIT.match_5 + rollover).toFixed(2)),
    match_4_pool: Number((gross * PRIZE_SPLIT.match_4).toFixed(2)),
    match_3_pool: Number((gross * PRIZE_SPLIT.match_3).toFixed(2))
  };

  const { data, error } = await supabase
    .from("monthly_pools")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function generateDrawNumbers(drawType) {
  if (drawType === "algorithm") {
    const { data: recentScores } = await supabase
      .from("scores")
      .select("value")
      .order("played_on", { ascending: false })
      .limit(1000);

    return weightedNumbersFromScores((recentScores || []).map((s) => ({ value: Number(s.value) })));
  }

  return randomUniqueNumbers();
}

async function simulateDraw(drawType = "random", date = dayjs()) {
  const month = monthKey(date);
  const drawNumbers = await generateDrawNumbers(drawType);

  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .neq("role", "admin");

  const simulation = [];
  for (const user of users || []) {
    const { data: scores } = await supabase
      .from("scores")
      .select("value")
      .eq("user_id", user.id)
      .order("played_on", { ascending: false })
      .limit(5);

    if (!scores || scores.length < 5) {
      continue;
    }

    const ticket = scores.map((s) => Number(s.value));
    const matches = countMatches(ticket, drawNumbers);

    if (matches >= 3) {
      simulation.push({ user_id: user.id, matches });
    }
  }

  return { month, drawNumbers, simulation };
}

async function publishDraw(drawType = "random", month = monthKey()) {
  const { data: existingDraw } = await supabase
    .from("draws")
    .select("id, status")
    .eq("month_key", month)
    .maybeSingle();

  if (existingDraw && existingDraw.status === "published") {
    throw new Error("Draw already published for this month.");
  }

  const pool = await getOrCreateMonthlyPool(month);
  const drawNumbers = await generateDrawNumbers(drawType);

  const { data: draw, error: drawError } = await supabase
    .from("draws")
    .upsert({ month_key: month, draw_type: drawType, numbers: drawNumbers, status: "published" }, { onConflict: "month_key" })
    .select("*")
    .single();

  if (drawError) {
    throw drawError;
  }

  const { data: users } = await supabase
    .from("users")
    .select("id")
    .neq("role", "admin");

  const buckets = { match_5: [], match_4: [], match_3: [] };

  for (const user of users || []) {
    const { data: scores } = await supabase
      .from("scores")
      .select("value")
      .eq("user_id", user.id)
      .order("played_on", { ascending: false })
      .limit(5);

    if (!scores || scores.length < 5) {
      continue;
    }

    const matches = countMatches(scores.map((s) => Number(s.value)), drawNumbers);
    if (matches === 5) buckets.match_5.push(user.id);
    if (matches === 4) buckets.match_4.push(user.id);
    if (matches === 3) buckets.match_3.push(user.id);
  }

  const tierAmounts = {
    match_5: buckets.match_5.length ? pool.match_5_pool / buckets.match_5.length : 0,
    match_4: buckets.match_4.length ? pool.match_4_pool / buckets.match_4.length : 0,
    match_3: buckets.match_3.length ? pool.match_3_pool / buckets.match_3.length : 0
  };

  const winnerRows = [
    ...buckets.match_5.map((userId) => ({ draw_id: draw.id, user_id: userId, match_type: "match_5", payout_amount: Number(tierAmounts.match_5.toFixed(2)) })),
    ...buckets.match_4.map((userId) => ({ draw_id: draw.id, user_id: userId, match_type: "match_4", payout_amount: Number(tierAmounts.match_4.toFixed(2)) })),
    ...buckets.match_3.map((userId) => ({ draw_id: draw.id, user_id: userId, match_type: "match_3", payout_amount: Number(tierAmounts.match_3.toFixed(2)) }))
  ];

  if (winnerRows.length) {
    const { error } = await supabase.from("winners").insert(winnerRows);
    if (error) {
      throw error;
    }
  }

  const nextRollover = buckets.match_5.length ? 0 : Number(pool.match_5_pool || 0);
  await supabase
    .from("monthly_pools")
    .update({ rollover_amount: nextRollover })
    .eq("id", pool.id);

  return { draw, pool, winnersCount: winnerRows.length, buckets };
}

module.exports = {
  simulateDraw,
  publishDraw,
  monthKey
};
