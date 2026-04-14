import sumaEnterosConfig from './suma-enteros/config.json'
import sumaEnterosTestcases from './suma-enteros/testcases.json'
import parOImparConfig from './par-o-impar/config.json'
import parOImparTestcases from './par-o-impar/testcases.json'
import mayorDeTresConfig from './mayor-de-tres/config.json'
import mayorDeTresTestcases from './mayor-de-tres/testcases.json'
import tablaMultiplicarConfig from './tabla-multiplicar/config.json'
import tablaMultiplicarTestcases from './tabla-multiplicar/testcases.json'
import contarVocalesConfig from './contar-vocales/config.json'
import contarVocalesTestcases from './contar-vocales/testcases.json'
import invertirCadenaConfig from './invertir-cadena/config.json'
import invertirCadenaTestcases from './invertir-cadena/testcases.json'

/**
 * Registro central de ejercicios.
 * Para agregar un nuevo ejercicio: crear su carpeta con config.json y testcases.json,
 * importarlos aquí y agregarlos a este arreglo.
 */
export const exercises = [
  {
    config: sumaEnterosConfig,
    testcases: sumaEnterosTestcases,
  },
  {
    config: parOImparConfig,
    testcases: parOImparTestcases,
  },
  {
    config: mayorDeTresConfig,
    testcases: mayorDeTresTestcases,
  },
  {
    config: tablaMultiplicarConfig,
    testcases: tablaMultiplicarTestcases,
  },
  {
    config: contarVocalesConfig,
    testcases: contarVocalesTestcases,
  },
  {
    config: invertirCadenaConfig,
    testcases: invertirCadenaTestcases,
  },
]
