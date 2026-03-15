const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const logger = require("../utils/logger");

/**
 * POST /api/sessions
 *
 * Registra o actualiza la sesión de un estudiante en un ejercicio.
 * Cada llamada representa un intento (submit de código).
 *
 * Body: { carnet, grupo, semestre, problemId, solved }
 *
 * Lógica de upsert:
 *   - Primera vez: crea el registro con attempts = 1
 *   - Intentos posteriores: incrementa attempts
 *   - solved: solo pasa a true; nunca revierte a false (si alguna vez lo resolvió, queda true)
 */
router.post("/", async (req, res) => {
  const { carnet, grupo, semestre, problemId, solved } = req.body;

  if (!carnet || !grupo || !semestre || !problemId) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos: carnet, grupo, semestre, problemId",
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
      `INSERT INTO exercise_sessions (carnet, grupo, semestre, problem_id, attempts, solved)
       VALUES ($1, $2, $3, $4, 1, $5)
       ON CONFLICT (carnet, problem_id) DO UPDATE
         SET attempts    = exercise_sessions.attempts + 1,
             solved      = exercise_sessions.solved OR EXCLUDED.solved,
             updated_at  = NOW()
       RETURNING id, carnet, problem_id, attempts, solved`,
      [carnet, grupo, Number(semestre), problemId, solved],
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

module.exports = router;
