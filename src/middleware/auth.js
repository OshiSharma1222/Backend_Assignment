const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { supabase } = require("../db/supabase");

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

async function attachUser(req, _res, next) {
  const token = req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const { data: user } = await supabase
      .from("users")
      .select("id, email, full_name, role, selected_charity_id, charity_percentage")
      .eq("id", decoded.sub)
      .single();

    req.user = user || null;
    return next();
  } catch (_err) {
    req.user = null;
    return next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect("/login");
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).render("error", {
      title: "Forbidden",
      message: "Admin access required.",
      user: req.user
    });
  }
  return next();
}

module.exports = {
  signToken,
  setAuthCookie,
  attachUser,
  requireAuth,
  requireAdmin
};
