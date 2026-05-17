const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const pool = require("../config/db");
const env = require("../config/env");
const logger = require("../utils/logger");

const LOG_DIR = path.join(__dirname, "..", "log");

function sendLogFile(req, res, filename, downloadName) {
  const password = req.headers["x-api-password"];
  if (!password || (password !== env.API_PASSWORD && password !== env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const filePath = path.join(LOG_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archivo de log no disponible" });
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
  fs.createReadStream(filePath).pipe(res);
}

/**
 * GET /api/export/csv
 *
 * Descarga todos los registros de exercise_sessions como archivo CSV.
 * Requiere el header: X-API-Password: <API_PASSWORD>
 *
 * Uso con curl:
 *   curl -H "X-API-Password: tu_password" https://tu-backend.railway.app/api/export/csv -o datos.csv
 */
router.get("/csv", async (req, res) => {
  const password = req.headers["x-api-password"];

  if (!password || (password !== env.API_PASSWORD && password !== env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const result = await pool.query(
      `SELECT
         id,
         carnet,
         grupo,
         problem_id,
         attempts,
         solved,
         hide_tests,
         show_tries,
         try_timer,
         created_at,
         updated_at
       FROM exercise_sessions
       ORDER BY created_at ASC`,
    );

    const columns = [
      "id",
      "carnet",
      "grupo",
      "problem_id",
      "attempts",
      "solved",
      "created_at",
      "updated_at",
      "hide_tests",
      "show_tries",
      "try_timer",
    ];

    const header = columns.join(",");
    const rows = result.rows.map((row) =>
      columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        const str = String(val);
        // Escapar campos que contengan comas, comillas o saltos de línea
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(","),
    );

    const csv = [header, ...rows].join("\n");

    const filename = `levcode_sessions_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    logger.info("CSV export requested", { rows: result.rows.length });
    res.send(csv);
  } catch (err) {
    logger.error("CSV export failed", { error: err.message });
    res.status(500).json({ error: "Error al exportar datos" });
  }
});

/**
 * GET /api/export/attempts
 *
 * Descarga toda la tabla attempt_code como JSON. Se usa JSON en vez de CSV
 * porque el campo `code` contiene saltos de línea que rompen el formato CSV
 * para análisis externo. Incluye session_id como FK a exercise_sessions(id).
 * Requiere el header: X-API-Password: <API_PASSWORD>
 */
router.get("/attempts", async (req, res) => {
  const password = req.headers["x-api-password"];

  if (!password || (password !== env.API_PASSWORD && password !== env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const result = await pool.query(
      `SELECT id, session_id, attempt_number, code, created_at
       FROM attempt_code
       ORDER BY id ASC`,
    );

    const filename = `levcode_attempts_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    logger.info("Attempts JSON export requested", { rows: result.rows.length });
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    logger.error("Attempts JSON export failed", { error: err.message });
    res.status(500).json({ error: "Error al exportar intentos" });
  }
});

/**
 * GET /api/export/sus
 *
 * Descarga todas las respuestas del cuestionario SUS como archivo CSV.
 * Incluye sesiones que aún no fueron enviadas (submitted=false).
 * Requiere el header: X-API-Password: <API_PASSWORD>
 */
router.get("/sus", async (req, res) => {
  const password = req.headers["x-api-password"];

  if (!password || (password !== env.API_PASSWORD && password !== env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const result = await pool.query(
      `SELECT
         id, carnet, grupo, entry_time, submit_time, submitted,
         q1, q2, q3, q4, q5, q6, q7, q8, q9, q10
       FROM sus_responses
       ORDER BY entry_time ASC`,
    );

    const columns = [
      "id", "carnet", "grupo", "entry_time", "submit_time", "submitted",
      "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
    ];

    const header = columns.join(",");
    const rows = result.rows.map((row) =>
      columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(","),
    );

    const csv = [header, ...rows].join("\n");

    const filename = `levcode_sus_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    logger.info("SUS CSV export requested", { rows: result.rows.length });
    res.send(csv);
  } catch (err) {
    logger.error("SUS CSV export failed", { error: err.message });
    res.status(500).json({ error: "Error al exportar respuestas SUS" });
  }
});

/**
 * GET /api/export/log/events       — log.csv (eventos generales)
 * GET /api/export/log/submissions  — submissions_log.csv (ejecuciones de código)
 * GET /api/export/log/logins       — login_log.csv (eventos de login)
 * Todos requieren X-API-Password.
 */
router.get("/log/events", (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  sendLogFile(req, res, "log.csv", `levcode_events_${date}.csv`);
});

router.get("/log/submissions", (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  sendLogFile(req, res, "submissions_log.csv", `levcode_submissions_${date}.csv`);
});

router.get("/log/logins", (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  sendLogFile(req, res, "login_log.csv", `levcode_logins_${date}.csv`);
});

module.exports = router;
