const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const logger = require("../utils/logger");
const csvLogger = require("../utils/csvLogger");
const {
  CATEGORY_QUOTAS,
  EXERCISES_BY_CATEGORY,
  TEST_CARNET,
  ALL_EXERCISE_IDS,
} = require("../config/exerciseAssignmentConfig");

/**
 * Selecciona los ejercicios balanceados por categoría.
 * Retorna lista de problem_id a asignar.
 */
async function pickBalancedAssignment() {
  const assigned = [];
  for (const [category, quota] of Object.entries(CATEGORY_QUOTAS)) {
    const candidates = EXERCISES_BY_CATEGORY[category] || [];
    const counts = [];
    for (const id of candidates) {
      const r = await pool.query(
        "SELECT COUNT(DISTINCT carnet)::int AS n FROM exercise_sessions WHERE problem_id = $1",
        [id],
      );
      counts.push({ id, count: r.rows[0].n });
    }
    // Ordenar por conteo ascendente; en empate, aleatorio
    counts.sort((a, b) => a.count - b.count || Math.random() - 0.5);
    for (let i = 0; i < quota && i < counts.length; i++) {
      assigned.push(counts[i].id);
    }
  }
  return assigned;
}

/**
 * Crea las filas iniciales en exercise_sessions con tratamientos rolados.
 * Los tratamientos se determinan UNA vez por estudiante (no por ejercicio)
 * usando la secuencia treatment_counter para mantener distribución equitativa.
 */
async function createInitialSessions(carnet, grupo, problemIds) {
  // Rolar tratamientos para el estudiante (consistente para todos sus ejercicios)
  const seq = await pool.query("SELECT nextval('treatment_counter') AS n");
  const n = Number(seq.rows[0].n) % 8;
  const hideTests = Boolean(n & 4);
  const showTries = Boolean(n & 2);
  const tryTimer = Boolean(n & 1);

  for (const problemId of problemIds) {
    await pool.query(
      `INSERT INTO exercise_sessions
         (carnet, grupo, problem_id, attempts, solved, hide_tests, show_tries, try_timer)
       VALUES ($1, $2, $3, 0, FALSE, $4, $5, $6)
       ON CONFLICT (carnet, problem_id) DO NOTHING`,
      [carnet, grupo, problemId, hideTests, showTries, tryTimer],
    );
  }
}

/**
 * GET /api/exercises/assignment/:carnet?grupo=XX
 *
 * Devuelve la lista de ejercicios asignados al estudiante.
 * - X00000 → siempre todos los ejercicios, sin persistir.
 * - Otros → si ya tienen asignación previa la devuelve; si no, ejecuta
 *   el algoritmo balanceado y crea las filas iniciales.
 */
router.get("/assignment/:carnet", async (req, res) => {
  const carnet = String(req.params.carnet || "").toUpperCase();
  const grupo = String(req.query.grupo || "").trim();

  if (!carnet) {
    return res.status(400).json({ success: false, error: "carnet requerido" });
  }

  // Caso especial: usuario de pruebas siempre ve todo.
  if (carnet === TEST_CARNET) {
    return res.json({ success: true, exercises: ALL_EXERCISE_IDS, fresh: false });
  }

  try {
    // ¿Ya tiene asignación?
    const existing = await pool.query(
      "SELECT problem_id FROM exercise_sessions WHERE carnet = $1",
      [carnet],
    );
    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        exercises: existing.rows.map((r) => r.problem_id),
        fresh: false,
      });
    }

    // Primera asignación — requiere grupo
    if (!grupo) {
      return res.status(400).json({
        success: false,
        error: "grupo requerido en primera asignación",
      });
    }

    const assigned = await pickBalancedAssignment();
    await createInitialSessions(carnet, grupo, assigned);

    logger.info("Exercise assignment created", {
      carnet,
      grupo,
      assigned,
    });
    try {
      csvLogger.logLogin("EXERCISES_ASSIGNED", {
        carnet,
        details: { grupo, assigned },
      });
    } catch {
      // no-op: el log CSV no debe romper la respuesta
    }

    res.json({ success: true, exercises: assigned, fresh: true });
  } catch (err) {
    logger.error("Exercise assignment failed", { error: err.message });
    res.status(500).json({ success: false, error: "Error al asignar ejercicios" });
  }
});

module.exports = router;
