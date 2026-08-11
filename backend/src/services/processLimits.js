const { spawnSync } = require("child_process");
const logger = require("../utils/logger");
const env = require("../config/env");

/**
 * Límites de recursos por proceso, aplicados con prlimit(1).
 *
 * Matar el árbol de procesos acota el tiempo, pero no la memoria ni la cantidad
 * de procesos que el código del estudiante puede crear mientras vive. prlimit
 * pone topes duros que el kernel hace cumplir: no dependen de que el código
 * coopere ni de que una regex haya previsto la forma del abuso.
 *
 * prlimit fija los límites y hace exec del comando, así que conserva el mismo
 * PID: el kill de grupo del runner sigue funcionando igual.
 */

// prlimit viene de util-linux. Se detecta una vez al arrancar.
const available = (() => {
  try {
    const probe = spawnSync("prlimit", ["--version"], { stdio: "ignore" });
    return probe.status === 0;
  } catch {
    return false;
  }
})();

if (!available) {
  logger.warn(
    "prlimit no disponible: el codigo se ejecutara sin limites de recursos. " +
    "Los lenguajes compilados quedan bloqueados hasta que exista.",
  );
}

/**
 * Límites por defecto. `as` (espacio de direcciones) se omite en la JVM, que
 * reserva direcciones virtuales muy por encima de lo que llega a usar; ahí el
 * tope de memoria lo pone -Xmx en el propio comando.
 */
function defaultLimits() {
  return {
    cpu: Math.ceil(env.RUN_TIMEOUT / 1000) + 1, // segundos de CPU
    as: env.MEMORY_MAX_MB,                      // memoria virtual, MB
    fsize: env.FSIZE_MAX_MB,                    // tamaño máximo de archivo, MB
    nproc: env.NPROC_MAX,                       // procesos por usuario
    nofile: 64,                                 // descriptores abiertos
  };
}

/**
 * Envuelve un comando con prlimit. Si prlimit no está, devuelve el comando tal
 * cual: es responsabilidad de quien llama decidir si eso es aceptable
 * (ver `isAvailable` y `requiresLimits` en el registro de lenguajes).
 */
function wrap(command, args, overrides = {}) {
  if (!available) return { command, args };

  const limits = { ...defaultLimits(), ...overrides };
  const flags = [];

  if (limits.cpu != null) flags.push(`--cpu=${limits.cpu}`);
  if (limits.as != null) flags.push(`--as=${limits.as * 1024 * 1024}`);
  if (limits.fsize != null) flags.push(`--fsize=${limits.fsize * 1024 * 1024}`);
  if (limits.nproc != null) flags.push(`--nproc=${limits.nproc}`);
  if (limits.nofile != null) flags.push(`--nofile=${limits.nofile}`);

  return { command: "prlimit", args: [...flags, "--", command, ...args] };
}

module.exports = { wrap, isAvailable: () => available };
