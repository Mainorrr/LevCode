const express = require("express");
const pool = require("../config/db");
const router = express.Router();

/**
 * GET /api/courses
 * Returns all courses with their groups.
 * Response: [{ id, name, groups: ['01', '02', ...] }]
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name,
             array_agg(cg.number ORDER BY cg.number) AS groups
      FROM courses c
      LEFT JOIN course_groups cg ON cg.course_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

module.exports = router;
