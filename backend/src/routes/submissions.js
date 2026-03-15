const express = require("express");
const router = express.Router();
const javaExecutor = require("../services/javaExecutor");
const validators = require("../utils/validators");
const logger = require("../utils/logger");
const env = require("../config/env");

/**
 * POST /api/submissions
 * Submit Java code for execution
 * Requires: password header
 */
router.post("/", async (req, res) => {
  try {
    const { code, userId, problemId } = req.body;

    // Validate request
    const validation = validators.validateSubmissionRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    logger.info("Submission received", { userId, problemId });

    // Execute Java code
    const result = await javaExecutor.execute(code);

    logger.info("Submission executed", {
      userId,
      problemId,
      success: result.success,
      executionTime: result.executionTime,
    });

    // Return result
    res.json({
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      limits: javaExecutor.getLimits(),
    });
  } catch (error) {
    logger.error("Submission endpoint error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/submissions/limits
 * Get execution limits
 */
router.get("/limits", (req, res) => {
  res.json({
    limits: javaExecutor.getLimits(),
  });
});

module.exports = router;
