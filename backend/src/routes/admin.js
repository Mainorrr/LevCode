const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * POST /api/admin/sessions
 *
 * Retorna todos los registros de exercise_sessions.
 * Requiere password en el body. Todo el filtrado se hace en el frontend.
 *
 * Body: { password }
 */
router.post("/sessions", async (req, res) => {
  const { password } = req.body;

  if (!password || password !== env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  try {
    const result = await pool.query(
      `SELECT id, carnet, grupo, problem_id, attempts, solved, hide_tests, show_tries, try_timer, created_at, updated_at
       FROM exercise_sessions
       ORDER BY created_at DESC`,
    );

    logger.info("Admin data requested", { rows: result.rows.length });
    res.json({ sessions: result.rows });
  } catch (err) {
    logger.error("Admin query failed", { error: err.message });
    res.status(500).json({ error: "Error al consultar datos" });
  }
});

module.exports = router;
