const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const logger = require("../utils/logger");
const csvLogger = require("../utils/csvLogger");

/**
 * POST /api/sessions
 *
 * Registra o actualiza la sesión de un estudiante en un ejercicio.
 *
 * Body: { carnet, grupo, problemId, solved }
 *
 * Lógica de upsert:
 *   - Primera vez (abrir ejercicio): crea el registro con attempts = 0, solved = false
 *   - Intentos posteriores (submit): incrementa attempts
 *   - solved: solo pasa a true; nunca revierte a false
 *   - Si ya está solved: no incrementa attempts ni actualiza updated_at
 */
router.post("/", async (req, res) => {
  const { carnet, grupo, problemId, solved, code } = req.body;

  if (!carnet || !grupo || !problemId) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos: carnet, grupo, problemId",
    });
  }

  if (typeof solved !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "El campo solved debe ser un booleano",
    });
  }

  try {
    // Estado previo de esta sesión (para distinguir start vs attempt vs solved)
    const prior = await pool.query(
      `SELECT attempts, solved FROM exercise_sessions
       WHERE carnet = $1 AND problem_id = $2 LIMIT 1`,
      [carnet, problemId],
    );
    const priorRow = prior.rows[0] || null;

    // Buscar tratamientos existentes del usuario para mantener consistencia
    const existing = await pool.query(
      `SELECT hide_tests, show_tries, try_timer FROM exercise_sessions
       WHERE carnet = $1 AND hide_tests IS NOT NULL LIMIT 1`,
      [carnet],
    );

    let hideTests, showTries, tryTimer;
    if (existing.rows.length > 0) {
      // Reutilizar tratamientos del primer ejercicio
      hideTests = existing.rows[0].hide_tests;
      showTries = existing.rows[0].show_tries;
      tryTimer = existing.rows[0].try_timer;
    } else {
      // Primera vez: asignar secuencialmente con tabla de verdad de 3 bits.
      // bit 2 = hide_tests, bit 1 = show_tries, bit 0 = try_timer.
      // Recorre 0..7 cíclicamente para distribución equitativa entre estudiantes.
      const seq = await pool.query(
        "SELECT nextval('treatment_counter') AS n",
      );
      const n = Number(seq.rows[0].n) % 8;
      hideTests = Boolean(n & 4);
      showTries = Boolean(n & 2);
      tryTimer = Boolean(n & 1);
    }

    const result = await pool.query(
      `INSERT INTO exercise_sessions (carnet, grupo, problem_id, attempts, solved, hide_tests, show_tries, try_timer)
       VALUES ($1, $2, $3, 0, $4, $5, $6, $7)
       ON CONFLICT (carnet, problem_id) DO UPDATE
         SET attempts       = CASE
                                WHEN exercise_sessions.solved THEN exercise_sessions.attempts
                                ELSE exercise_sessions.attempts + 1
                              END,
             solved         = exercise_sessions.solved OR EXCLUDED.solved,
             updated_at     = CASE
                                WHEN exercise_sessions.solved THEN exercise_sessions.updated_at
                                ELSE NOW()
                              END
       RETURNING id, carnet, problem_id, attempts, solved, hide_tests, show_tries, try_timer`,
      [carnet, grupo, problemId, solved, hideTests, showTries, tryTimer],
    );

    const row = result.rows[0];

    // Guardar código del intento (solo cuando es un submit real, no el primer abrir).
    // priorRow null + solved false + sin code = EXERCISE_START sin código.
    const isRealAttempt =
      priorRow && !priorRow.solved && typeof code === "string" && code.length > 0;
    if (isRealAttempt) {
      try {
        await pool.query(
          `INSERT INTO attempt_code (session_id, attempt_number, code)
           VALUES ($1, $2, $3)
           ON CONFLICT (session_id, attempt_number) DO NOTHING`,
          [row.id, row.attempts, code],
        );
      } catch (e) {
        logger.warn("Failed to save attempt_code", { error: e.message });
      }
    }

    logger.info("Session recorded", {
      carnet,
      problemId,
      attempts: row.attempts,
      solved: row.solved,
    });

    res.json({
      success: true,
      attempts: row.attempts,
      solved: row.solved,
      hideTests: row.hide_tests,
      showTries: row.show_tries,
      tryTimer: row.try_timer,
    });

    // Determinar tipo de evento
    let actionType;
    const detailsExtra = {};
    if (!priorRow) {
      actionType = "EXERCISE_START";
      detailsExtra.first_exercise = existing.rows.length === 0;
    } else if (!priorRow.solved && row.solved) {
      actionType = "EXERCISE_SOLVED";
      detailsExtra.attempt_number = row.attempts;
      detailsExtra.solution_code_length = (solutionCode || "").length;
    } else if (!priorRow.solved && !row.solved) {
      actionType = "ATTEMPT_FAIL";
      detailsExtra.attempt_number = row.attempts;
    } else {
      // Ya estaba solved — no-op informativo, no se loggea
      actionType = null;
    }

    if (actionType) {
      csvLogger.logEvent(actionType, req, res, {
        carnet,
        grupo,
        problem_id: problemId,
        success: true,
        attempts: row.attempts,
        solved: row.solved,
        hide_tests: row.hide_tests,
        show_tries: row.show_tries,
        try_timer: row.try_timer,
        details: detailsExtra,
      });
    }
  } catch (err) {
    logger.error("Failed to record session", { error: err.message });
    res.status(500).json({ success: false, error: "Error al guardar la sesión" });
    csvLogger.logEvent("SESSION_ERROR", req, res, {
      carnet,
      grupo,
      problem_id: problemId,
      success: false,
      error_message: err.message,
    });
  }
});

