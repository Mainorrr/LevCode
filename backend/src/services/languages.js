const path = require("path");
const env = require("../config/env");

/**
 * Registro de lenguajes soportados por el ejecutor.
 *
 * Cada spec describe cómo llevar el código fuente de un estudiante a un proceso
 * ejecutable:
 *   - filename: nombre del archivo dentro del directorio temporal. En Java debe
 *     coincidir con el nombre de la clase pública.
 *   - compile:  null para lenguajes interpretados. Para compilados retorna el
 *     comando de compilación; se ejecuta UNA sola vez por submission y el
 *     artefacto resultante se reutiliza para todos los casos de prueba.
 *   - run:      comando que ejecuta el programa ya listo.
 *
 * Que un lenguaje esté en este registro NO significa que esté disponible: hay
 * que habilitarlo en ENABLED_LANGUAGES y el binario debe existir en la imagen.
 */
const LANGUAGES = {
  python: {
    id: "python",
    label: "Python 3",
    filename: "main.py",
    compile: null,
    run: (dir) => ({ command: "python3", args: [path.join(dir, "main.py")] }),
  },

  cpp: {
    id: "cpp",
    label: "C++17",
    filename: "main.cpp",
    compile: (dir) => ({
      command: "g++",
      args: ["-O2", "-std=c++17", "-o", path.join(dir, "main"), path.join(dir, "main.cpp")],
    }),
    run: (dir) => ({ command: path.join(dir, "main"), args: [] }),
  },

  java: {
    id: "java",
    label: "Java 17",
    filename: "Main.java",
    compile: (dir) => ({
      command: "javac",
      args: ["-d", dir, path.join(dir, "Main.java")],
    }),
    run: (dir) => ({ command: "java", args: ["-Xmx256m", "-cp", dir, "Main"] }),
  },
};

const DEFAULT_LANGUAGE = "python";

/**
 * Retorna el spec de un lenguaje, o null si no existe en el registro.
 */
function getLanguage(id) {
  return LANGUAGES[id] || null;
}

/**
 * Un lenguaje está disponible si existe en el registro y fue habilitado por
 * configuración. El gate por env permite desplegar la infraestructura de un
 * lenguaje antes de exponerlo a los estudiantes.
 */
function isEnabled(id) {
  return Boolean(getLanguage(id)) && env.ENABLED_LANGUAGES.includes(id);
}

/**
 * Ids de los lenguajes disponibles para los estudiantes.
 */
function enabledLanguages() {
  return Object.keys(LANGUAGES).filter(isEnabled);
}

module.exports = { LANGUAGES, DEFAULT_LANGUAGE, getLanguage, isEnabled, enabledLanguages };
