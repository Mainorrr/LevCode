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

    // Columna `started`: distingue ejercicios pre-asignados (started=false) de
    // los que el estudiante abrió/intentó. Sin esto, todos los asignados se
    // marcarían como "en progreso" desde el primer login.
    await pool.query(`
      ALTER TABLE exercise_sessions
        ADD COLUMN IF NOT EXISTS started BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    // Backfill: cualquier sesión con intentos o resuelta cuenta como iniciada.
    await pool.query(`
      UPDATE exercise_sessions
         SET started = TRUE
       WHERE started = FALSE AND (attempts > 0 OR solved = TRUE);
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

    // Contador secuencial para asignar tratamientos de manera equitativa (0..7).
    // Cada nuevo estudiante recibe nextval() % 8 y se decodifica como bits.
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS treatment_counter MINVALUE 0 START WITH 0;
    `);

    // Eliminar solution_code (reemplazado por la tabla attempt_code)
    await pool.query(`
      ALTER TABLE exercise_sessions
        DROP COLUMN IF EXISTS solution_code;
    `);

    // Tabla attempt_code: guarda el código enviado en cada intento
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attempt_code (
        id              SERIAL PRIMARY KEY,
        session_id      INTEGER     NOT NULL REFERENCES exercise_sessions(id) ON DELETE CASCADE,
        attempt_number  INTEGER     NOT NULL,
        code            TEXT        NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_session_attempt UNIQUE (session_id, attempt_number)
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_attempt_code_session ON attempt_code(session_id);
    `);

    // Tabla de contraseñas de acceso para estudiantes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS access_passwords (
        id           SERIAL PRIMARY KEY,
        password_hash VARCHAR(64) NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Agregar columna description (idempotente)
    await pool.query(`
      ALTER TABLE access_passwords
        ADD COLUMN IF NOT EXISTS description VARCHAR(200);
    `);

    // Tabla legacy `users` — la lista de estudiantes ahora vive en memoria (Users.tsv)
    await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);

    // Tabla de respuestas del cuestionario SUS (System Usability Scale)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sus_responses (
        id           SERIAL PRIMARY KEY,
        carnet       VARCHAR(6)   NOT NULL UNIQUE,
        grupo        VARCHAR(255) NOT NULL,
        entry_time   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        submit_time  TIMESTAMPTZ,
        submitted    BOOLEAN      NOT NULL DEFAULT FALSE,
        q1  INTEGER CHECK (q1  BETWEEN 1 AND 5),
        q2  INTEGER CHECK (q2  BETWEEN 1 AND 5),
        q3  INTEGER CHECK (q3  BETWEEN 1 AND 5),
        q4  INTEGER CHECK (q4  BETWEEN 1 AND 5),
        q5  INTEGER CHECK (q5  BETWEEN 1 AND 5),
        q6  INTEGER CHECK (q6  BETWEEN 1 AND 5),
        q7  INTEGER CHECK (q7  BETWEEN 1 AND 5),
        q8  INTEGER CHECK (q8  BETWEEN 1 AND 5),
        q9  INTEGER CHECK (q9  BETWEEN 1 AND 5),
        q10 INTEGER CHECK (q10 BETWEEN 1 AND 5)
      );
    `);

    // Resiudal tables no longer needed
    await pool.query(`DROP TABLE IF EXISTS courses CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS course_groups CASCADE;`);

    logger.info("Database migration completed");
  } catch (err) {
    // No fatal: el servidor arranca igual; los endpoints de sesión
    // retornarán error si la DB sigue sin estar disponible.
    logger.error("Database migration failed", { error: err.message });
  }
}

module.exports = migrate;
