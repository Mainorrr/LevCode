import helloWorldConfig from './hello-world/config.json'
import helloWorldTestcases from './hello-world/testcases.json'
import sumaEnterosConfig from './suma-enteros/config.json'
import sumaEnterosTestcases from './suma-enteros/testcases.json'

/**
 * Registro central de ejercicios.
 * Para agregar un nuevo ejercicio: crear su carpeta con config.json y testcases.json,
 * importarlos aquí y agregarlos a este arreglo.
 */
export const exercises = [
  {
    config: helloWorldConfig,
    testcases: helloWorldTestcases,
  },
  {
    config: sumaEnterosConfig,
    testcases: sumaEnterosTestcases,
  },
]
