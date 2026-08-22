/**
 * Configuración de asignación de ejercicios por usuario.
 *
 * El experimento asigna a cada estudiante un subconjunto de los ejercicios
 * disponibles, eligiendo aleatoriamente DENTRO de cada categoría pero
 * manteniendo balance global: cada ejercicio se asigna al menor número posible
 * de usuarios — la diferencia entre el más y el menos asignado en su categoría
 * es a lo sumo 1.
 *
 * Los ids de aquí deben existir en frontend/src/exercises/index.js. El backend
 * no consulta ese archivo, así que si se desincronizan, un estudiante puede
 * recibir asignado un ejercicio que el frontend no sabe mostrar.
 *
 * Cómo funciona:
 *   1. En el primer login del estudiante, /api/exercises/assignment/:carnet
 *      consulta cuántas asignaciones tiene cada ejercicio dentro de su categoría.
 *   2. Toma los `quota` con menor conteo (empate desempatado al azar).
 *   3. Crea las filas en exercise_sessions con tratamientos ya determinados.
 *
 * El carnet TEST_CARNET (X00000) NO recibe asignación: siempre los ve todos.
 */

// Una categoria por ejercicio y quota 1: todos los estudiantes reciben los
// cinco. La dificultad es incremental y estan pensados para hacerse en ~40
// minutos seguidos, asi que no se sortea un subconjunto.
const CATEGORY_QUOTAS = {
  "01": 1, // Entrada y salida
  "02": 1, // Condicionales
  "03": 1, // Arreglos
  "04": 1, // Strings
  "05": 1, // Matrices
};

const EXERCISES_BY_CATEGORY = {
  "01": ["total-compra"],
  "02": ["tipo-triangulo"],
  "03": ["segundo-mayor"],
  "04": ["palabra-palindroma"],
  "05": ["suma-filas"],
};

const TEST_CARNET = "X00000";

const ALL_EXERCISE_IDS = Object.values(EXERCISES_BY_CATEGORY).flat();

module.exports = {
  CATEGORY_QUOTAS,
  EXERCISES_BY_CATEGORY,
  TEST_CARNET,
  ALL_EXERCISE_IDS,
};
