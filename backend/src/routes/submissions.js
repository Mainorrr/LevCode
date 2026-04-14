const express = require("express");
const router = express.Router();
const pythonExecutor = require("../services/pythonExecutor");
const validators = require("../utils/validators");
const logger = require("../utils/logger");
const env = require("../config/env");

/**
 * POST /api/submissions
 * Submit Python code for execution
 * Requires: password header
 */
router.post("/", async (req, res) => {
  try {
    const { code, userId, problemId, input = "" } = req.body;

    // Validate request
    const validation = validators.validateSubmissionRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    logger.info("Submission received", { userId, problemId });

    // Execute Python code with optional stdin input
    const result = await pythonExecutor.execute(code, input);

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
      limits: pythonExecutor.getLimits(),
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
 * POST /api/submissions/batch
 * Submit Python code for execution against multiple test case inputs in a single container
 */
router.post("/batch", async (req, res) => {
  try {
    const { code, userId, problemId, inputs = [] } = req.body;

    if (!code || !userId || !problemId || !Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: code, userId, problemId, inputs (array)",
      });
    }

    // Validate code security
    const validation = validators.validateSubmissionRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Limit batch size and input sizes
    if (inputs.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Too many test cases (max 50)",
      });
    }

    if (inputs.some((inp) => typeof inp === "string" && inp.length > 100000)) {
      return res.status(400).json({
        success: false,
        error: "Input too large (max 100KB per input)",
      });
    }

    logger.info("Batch submission received", { userId, problemId, testCases: inputs.length });

    const result = await pythonExecutor.executeBatch(code, inputs);

    logger.info("Batch submission executed", {
      userId,
      problemId,
      success: result.success,
      executionTime: result.executionTime,
    });

    res.json({
      success: result.success,
      results: result.results,
      error: result.error,
      executionTime: result.executionTime,
    });
  } catch (error) {
    logger.error("Batch submission endpoint error", { error: error.message });

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
    limits: pythonExecutor.getLimits(),
  });
});

module.exports = router;
