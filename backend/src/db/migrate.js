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
        semestre     INTEGER      NOT NULL,
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id   SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_groups (
        id        SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        number    VARCHAR(10) NOT NULL,
        UNIQUE (course_id, number)
      );
    `);

    // Seed courses (idempotente)
    await pool.query(`
      INSERT INTO courses (name) VALUES
        ('Programación I'),
        ('Programación II'),
        ('Estructuras de Datos'),
        ('Algoritmos')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed groups per course (idempotente)
    const groupSeeds = [
      { name: 'Programación I',      groups: ['01','02','03','04','05','06','07','08','09','10','11','12'] },
      { name: 'Programación II',     groups: ['01','02','03','04','05','06','07','08'] },
      { name: 'Estructuras de Datos', groups: ['01','02','03','04','05','06'] },
      { name: 'Algoritmos',          groups: ['01','02','03','04'] },
    ];

    for (const { name, groups } of groupSeeds) {
      const values = groups.map((g) => `('${g}')`).join(',');
      await pool.query(`
        INSERT INTO course_groups (course_id, number)
        SELECT c.id, g.number
        FROM courses c
        CROSS JOIN (VALUES ${values}) AS g(number)
        WHERE c.name = $1
        ON CONFLICT (course_id, number) DO NOTHING;
      `, [name]);
    }

    logger.info("Database migration completed");
  } catch (err) {
    // No fatal: el servidor arranca igual; los endpoints de sesión
    // retornarán error si la DB sigue sin estar disponible.
    logger.error("Database migration failed", { error: err.message });
  }
}

module.exports = migrate;
