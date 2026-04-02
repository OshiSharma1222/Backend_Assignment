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
const webRoutes = require("./routes/web");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(cors());
app.use(morgan("dev"));
app.use("/webhooks", webhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(attachUser);
app.use(attachSubscriptionStatus);
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use(webRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
