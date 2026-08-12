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

// Banco reducido mientras se prueban los lenguajes: los ejercicios definitivos
// se escribiran despues. Al volver a crecer, agregar aqui la categoria y su
// quota junto con las carpetas del frontend.
const CATEGORY_QUOTAS = {
  "01": 1, // Entrada y salida
};

const EXERCISES_BY_CATEGORY = {
  "01": ["suma-dos-numeros"],
};

const TEST_CARNET = "X00000";

const ALL_EXERCISE_IDS = Object.values(EXERCISES_BY_CATEGORY).flat();

module.exports = {
  CATEGORY_QUOTAS,
  EXERCISES_BY_CATEGORY,
  TEST_CARNET,
  ALL_EXERCISE_IDS,
};
