const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const logger = require("../utils/logger");
const csvLogger = require("../utils/csvLogger");

const CARNET_RE = /^[A-Za-z\d]{6}$/;

/**
 * GET /api/sus/status/:carnet
 * Retorna { exists, submitted } para decidir si el botón en el menú
 * debe mostrarse como pendiente o como "Ya respondido".
 */
router.get("/status/:carnet", async (req, res) => {
  const { carnet } = req.params;

  if (!CARNET_RE.test(carnet)) {
    return res.status(400).json({ error: "Carnet inválido" });
  }

  try {
    const result = await pool.query(
      `SELECT submitted FROM sus_responses WHERE carnet = $1 LIMIT 1`,
      [carnet],
    );

    if (result.rows.length === 0) {
      return res.json({ exists: false, submitted: false });
    }
    res.json({ exists: true, submitted: result.rows[0].submitted });
  } catch (err) {
    logger.error("Failed to fetch SUS status", { error: err.message });
    res.status(500).json({ error: "Error al consultar estado SUS" });
  }
});

/**
 * POST /api/sus/enter
 * Body: { carnet, grupo }
 * Crea la fila con entry_time si aún no existe. Es idempotente: si
 * el usuario reabre el cuestionario sin haberlo enviado, el entry_time
 * original se conserva.
 * 409 si ya fue enviado.
 */
router.post("/enter", async (req, res) => {
  const { carnet, grupo } = req.body;

  if (!carnet || !grupo) {
    return res
      .status(400)
      .json({ success: false, error: "Faltan campos: carnet, grupo" });
  }
  if (!CARNET_RE.test(carnet)) {
    return res.status(400).json({ success: false, error: "Carnet inválido" });
  }

  try {
    const existing = await pool.query(
      `SELECT submitted FROM sus_responses WHERE carnet = $1 LIMIT 1`,
      [carnet],
    );

    if (existing.rows.length > 0 && existing.rows[0].submitted) {
      return res
        .status(409)
        .json({ success: false, error: "El cuestionario ya fue enviado", submitted: true });
    }

    await pool.query(
      `INSERT INTO sus_responses (carnet, grupo)
       VALUES ($1, $2)
       ON CONFLICT (carnet) DO NOTHING`,
      [carnet, grupo],
    );

    logger.info("SUS entered", { carnet });
    res.json({ success: true });

    csvLogger.logEvent("SUS_ENTER", req, res, {
      carnet,
      grupo,
      success: true,
    });
  } catch (err) {
    logger.error("Failed to record SUS entry", { error: err.message });
    res.status(500).json({ success: false, error: "Error al registrar entrada" });
  }
});

/**
 * POST /api/sus/submit
 * Body: { carnet, q1..q10 }
 * Cierra el cuestionario marcando submitted=true y guardando las respuestas.
 * Requiere que exista la fila (debió hacerse /enter antes).
 * 409 si ya estaba enviado.
 */
router.post("/submit", async (req, res) => {
  const { carnet } = req.body;
  const answers = [];
  for (let i = 1; i <= 10; i++) {
    answers.push(req.body[`q${i}`]);
  }

  if (!carnet || !CARNET_RE.test(carnet)) {
    return res.status(400).json({ success: false, error: "Carnet inválido" });
  }

  for (let i = 0; i < 10; i++) {
    const v = answers[i];
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      return res.status(400).json({
        success: false,
        error: `Respuesta inválida en q${i + 1}: debe ser entero entre 1 y 5`,
      });
    }
  }

  try {
    const existing = await pool.query(
      `SELECT submitted FROM sus_responses WHERE carnet = $1 LIMIT 1`,
      [carnet],
    );

    if (existing.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No hay sesión SUS iniciada para este carnet",
      });
    }
    if (existing.rows[0].submitted) {
      return res
        .status(409)
        .json({ success: false, error: "El cuestionario ya fue enviado" });
    }

    await pool.query(
      `UPDATE sus_responses
         SET submitted   = TRUE,
             submit_time = NOW(),
             q1=$2, q2=$3, q3=$4, q4=$5, q5=$6,
             q6=$7, q7=$8, q8=$9, q9=$10, q10=$11
       WHERE carnet = $1`,
      [carnet, ...answers],
    );

    logger.info("SUS submitted", { carnet });
    res.json({ success: true });

    csvLogger.logEvent("SUS_SUBMIT", req, res, {
      carnet,
      success: true,
      details: {
        q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4],
        q6: answers[5], q7: answers[6], q8: answers[7], q9: answers[8], q10: answers[9],
      },
    });
  } catch (err) {
    logger.error("Failed to submit SUS", { error: err.message });
    res.status(500).json({ success: false, error: "Error al guardar respuestas" });
  }
});

module.exports = router;
