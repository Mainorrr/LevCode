// 01 - Entrada / Salida
import totalCompraConfig       from './01_entrada_salida/01_total_compra/config.json'
import totalCompraTestcases    from './01_entrada_salida/01_total_compra/testcases.json'

// 02 - Condicionales
import tipoTrianguloConfig     from './02_condicionales/01_tipo_triangulo/config.json'
import tipoTrianguloTestcases  from './02_condicionales/01_tipo_triangulo/testcases.json'

// 03 - Arreglos
import segundoMayorConfig      from './03_arreglos/01_segundo_mayor/config.json'
import segundoMayorTestcases   from './03_arreglos/01_segundo_mayor/testcases.json'

// 04 - Strings
import palindromaConfig        from './04_strings/01_palabra_palindroma/config.json'
import palindromaTestcases     from './04_strings/01_palabra_palindroma/testcases.json'

// 05 - Matrices
import sumaFilasConfig         from './05_matrices/01_suma_filas/config.json'
import sumaFilasTestcases      from './05_matrices/01_suma_filas/testcases.json'

/**
 * Registro central de ejercicios.
 * Para agregar un nuevo ejercicio: crear su carpeta con config.json y testcases.json,
 * importarlos aquí y agregarlos a este arreglo.
 *
 * El orden de este arreglo es el orden en que el estudiante ve los ejercicios, y
 * la dificultad es incremental: entrada/salida, condicionales, arreglo 1D,
 * strings y matriz.
 *
 * Todos los estudiantes reciben todos los ejercicios: no hay categorías ni
 * sorteo. Los ids que aparezcan aquí deben existir también en ALL_EXERCISE_IDS
 * (backend/src/config/exerciseAssignmentConfig.js): el backend crea las filas
 * por id y no consulta este archivo, así que si se desincronizan, un estudiante
 * puede recibir asignado un ejercicio que el frontend no sabe mostrar.
 */
export const exercises = [
  { config: totalCompraConfig,    testcases: totalCompraTestcases },
  { config: tipoTrianguloConfig,  testcases: tipoTrianguloTestcases },
  { config: segundoMayorConfig,   testcases: segundoMayorTestcases },
  { config: palindromaConfig,     testcases: palindromaTestcases },
  { config: sumaFilasConfig,      testcases: sumaFilasTestcases },
]
