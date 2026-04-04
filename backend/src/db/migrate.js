const pool = require("../config/db");
const logger = require("../utils/logger");

/**
 * Crea las tablas necesarias si no existen.
 * Se ejecuta al iniciar el servidor — no rompe el arranque si la DB no está disponible.
 */
async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exercise_sessions (
        id           SERIAL PRIMARY KEY,
        carnet       VARCHAR(6)   NOT NULL,
        grupo        VARCHAR(255) NOT NULL,
        problem_id   VARCHAR(100) NOT NULL,
        curso        VARCHAR(255) NOT NULL DEFAULT '',
        attempts     INTEGER      NOT NULL DEFAULT 0,
        solved       BOOLEAN      NOT NULL DEFAULT FALSE,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_carnet_problem UNIQUE (carnet, problem_id)
      );
    `);

    // Agregar columnas nuevas a tablas existentes (idempotente)
    await pool.query(`
      ALTER TABLE exercise_sessions
        ADD COLUMN IF NOT EXISTS curso VARCHAR(255) NOT NULL DEFAULT '';
    `);

    logger.info("Database migration completed");
  } catch (err) {
    // No fatal: el servidor arranca igual; los endpoints de sesión
    // retornarán error si la DB sigue sin estar disponible.
    logger.error("Database migration failed", { error: err.message });
  }
}

module.exports = migrate;