/**
 * GET /api/sessions/status/:carnet
 *
 * Retorna el estado de todos los ejercicios de un estudiante.
 * Response: { solved: ["id1", ...], inProgress: ["id2", ...] }
 */
router.get("/status/:carnet", async (req, res) => {
  const { carnet } = req.params;

  try {
    const result = await pool.query(
      `SELECT problem_id, solved FROM exercise_sessions
       WHERE carnet = $1`,
      [carnet],
    );

    const solved = [];
    const inProgress = [];
    for (const row of result.rows) {
      if (row.solved) {
        solved.push(row.problem_id);
      } else {
        inProgress.push(row.problem_id);
      }
    }

    res.json({ solved, inProgress });
  } catch (err) {
    logger.error("Failed to fetch exercise status", { error: err.message });
    res.status(500).json({ error: "Error al consultar estado de ejercicios" });
  }
});

/**
 * GET /api/sessions/treatments/:carnet
 *
 * Retorna los tratamientos asignados al estudiante por ejercicio.
 * Response: { treatments: [{ problemId, hideTests, showTries, tryTimer }, ...] }
 */
router.get("/treatments/:carnet", async (req, res) => {
  const { carnet } = req.params;

  try {
    const result = await pool.query(
      `SELECT problem_id, hide_tests, show_tries, try_timer
       FROM exercise_sessions WHERE carnet = $1`,
      [carnet],
    );

    res.json({
      treatments: result.rows.map((row) => ({
        problemId: row.problem_id,
        hideTests: row.hide_tests,
        showTries: row.show_tries,
        tryTimer: row.try_timer,
      })),
    });
  } catch (err) {
    logger.error("Failed to fetch treatments", { error: err.message });
    res.status(500).json({ error: "Error al consultar tratamientos" });
  }
});

/**
 * GET /api/sessions/:carnet/:problemId
 *
 * Retorna los datos de una sesión específica sin modificarla.
 * Response: { success, attempts, solved, hideTests, showTries, tryTimer } o 404.
 */
router.get("/:carnet/:problemId", async (req, res) => {
  const { carnet, problemId } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.attempts, s.solved, s.hide_tests, s.show_tries, s.try_timer,
              (SELECT ac.code FROM attempt_code ac
                 WHERE ac.session_id = s.id
                 ORDER BY ac.attempt_number DESC LIMIT 1) AS solution_code
       FROM exercise_sessions s WHERE s.carnet = $1 AND s.problem_id = $2`,
      [carnet, problemId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Sesión no encontrada" });
      csvLogger.logEvent("EXERCISE_OPEN", req, res, {
        carnet,
        problem_id: problemId,
        success: false,
        details: { found: false },
      });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      attempts: row.attempts,
      solved: row.solved,
      hideTests: row.hide_tests,
      showTries: row.show_tries,
      tryTimer: row.try_timer,
      solutionCode: row.solution_code ?? null,
    });

    csvLogger.logEvent("EXERCISE_OPEN", req, res, {
      carnet,
      problem_id: problemId,
      success: true,
      attempts: row.attempts,
      solved: row.solved,
      hide_tests: row.hide_tests,
      show_tries: row.show_tries,
      try_timer: row.try_timer,
      details: { found: true },
    });
  } catch (err) {
    logger.error("Failed to fetch session", { error: err.message });
    res.status(500).json({ success: false, error: "Error al consultar sesión" });
    csvLogger.logEvent("EXERCISE_OPEN", req, res, {
      carnet,
      problem_id: problemId,
      success: false,
      error_message: err.message,
    });
  }
});

module.exports = router;
