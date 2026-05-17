const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");
const env = require("./config/env");
const submissionsRouter = require("./routes/submissions");
const sessionsRouter = require("./routes/sessions");
const susRouter = require("./routes/sus");
const exportRouter = require("./routes/export");
const adminRouter = require("./routes/admin");
const accessPasswordsRouter = require("./routes/accessPasswords");
const accessAuth = require("./middleware/accessAuth");
const requestTimer = require("./middleware/requestTimer");

const app = express();

// Middleware
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    credentials: false,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(requestTimer);

// Logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Routes
app.use("/api/submissions", accessAuth, submissionsRouter);
app.use("/api/sessions", accessAuth, sessionsRouter);
app.use("/api/sus", accessAuth, susRouter);
app.use("/api/export", exportRouter);
app.use("/api/admin", adminRouter);
app.use("/api/access", accessPasswordsRouter);

// Health check (public, no auth required)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Express error", { error: err.message });
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
