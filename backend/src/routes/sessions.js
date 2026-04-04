const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const logger = require("../utils/logger");

/**
 * POST /api/sessions
 *
 * Registra o actualiza la sesión de un estudiante en un ejercicio.
 *
 * Body: { carnet, grupo, curso, problemId, solved }
 *
 * Lógica de upsert:
 *   - Primera vez (abrir ejercicio): crea el registro con attempts = 0, solved = false
 *   - Intentos posteriores (submit): incrementa attempts
 *   - solved: solo pasa a true; nunca revierte a false
 *   - Si ya está solved: no incrementa attempts ni actualiza updated_at
 */
router.post("/", async (req, res) => {
  const { carnet, grupo, curso, problemId, solved } = req.body;

  if (!carnet || !grupo || !curso || !problemId) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos: carnet, grupo, curso, problemId",
    });
  }

  if (typeof solved !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "El campo solved debe ser un booleano",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO exercise_sessions (carnet, grupo, curso, problem_id, attempts, solved)
       VALUES ($1, $2, $3, $4, 0, $5)
       ON CONFLICT (carnet, problem_id) DO UPDATE
         SET attempts    = CASE
                             WHEN exercise_sessions.solved THEN exercise_sessions.attempts
                             ELSE exercise_sessions.attempts + 1
                           END,
             solved      = exercise_sessions.solved OR EXCLUDED.solved,
             updated_at  = CASE
                             WHEN exercise_sessions.solved THEN exercise_sessions.updated_at
                             ELSE NOW()
                           END
       RETURNING id, carnet, problem_id, attempts, solved`,
      [carnet, grupo, curso, problemId, solved],
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

module.exports = router;
