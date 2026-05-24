const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const pool = require("../config/db");
const env = require("../config/env");
const logger = require("../utils/logger");
const csvLogger = require("../utils/csvLogger");
const { carnetBelongsToGroup } = require("../Users/usersLoader");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * POST /api/access/validate
 * Validates a student access password.
 * Body: { password }
 */
router.post("/validate", async (req, res) => {
  const { password, carnet, grupo } = req.body;
  const carnetStr = typeof carnet === "string" ? carnet.trim().toUpperCase() : "";
  const grupoStr = typeof grupo === "string" ? grupo.trim() : "";

  const carnetForFail = carnetStr || "NONE";

  if (!password) {
    res.status(400).json({ valid: false, error: "Contraseña requerida" });
    csvLogger.logLogin("LOGIN_FAILED", { carnet: carnetForFail });
    return;
  }

  try {
    const hash = hashPassword(password);
    const result = await pool.query(
      "SELECT id FROM access_passwords WHERE password_hash = $1 LIMIT 1",
      [hash],
    );

    if (result.rows.length === 0) {
      res.json({ valid: false, error: "Contraseña incorrecta" });
      csvLogger.logLogin("LOGIN_FAILED", { carnet: carnetForFail });
      return;
    }

    // Verificación de carnet/grupo: el carnet debe pertenecer al grupo seleccionado.
    if (carnetStr && grupoStr) {
      if (!carnetBelongsToGroup(carnetStr, grupoStr)) {
        res.json({ valid: false, error: "El carnet no forma parte de este grupo" });
        csvLogger.logLogin("LOGIN_FAILED", { carnet: carnetForFail });
        return;
      }
    }

    res.json({ valid: true });
    csvLogger.logLogin("LOGIN_SUCCESS", { carnet: carnetStr });
  } catch (err) {
    logger.error("Access password validation failed", { error: err.message });
    res.status(500).json({ valid: false, error: "Error del servidor" });
    csvLogger.logLogin("LOGIN_FAILED", { carnet: carnetForFail });
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
      "SELECT id, description, created_at FROM access_passwords ORDER BY created_at DESC",
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
 * Body: { adminPassword, newPassword }
 */
router.post("/passwords", async (req, res) => {
  const { adminPassword, newPassword, description } = req.body;

  if (!adminPassword || adminPassword !== env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (!newPassword || newPassword.trim().length === 0) {
    return res.status(400).json({ error: "La contraseña no puede estar vacía" });
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
      "INSERT INTO access_passwords (password_hash, description) VALUES ($1, $2) RETURNING id, description, created_at",
      [hash, cleanDescription || null],
    );

    logger.info("Access password created", { id: result.rows[0].id });
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
