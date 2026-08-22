/**
 * Lista de ejercicios del experimento.
 *
 * Todos los estudiantes reciben TODOS los ejercicios. No hay categorías, cuotas
 * ni sorteo: los cinco tienen dificultad incremental y estan pensados para
 * resolverse seguidos en una sola sesion de ~40 minutos, asi que repartir un
 * subconjunto no tendria sentido.
 *
 * En el primer login, /api/exercises/assignment/:carnet crea las filas en
 * exercise_sessions con los tratamientos ya rolados para ese estudiante.
 *
 * El orden es el mismo que en frontend/src/exercises/index.js, que es el orden
 * en que el estudiante los ve. Los ids tienen que coincidir con los de ese
 * archivo: el backend no lo consulta, asi que si se desincronizan, un estudiante
 * puede recibir asignado un ejercicio que el frontend no sabe mostrar.
 *
 * El carnet TEST_CARNET (X00000) NO recibe asignacion persistida: siempre los ve
 * todos, sin crear filas.
 */

const ALL_EXERCISE_IDS = [
  "total-compra",        // entrada / salida
  "tipo-triangulo",      // condicionales
  "segundo-mayor",       // arreglos
  "palabra-palindroma",  // strings
  "suma-filas",          // matrices
];

const TEST_CARNET = "X00000";

module.exports = {
  TEST_CARNET,
  ALL_EXERCISE_IDS,
};
