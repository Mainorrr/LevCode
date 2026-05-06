const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const LOG_DIR = path.join(__dirname, "..", "log");
const MAIN_LOG = path.join(LOG_DIR, "log.csv");
const SUBMISSIONS_LOG = path.join(LOG_DIR, "submissions_log.csv");
const LOGIN_LOG = path.join(LOG_DIR, "login_log.csv");

const LOGIN_HEADERS = ["timestamp", "action_type", "carnet"];

const MAIN_HEADERS = [
  "timestamp",
  "action_type",
  "carnet",
  "problem_id",
  "attempts",
  "hide_tests",
  "show_tries",
  "try_timer",
];

const SUBMISSIONS_HEADERS = [
  "timestamp",
  "action_type",
  "carnet",
  "problem_id",
  "execution_time_ms",
];

function ensureFile(filePath, headers) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, headers.join(",") + "\n", "utf8");
  }
}

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  let s = typeof value === "string" ? value : String(value);
  if (/[",\r\n]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildRow(headers, data) {
  return headers.map((h) => escapeCell(data[h])).join(",") + "\n";
}

function commonFields(req, res) {
  const startedAt = req._startedAt || Date.now();
  return {
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startedAt,
    http_status: res.statusCode,
  };
}

/**
 * Log an event to log.csv (general user events).
 */
function logEvent(actionType, req, res, payload = {}) {
  try {
    ensureFile(MAIN_LOG, MAIN_HEADERS);
    const row = {
      ...commonFields(req, res),
      action_type: actionType,
      carnet: payload.carnet || "",
      grupo: payload.grupo || "",
      problem_id: payload.problem_id || "",
      success: payload.success === undefined ? "" : payload.success,
      attempts: payload.attempts === undefined ? "" : payload.attempts,
      solved: payload.solved === undefined ? "" : payload.solved,
      hide_tests: payload.hide_tests === undefined ? "" : payload.hide_tests,
      show_tries: payload.show_tries === undefined ? "" : payload.show_tries,
      try_timer: payload.try_timer === undefined ? "" : payload.try_timer,
    };
    fs.appendFileSync(MAIN_LOG, buildRow(MAIN_HEADERS, row), "utf8");
  } catch (err) {
    logger.warn("csvLogger.logEvent failed", { error: err.message });
  }
}

/**
 * Log a submission event to submissions_log.csv (code execution events).
 */
function logSubmission(actionType, req, res, payload = {}) {
  try {
    ensureFile(SUBMISSIONS_LOG, SUBMISSIONS_HEADERS);
    const row = {
      ...commonFields(req, res),
      action_type: actionType,
      carnet: payload.carnet || "",
      problem_id: payload.problem_id || "",
      execution_time_ms: payload.execution_time_ms === undefined ? "" : payload.execution_time_ms,
    };
    fs.appendFileSync(SUBMISSIONS_LOG, buildRow(SUBMISSIONS_HEADERS, row), "utf8");
  } catch (err) {
    logger.warn("csvLogger.logSubmission failed", { error: err.message });
  }
}

/**
 * Log a login event to login_log.csv. Skips writing if carnet is empty.
 */
function logLogin(actionType, payload = {}) {
  const carnet = (payload.carnet || "").trim();
  if (!carnet) return;
  try {
    ensureFile(LOGIN_LOG, LOGIN_HEADERS);
    const row = {
      timestamp: new Date().toISOString(),
      action_type: actionType,
      carnet,
    };
    fs.appendFileSync(LOGIN_LOG, buildRow(LOGIN_HEADERS, row), "utf8");
  } catch (err) {
    logger.warn("csvLogger.logLogin failed", { error: err.message });
  }
}

module.exports = { logEvent, logSubmission, logLogin };
