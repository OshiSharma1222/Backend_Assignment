const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const env = require("./config/env");
const { attachUser } = require("./middleware/auth");
const { attachSubscriptionStatus } = require("./middleware/subscriptionStatus");
const webhookRoutes = require("./routes/webhooks");
const apiRoutes = require("./routes/api");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();

// CORS configuration for React frontend
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(morgan("dev"));

// Webhooks route MUST come before JSON parser for signature verification
app.use("/webhooks", webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(attachUser);
app.use(attachSubscriptionStatus);

// API Routes
app.use("/api", apiRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendPath));
  
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  // Development: return a simple message for non-API routes
  app.get(/.*/, (req, res) => {
    res.json({ message: "React frontend running on http://localhost:5173" });
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
  console.log(`React dev server should run on port 5173`);
});




