const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const pool = require("../config/db");
const env = require("../config/env");
const logger = require("../utils/logger");
const csvLogger = require("../utils/csvLogger");
const { TEST_CARNET } = require("../config/exerciseAssignmentConfig");

const CARNET_RE = /^[A-Za-z\d]{6}$/;
const MAX_GRUPO = 50;

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Registra al estudiante en el grupo de la contraseña, o confirma que ya
 * estaba en ese grupo. Retorna { grupo, nuevo } con el grupo REGISTRADO, que
 * puede no coincidir con el pedido: decidirlo le toca a quien llama.
 *
 * INSERT ... ON CONFLICT DO NOTHING y luego SELECT: si dos ingresos del mismo
 * carnet llegan a la vez con contraseñas de grupos distintos, gana uno y el otro
 * ve ese grupo, en vez de quedar los dos registrados.
 */
async function registerStudent(carnet, grupo) {
  const ins = await pool.query(
    `INSERT INTO students (carnet, grupo) VALUES ($1, $2)
     ON CONFLICT (carnet) DO NOTHING
     RETURNING grupo`,
    [carnet, grupo],
  );
  if (ins.rows.length > 0) return { grupo, nuevo: true };

  const sel = await pool.query("SELECT grupo FROM students WHERE carnet = $1", [carnet]);
  return { grupo: sel.rows[0].grupo, nuevo: false };
}

/**
 * POST /api/access/validate
 * Body: { password, carnet }
 *
 * La contraseña determina el grupo: el estudiante no lo elige. No hay lista
 * precargada de carnets; el primer ingreso registra el carnet en el grupo de la
 * contraseña, y los siguientes deben usar una contraseña de ese mismo grupo.
 *
 * Responde { valid: true, grupo } para que el frontend use el grupo real.
 */
router.post("/validate", async (req, res) => {
  const { password, carnet } = req.body;
  const carnetStr = typeof carnet === "string" ? carnet.trim().toUpperCase() : "";
  const carnetForLog = carnetStr || "NONE";

  const fail = (status, error) => {
    res.status(status).json({ valid: false, error });
    csvLogger.logLogin("LOGIN_FAILED", { carnet: carnetForLog });
  };

  if (!password) return fail(400, "Contraseña requerida");
  if (!CARNET_RE.test(carnetStr)) {
    return fail(400, "Formato de carnet inválido. Debe tener exactamente 6 caracteres alfanuméricos.");
  }

  try {
    const result = await pool.query(
      "SELECT grupo FROM access_passwords WHERE password_hash = $1 LIMIT 1",
      [hashPassword(password)],
    );

    if (result.rows.length === 0) return fail(200, "Contraseña incorrecta");

    const grupo = result.rows[0].grupo;
    if (!grupo) {
      return fail(200, "Esta contraseña no tiene un grupo asignado. Avísele al profesor.");
    }

    // El usuario de pruebas no se registra: entra con cualquier contraseña y no
    // debe quedar atado a un grupo de estudiantes.
    if (carnetStr !== TEST_CARNET) {
      const registro = await registerStudent(carnetStr, grupo);
      if (registro.grupo !== grupo) {
        return fail(200, `Este carnet ya está registrado en el grupo ${registro.grupo}. Use la contraseña de su grupo.`);
      }
      if (registro.nuevo) {
        logger.info("Student registered", { carnet: carnetStr, grupo });
        csvLogger.logLogin("STUDENT_REGISTERED", { carnet: carnetStr });
      }
    }

    res.json({ valid: true, grupo });
    csvLogger.logLogin("LOGIN_SUCCESS", { carnet: carnetStr });
  } catch (err) {
    logger.error("Access password validation failed", { error: err.message });
    fail(500, "Error del servidor");
  }
});

/**
 * GET /api/access/passwords
 * Lists all access passwords (admin only). Returns id and created_at (never the hash).
 * Requires ADMIN_PASSWORD in body or header.
 */
router.get("/passwords", async (req, res) => {
  const password = req.headers["x-admin-password"];

  if (!password || password !== env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const result = await pool.query(
      "SELECT id, grupo, description, created_at FROM access_passwords ORDER BY grupo NULLS FIRST, created_at DESC",
    );
    res.json({ passwords: result.rows });
  } catch (err) {
    logger.error("List access passwords failed", { error: err.message });
    res.status(500).json({ error: "Error al consultar contraseñas" });
  }
});

/**
 * POST /api/access/passwords
 * Creates a new access password (admin only).
 * Body: { adminPassword, newPassword, grupo, description? }
 *
 * El grupo es obligatorio: es lo que la contraseña le asigna al estudiante.
 */
router.post("/passwords", async (req, res) => {
  const { adminPassword, newPassword, description, grupo } = req.body;

  if (!adminPassword || adminPassword !== env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (!newPassword || newPassword.trim().length === 0) {
    return res.status(400).json({ error: "La contraseña no puede estar vacía" });
  }

  const cleanGrupo = typeof grupo === "string" ? grupo.trim() : "";
  if (!cleanGrupo) {
    return res.status(400).json({ error: "Debe indicar el grupo de la contraseña" });
  }
  if (cleanGrupo.length > MAX_GRUPO) {
    return res.status(400).json({ error: `El grupo no puede exceder ${MAX_GRUPO} caracteres` });
  }

  const cleanDescription = typeof description === "string" ? description.trim() : "";
  if (cleanDescription.length > 200) {
    return res.status(400).json({ error: "La descripción no puede exceder 200 caracteres" });
  }

  try {
    const hash = hashPassword(newPassword.trim());

    // Check if password already exists
    const existing = await pool.query(
      "SELECT id FROM access_passwords WHERE password_hash = $1",
      [hash],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Esta contraseña ya existe" });
    }

    const result = await pool.query(
      "INSERT INTO access_passwords (password_hash, grupo, description) VALUES ($1, $2, $3) RETURNING id, grupo, description, created_at",
      [hash, cleanGrupo, cleanDescription || null],
    );

    logger.info("Access password created", { id: result.rows[0].id, grupo: cleanGrupo });
    res.status(201).json({ password: result.rows[0] });
  } catch (err) {
    logger.error("Create access password failed", { error: err.message });
    res.status(500).json({ error: "Error al crear contraseña" });
  }
});

/**
 * DELETE /api/access/passwords/:id
 * Deletes an access password (admin only).
 */
router.delete("/passwords/:id", async (req, res) => {
  const adminPassword = req.headers["x-admin-password"];

  if (!adminPassword || adminPassword !== env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM access_passwords WHERE id = $1 RETURNING id",
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contraseña no encontrada" });
    }

    logger.info("Access password deleted", { id: req.params.id });
    res.json({ deleted: true });
  } catch (err) {
    logger.error("Delete access password failed", { error: err.message });
    res.status(500).json({ error: "Error al eliminar contraseña" });
  }
});

module.exports = router;
