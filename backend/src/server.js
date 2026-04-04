const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");
const env = require("./config/env");
const submissionsRouter = require("./routes/submissions");
const sessionsRouter = require("./routes/sessions");
const exportRouter = require("./routes/export");
const adminRouter = require("./routes/admin");

const app = express();

// Middleware
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  }),
);

app.use(express.json({ limit: "1mb" }));

// Logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Routes
app.use("/api/submissions", submissionsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/export", exportRouter);
app.use("/api/admin", adminRouter);

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
