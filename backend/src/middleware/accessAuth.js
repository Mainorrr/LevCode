const crypto = require("crypto");
const pool = require("../config/db");
const logger = require("../utils/logger");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Middleware that validates the X-Access-Password header
 * against the access_passwords table.
 */
async function accessAuth(req, res, next) {
  const password = req.headers["x-access-password"];

  if (!password) {
    logger.warn("Access auth: missing password header", { path: req.path });
    return res.status(401).json({ error: "Contraseña de acceso requerida" });
  }

  try {
    const hash = hashPassword(password);
    const result = await pool.query(
      "SELECT id FROM access_passwords WHERE password_hash = $1 LIMIT 1",
      [hash],
    );

    if (result.rows.length === 0) {
      logger.warn("Access auth: invalid password", { path: req.path });
      return res.status(401).json({ error: "Contraseña de acceso inválida" });
    }

    next();
  } catch (err) {
    logger.error("Access auth: DB error", { path: req.path, error: err.message });
    return res.status(500).json({ error: "Error al validar acceso" });
  }
}

module.exports = accessAuth;
