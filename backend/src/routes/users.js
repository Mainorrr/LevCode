const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/**
 * GET /api/users
 * Retorna todos los usuarios registrados con su carnet y grupo.
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT carnet, grupo FROM users ORDER BY grupo, carnet`
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/users/:carnet
 * Guarda el nombre completo del estudiante.
 */
router.patch("/:carnet", async (req, res) => {
  const { carnet } = req.params;
  const { nombre_completo } = req.body;

  if (!nombre_completo || !nombre_completo.trim()) {
    return res.status(400).json({ success: false, error: "nombre_completo es requerido" });
  }

  try {
    await pool.query(
      `UPDATE users SET nombre_completo = $1 WHERE carnet = $2`,
      [nombre_completo.trim(), carnet.toUpperCase()]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
