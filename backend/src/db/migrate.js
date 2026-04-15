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
        attempts     INTEGER      NOT NULL DEFAULT 0,
        solved       BOOLEAN      NOT NULL DEFAULT FALSE,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_carnet_problem UNIQUE (carnet, problem_id)
      );
    `);

    // Eliminar columna curso si existe (migración de limpieza)
    await pool.query(`
      ALTER TABLE exercise_sessions
        DROP COLUMN IF EXISTS curso;
    `);

    // Eliminar columna semestre si existe (migración de limpieza)
    await pool.query(`
      ALTER TABLE exercise_sessions
        DROP COLUMN IF EXISTS semestre;
    `);

    // Agregar columnas de tratamiento a exercise_sessions (idempotente)
    await pool.query(`
      ALTER TABLE exercise_sessions
        ADD COLUMN IF NOT EXISTS hide_tests BOOLEAN,
        ADD COLUMN IF NOT EXISTS show_tries BOOLEAN,
        ADD COLUMN IF NOT EXISTS try_timer  BOOLEAN;
    `);

    // Renombrar show_tests -> hide_tests si existe (migración)
    await pool.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'exercise_sessions' AND column_name = 'show_tests')
        THEN
          UPDATE exercise_sessions SET hide_tests = NOT show_tests WHERE hide_tests IS NULL AND show_tests IS NOT NULL;
          ALTER TABLE exercise_sessions DROP COLUMN show_tests;
        END IF;
      END $$;
    `);

    // Tabla de contraseñas de acceso para estudiantes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS access_passwords (
        id           SERIAL PRIMARY KEY,
        password_hash VARCHAR(64) NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    logger.info("Database migration completed");
  } catch (err) {
    // No fatal: el servidor arranca igual; los endpoints de sesión
    // retornarán error si la DB sigue sin estar disponible.
    logger.error("Database migration failed", { error: err.message });
  }
}

module.exports = migrate;
