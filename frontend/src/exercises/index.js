// 01 - Entrada / Salida
import saludoConfig            from './01_entrada_salida/01_saludo/config.json'
import saludoTestcases         from './01_entrada_salida/01_saludo/testcases.json'
import sumaDosConfig           from './01_entrada_salida/02_suma_dos/config.json'
import sumaDosTestcases        from './01_entrada_salida/02_suma_dos/testcases.json'
import areaRectanguloConfig    from './01_entrada_salida/03_area_rectangulo/config.json'
import areaRectanguloTestcases from './01_entrada_salida/03_area_rectangulo/testcases.json'
import datosPersonaConfig      from './01_entrada_salida/04_datos_persona/config.json'
import datosPersonaTestcases   from './01_entrada_salida/04_datos_persona/testcases.json'

// 02 - Condicionales
import parImparConfig          from './02_condicionales/01_par_impar/config.json'
import parImparTestcases       from './02_condicionales/01_par_impar/testcases.json'
import mayorDeTresConfig       from './02_condicionales/02_mayor_de_tres/config.json'
import mayorDeTresTestcases    from './02_condicionales/02_mayor_de_tres/testcases.json'
import aprobadoConfig          from './02_condicionales/03_aprobado/config.json'
import aprobadoTestcases       from './02_condicionales/03_aprobado/testcases.json'
import signoNumeroConfig       from './02_condicionales/04_signo_numero/config.json'
import signoNumeroTestcases    from './02_condicionales/04_signo_numero/testcases.json'

// 03 - Ciclos
import sumaNConfig                  from './03_ciclos/01_suma_n/config.json'
import sumaNTestcases               from './03_ciclos/01_suma_n/testcases.json'
import factorialConfig              from './03_ciclos/02_factorial/config.json'
import factorialTestcases           from './03_ciclos/02_factorial/testcases.json'
import tablaMultiplicarConfig       from './03_ciclos/03_tabla_multiplicar/config.json'
import tablaMultiplicarTestcases    from './03_ciclos/03_tabla_multiplicar/testcases.json'
import contarParesHastaNConfig      from './03_ciclos/04_contar_pares_hasta_n/config.json'
import contarParesHastaNTestcases   from './03_ciclos/04_contar_pares_hasta_n/testcases.json'

// 04 - Funciones
import esPrimoConfig                from './04_funciones/01_es_primo/config.json'
import esPrimoTestcases             from './04_funciones/01_es_primo/testcases.json'
import potenciaConfig               from './04_funciones/02_potencia/config.json'
import potenciaTestcases            from './04_funciones/02_potencia/testcases.json'
import sumaParesFuncionConfig       from './04_funciones/03_suma_pares_funcion/config.json'
import sumaParesFuncionTestcases    from './04_funciones/03_suma_pares_funcion/testcases.json'
import contarVocalesConfig          from './04_funciones/04_contar_vocales/config.json'
import contarVocalesTestcases       from './04_funciones/04_contar_vocales/testcases.json'

// 05 - Listas
import sumaListaConfig         from './05_listas/01_suma_lista/config.json'
import sumaListaTestcases      from './05_listas/01_suma_lista/testcases.json'
import promedioConfig          from './05_listas/02_promedio/config.json'
import promedioTestcases       from './05_listas/02_promedio/testcases.json'
import buscarElementoConfig    from './05_listas/03_buscar_elemento/config.json'
import buscarElementoTestcases from './05_listas/03_buscar_elemento/testcases.json'
import contarMayoresConfig     from './05_listas/04_contar_mayores/config.json'
import contarMayoresTestcases  from './05_listas/04_contar_mayores/testcases.json'

/**
 * Registro central de ejercicios.
 * Para agregar un nuevo ejercicio: crear su carpeta con config.json y testcases.json,
 * importarlos aquí y agregarlos a este arreglo.
 */
export const exercises = [
  // 01 - Entrada / Salida
  { config: saludoConfig,           testcases: saludoTestcases },
  { config: sumaDosConfig,          testcases: sumaDosTestcases },
  { config: areaRectanguloConfig,   testcases: areaRectanguloTestcases },
  { config: datosPersonaConfig,     testcases: datosPersonaTestcases },

  // 02 - Condicionales
  { config: parImparConfig,         testcases: parImparTestcases },
  { config: mayorDeTresConfig,      testcases: mayorDeTresTestcases },
  { config: aprobadoConfig,         testcases: aprobadoTestcases },
  { config: signoNumeroConfig,      testcases: signoNumeroTestcases },

  // 03 - Ciclos
  { config: sumaNConfig,             testcases: sumaNTestcases },
  { config: factorialConfig,         testcases: factorialTestcases },
  { config: tablaMultiplicarConfig,  testcases: tablaMultiplicarTestcases },
  { config: contarParesHastaNConfig, testcases: contarParesHastaNTestcases },

  // 04 - Funciones
  { config: esPrimoConfig,           testcases: esPrimoTestcases },
  { config: potenciaConfig,          testcases: potenciaTestcases },
  { config: sumaParesFuncionConfig,  testcases: sumaParesFuncionTestcases },
  { config: contarVocalesConfig,     testcases: contarVocalesTestcases },

  // 05 - Listas
  { config: sumaListaConfig,        testcases: sumaListaTestcases },
  { config: promedioConfig,         testcases: promedioTestcases },
  { config: buscarElementoConfig,   testcases: buscarElementoTestcases },
  { config: contarMayoresConfig,    testcases: contarMayoresTestcases },
]
