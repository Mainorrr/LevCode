const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const logger = require("../utils/logger");

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
  const { carnet, grupo, problemId, solved, solutionCode } = req.body;

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
      // Primera vez: aleatorizar
      hideTests = Math.random() < 0.5;
      showTries = Math.random() < 0.5;
      tryTimer = Math.random() < 0.5;
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
             solution_code  = CASE
                                WHEN NOT exercise_sessions.solved AND $8::TEXT IS NOT NULL THEN $8::TEXT
                                ELSE exercise_sessions.solution_code
                              END,
             updated_at     = CASE
                                WHEN exercise_sessions.solved THEN exercise_sessions.updated_at
                                ELSE NOW()
                              END
       RETURNING id, carnet, problem_id, attempts, solved, hide_tests, show_tries, try_timer`,
      [carnet, grupo, problemId, solved, hideTests, showTries, tryTimer, solved ? (solutionCode ?? null) : null],
    );

    const row = result.rows[0];

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
  } catch (err) {
    logger.error("Failed to record session", { error: err.message });
    res.status(500).json({ success: false, error: "Error al guardar la sesión" });
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
      `SELECT attempts, solved, hide_tests, show_tries, try_timer, solution_code
       FROM exercise_sessions WHERE carnet = $1 AND problem_id = $2`,
      [carnet, problemId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Sesión no encontrada" });
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
  } catch (err) {
    logger.error("Failed to fetch session", { error: err.message });
    res.status(500).json({ success: false, error: "Error al consultar sesión" });
  }
});

module.exports = router;
