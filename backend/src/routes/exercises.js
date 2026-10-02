const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const logger = require("../utils/logger");
const csvLogger = require("../utils/csvLogger");
const {
  TEST_CARNET,
  ALL_EXERCISE_IDS,
} = require("../config/exerciseAssignmentConfig");

/**
 * Rola los tratamientos de un estudiante, o reutiliza los que ya tenga.
 *
 * Los tratamientos se determinan UNA vez por estudiante (no por ejercicio) con
 * la secuencia treatment_counter, que reparte las 8 combinaciones de manera
 * equitativa. Si el estudiante ya tiene filas, se reutilizan sus valores: un
 * ejercicio que se agregue despues no puede cambiarle el tratamiento a mitad de
 * la sesion, y tampoco debe consumir un numero de la secuencia.
 */
async function treatmentsFor(carnet) {
  const previos = await pool.query(
    `SELECT hide_tests, show_tries, try_timer FROM exercise_sessions
      WHERE carnet = $1 AND hide_tests IS NOT NULL LIMIT 1`,
    [carnet],
  );
  if (previos.rows.length > 0) {
    const r = previos.rows[0];
    return { hideTests: r.hide_tests, showTries: r.show_tries, tryTimer: r.try_timer };
  }

  const seq = await pool.query("SELECT nextval('treatment_counter') AS n");
  const n = Number(seq.rows[0].n) % 8;
  return {
    hideTests: Boolean(n & 4),
    showTries: Boolean(n & 2),
    tryTimer: Boolean(n & 1),
  };
}

/**
 * Asegura que el estudiante tenga una fila por cada ejercicio de la lista
 * actual, y retorna los ids que efectivamente se crearon.
 *
 * Es idempotente a proposito: la lista de ejercicios puede cambiar entre que un
 * estudiante entra por primera vez y el dia del experimento. Sin esto, su
 * asignacion queda congelada en los ejercicios que existian ese dia y en el
 * menu solo le aparecen los que sobrevivieron al cambio.
 */
async function ensureSessions(carnet, grupo) {
  const { hideTests, showTries, tryTimer } = await treatmentsFor(carnet);
  const creados = [];

  for (const problemId of ALL_EXERCISE_IDS) {
    const r = await pool.query(
      `INSERT INTO exercise_sessions
         (carnet, grupo, problem_id, attempts, solved, hide_tests, show_tries, try_timer)
       VALUES ($1, $2, $3, 0, FALSE, $4, $5, $6)
       ON CONFLICT (carnet, problem_id) DO NOTHING
       RETURNING problem_id`,
      [carnet, grupo, problemId, hideTests, showTries, tryTimer],
    );
    if (r.rows.length > 0) creados.push(problemId);
  }
  return creados;
}

/**
 * GET /api/exercises/assignment/:carnet?grupo=XX
 *
 * Todos los estudiantes hacen TODOS los ejercicios. El endpoint reconcilia en
 * cada login: crea las filas que falten para la lista actual, reutilizando los
 * tratamientos que el estudiante ya tenga.
 *
 * Devuelve siempre la lista actual, no lo que haya en la base. Un estudiante que
 * entro antes de un cambio de ejercicios tenia su asignacion congelada y en el
 * menu solo le aparecian los que sobrevivieron al cambio.
 *
 * - X00000 → siempre todos, sin persistir.
 * - Otros → se asegura de que tengan las cinco filas.
 */
router.get("/assignment/:carnet", async (req, res) => {
  const carnet = String(req.params.carnet || "").toUpperCase();
  let grupo = String(req.query.grupo || "").trim();

  if (!carnet) {
    return res.status(400).json({ success: false, error: "carnet requerido" });
  }

  // Caso especial: usuario de pruebas siempre ve todo.
  if (carnet === TEST_CARNET) {
    return res.json({ success: true, exercises: ALL_EXERCISE_IDS, fresh: false });
  }

  try {
    const existing = await pool.query(
      "SELECT problem_id, grupo FROM exercise_sessions WHERE carnet = $1",
      [carnet],
    );
    const yaTenia = existing.rows.length > 0;

    // El grupo solo hace falta para crear filas nuevas; si ya tiene, se reusa el
    // que quedo registrado y el estudiante no tiene que volver a informarlo.
    if (!grupo && yaTenia) grupo = existing.rows[0].grupo;
    if (!grupo) {
      return res.status(400).json({
        success: false,
        error: "grupo requerido en primera asignación",
      });
    }

    const creados = await ensureSessions(carnet, grupo);

    if (creados.length > 0) {
      logger.info("Exercise assignment reconciled", { carnet, grupo, creados });
      try {
        csvLogger.logLogin("EXERCISES_ASSIGNED", {
          carnet,
          details: { grupo, creados, primeraVez: !yaTenia },
        });
      } catch {
        // no-op: el log CSV no debe romper la respuesta
      }
    }

    res.json({ success: true, exercises: ALL_EXERCISE_IDS, fresh: !yaTenia });
  } catch (err) {
    logger.error("Exercise assignment failed", { error: err.message });
    res.status(500).json({ success: false, error: "Error al asignar ejercicios" });
  }
});

module.exports = router;
