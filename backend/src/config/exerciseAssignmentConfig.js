/**
 * Configuración de asignación de ejercicios por usuario.
 *
 * El experimento asigna a cada estudiante un subconjunto de los 20 ejercicios
 * disponibles, eligiendo aleatoriamente DENTRO de cada categoría pero
 * manteniendo balance global: cada ejercicio se asigna al menor número posible
 * de usuarios — la diferencia entre el más y el menos asignado en su categoría
 * es a lo sumo 1.
 *
 * Cómo funciona:
 *   1. En el primer login del estudiante, /api/exercises/assignment/:carnet
 *      consulta cuántas asignaciones tiene cada ejercicio dentro de su categoría.
 *   2. Toma los `quota` con menor conteo (empate desempatado al azar).
 *   3. Crea las filas en exercise_sessions con tratamientos ya determinados.
 *
 * El carnet TEST_CARNET (X00000) NO recibe asignación: siempre ve los 20.
 */

const CATEGORY_QUOTAS = {
  "01": 1, // Entrada y salida
  "02": 1, // Condicionales
  "03": 1, // Ciclos
  "04": 1, // Funciones
  "05": 1, // Listas
};

const EXERCISES_BY_CATEGORY = {
  "01": ["saludo-personalizado", "suma-dos-numeros", "area-rectangulo", "datos-persona"],
  "02": ["par-o-impar", "mayor-de-tres", "aprobado-reprobado", "signo-numero"],
  "03": ["suma-uno-a-n", "factorial", "tabla-multiplicar", "contar-pares-hasta-n"],
  "04": ["es-primo", "potencia", "suma-pares-funcion", "contar-vocales"],
  "05": ["suma-lista", "promedio-lista", "buscar-elemento", "contar-mayores"],
};

const TEST_CARNET = "X00000";

const ALL_EXERCISE_IDS = Object.values(EXERCISES_BY_CATEGORY).flat();

module.exports = {
  CATEGORY_QUOTAS,
  EXERCISES_BY_CATEGORY,
  TEST_CARNET,
  ALL_EXERCISE_IDS,
};
