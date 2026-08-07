const express = require("express");
const router = express.Router();
const codeExecutor = require("../services/codeExecutor");
const validators = require("../utils/validators");
const logger = require("../utils/logger");
const csvLogger = require("../utils/csvLogger");
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
      res.status(400).json({
        success: false,
        error: validation.error,
      });
      csvLogger.logSubmission("CODE_REJECTED", req, res, {
        carnet: userId,
        problem_id: problemId,
        success: false,
        code,
        error_message: validation.error,
        details: { endpoint: "single", reason: "validation" },
      });
      return;
    }

    logger.info("Submission received", { userId, problemId });

    // Execute Python code with optional stdin input
    const result = await codeExecutor.execute(code, input);

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
      limits: codeExecutor.getLimits(),
    });

    csvLogger.logSubmission("RUN_SINGLE", req, res, {
      carnet: userId,
      problem_id: problemId,
      success: result.success,
      code,
      input_length: (input || "").length,
      execution_time_ms: result.executionTime,
      had_runtime_error: Boolean(result.error),
      output: result.output,
      stderr: result.error,
    });
  } catch (error) {
    logger.error("Submission endpoint error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
    csvLogger.logSubmission("RUN_SINGLE", req, res, {
      carnet: req.body && req.body.userId,
      problem_id: req.body && req.body.problemId,
      success: false,
      code: (req.body && req.body.code) || "",
      error_message: error.message,
      details: { endpoint: "single", reason: "exception" },
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
      res.status(400).json({
        success: false,
        error: "Missing required fields: code, userId, problemId, inputs (array)",
      });
      csvLogger.logSubmission("CODE_REJECTED", req, res, {
        carnet: userId,
        problem_id: problemId,
        success: false,
        code: code || "",
        test_cases_total: Array.isArray(inputs) ? inputs.length : 0,
        error_message: "missing_fields",
        details: { endpoint: "batch", reason: "missing_fields" },
      });
      return;
    }

    // Validate code security
    const validation = validators.validateSubmissionRequest(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
      });
      csvLogger.logSubmission("CODE_REJECTED", req, res, {
        carnet: userId,
        problem_id: problemId,
        success: false,
        code,
        test_cases_total: inputs.length,
        error_message: validation.error,
        details: { endpoint: "batch", reason: "validation" },
      });
      return;
    }

    // Limit batch size and input sizes
    if (inputs.length > 50) {
      res.status(400).json({
        success: false,
        error: "Too many test cases (max 50)",
      });
      csvLogger.logSubmission("CODE_REJECTED", req, res, {
        carnet: userId,
        problem_id: problemId,
        success: false,
        code,
        test_cases_total: inputs.length,
        error_message: "too_many_test_cases",
        details: { endpoint: "batch", reason: "too_many_test_cases" },
      });
      return;
    }

    if (inputs.some((inp) => typeof inp === "string" && inp.length > 100000)) {
      res.status(400).json({
        success: false,
        error: "Input too large (max 100KB per input)",
      });
      csvLogger.logSubmission("CODE_REJECTED", req, res, {
        carnet: userId,
        problem_id: problemId,
        success: false,
        code,
        test_cases_total: inputs.length,
        error_message: "input_too_large",
        details: { endpoint: "batch", reason: "input_too_large" },
      });
      return;
    }

    logger.info("Batch submission received", { userId, problemId, testCases: inputs.length });

    const result = await codeExecutor.executeBatch(code, inputs);

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

    const firstStderr = Array.isArray(result.results)
      ? (result.results.find((r) => r && r.error) || {}).error || ""
      : "";
    const firstOutput = Array.isArray(result.results)
      ? (result.results[0] && result.results[0].output) || ""
      : "";
    csvLogger.logSubmission("RUN_BATCH", req, res, {
      carnet: userId,
      problem_id: problemId,
      success: result.success,
      code,
      input_length: inputs.reduce((sum, i) => sum + (typeof i === "string" ? i.length : 0), 0),
      test_cases_total: inputs.length,
      execution_time_ms: result.executionTime,
      had_runtime_error: Boolean(result.error || firstStderr),
      output: firstOutput,
      stderr: result.error || firstStderr,
      details: { endpoint: "batch" },
    });
  } catch (error) {
    logger.error("Batch submission endpoint error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
    csvLogger.logSubmission("RUN_BATCH", req, res, {
      carnet: req.body && req.body.userId,
      problem_id: req.body && req.body.problemId,
      success: false,
      code: (req.body && req.body.code) || "",
      test_cases_total: Array.isArray(req.body && req.body.inputs) ? req.body.inputs.length : 0,
      error_message: error.message,
      details: { endpoint: "batch", reason: "exception" },
    });
  }
});

/**
 * GET /api/submissions/limits
 * Get execution limits
 */
router.get("/limits", (req, res) => {
  res.json({
    limits: codeExecutor.getLimits(),
  });
});

module.exports = router;
