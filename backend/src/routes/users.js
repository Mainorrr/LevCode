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

module.exports = router;
