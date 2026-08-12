// 01 - Entrada / Salida
import sumaDosConfig           from './01_entrada_salida/02_suma_dos/config.json'
import sumaDosTestcases        from './01_entrada_salida/02_suma_dos/testcases.json'

/**
 * Registro central de ejercicios.
 * Para agregar un nuevo ejercicio: crear su carpeta con config.json y testcases.json,
 * importarlos aquí y agregarlos a este arreglo.
 *
 * Los ids que aparezcan aquí deben existir también en EXERCISES_BY_CATEGORY
 * (backend/src/config/exerciseAssignmentConfig.js): el backend asigna ejercicios
 * por id y no consulta este archivo, así que si se desincronizan, un estudiante
 * puede recibir asignado un ejercicio que el frontend no sabe mostrar.
 */
export const exercises = [
  // 01 - Entrada / Salida
  { config: sumaDosConfig,          testcases: sumaDosTestcases },
]
