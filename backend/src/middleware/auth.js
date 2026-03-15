const logger = require("../utils/logger");
const env = require("../config/env");

/**
 * Middleware to validate API password on every request
 * Checks: X-API-Password header or password in body
 */
const authMiddleware = (req, res, next) => {
  // Skip auth for health check and limits (public endpoints)
  if (req.path === "/health" || req.path === "/api/submissions/limits") {
    return next();
  }

  // Extract password from header or body
  const password = req.headers["x-api-password"] || req.body?.password;

  // Validate password
  if (!password || password !== env.API_PASSWORD) {
    logger.warn("Invalid password attempt", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    return res.status(401).json({
      success: false,
      error: "Invalid password",
      code: "AUTH_FAILED",
    });
  }

  // Password is valid, continue
  next();
};

module.exports = authMiddleware;
