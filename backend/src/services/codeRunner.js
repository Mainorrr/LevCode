const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const logger = require("../utils/logger");
const env = require("../config/env");
const { getLanguage, DEFAULT_LANGUAGE } = require("./languages");
const processLimits = require("./processLimits");

const RUN_TIMEOUT = env.RUN_TIMEOUT;
const COMPILE_TIMEOUT = env.COMPILE_TIMEOUT;
const MAX_OUTPUT = env.OUTPUT_MAX;

// Gracia tras salir el hijo directo antes de dar por perdidas sus tuberías.
const ORPHAN_GRACE_MS = 250;

// Señales con las que el kernel mata al proceso al pasarse de un límite.
const LIMIT_MESSAGES = {
  SIGXCPU: "Tu programa consumió demasiado tiempo de CPU.",
  SIGXFSZ: "Tu programa intentó escribir un archivo demasiado grande.",
  SIGKILL: "Tu programa fue detenido por exceder los límites de recursos.",
  SIGSEGV: "Tu programa falló por un acceso inválido a memoria.",
};

/**
 * Ejecuta código de estudiantes con child_process, en cualquier lenguaje del
 * registro (ver languages.js). No requiere Docker.
 *
 * El contrato es "compilar una vez, ejecutar N veces": cada submission crea un
 * directorio temporal, compila (si el lenguaje lo necesita) y reutiliza el
 * artefacto para todos los casos de prueba. Un fallo de compilación aborta la
 * corrida completa: no tiene sentido evaluar casos si el programa no compila.
 */
class CodeRunner {
  /**
   * Ejecuta código contra un solo input.
   * @param {string} code - Código fuente
   * @param {string} input - Entrada estándar
   * @param {string} language - Id del lenguaje (ver languages.js)
   * @param {number} timeout - Timeout de ejecución en ms
   * @returns {Promise<{success: boolean, output: string, error: string, exitCode: number}>}
   */
  async execute(code, input = "", language = DEFAULT_LANGUAGE, timeout = RUN_TIMEOUT) {
    const batch = await this.executeBatch(code, [input], language, timeout);

    if (!batch.success) {
      return { success: false, output: "", error: batch.error, exitCode: -1 };
    }

    const result = batch.results[0];
    return {
      success: result.exitCode === 0,
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
    };
  }

  /**
   * Ejecuta código contra múltiples inputs secuencialmente, compilando una sola vez.
   * @param {string} code - Código fuente
   * @param {string[]} inputs - Array de entradas estándar
   * @param {string} language - Id del lenguaje (ver languages.js)
   * @param {number} timeout - Timeout de ejecución en ms por caso
   * @returns {Promise<{success: boolean, results: Array, error: string}>}
   */
  async executeBatch(code, inputs, language = DEFAULT_LANGUAGE, timeout = RUN_TIMEOUT) {
    const spec = getLanguage(language);
    if (!spec) {
      return { success: false, results: [], error: `Lenguaje no soportado: ${language}` };
    }

    // Falla cerrado: un lenguaje compilado no se ejecuta sin límites reales.
    if (spec.requiresLimits && !processLimits.isAvailable()) {
      logger.error("Lenguaje compilado sin limites de proceso disponibles", { language });
      return {
        success: false,
        results: [],
        error: "El servidor no puede ejecutar este lenguaje en este momento.",
      };
    }

    let dir = null;
    try {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), "levcode_"));
      fs.writeFileSync(path.join(dir, spec.filename), code, "utf-8");

      if (spec.compile) {
        const rawCompile = spec.compile(dir);
        const { command, args } = processLimits.wrap(rawCompile.command, rawCompile.args, spec.limits);
        const compiled = await this._spawn(command, args, "", COMPILE_TIMEOUT, dir, "compile");
        if (compiled.exitCode !== 0) {
          // stderr del compilador: es el mensaje que le sirve al estudiante, pero
          // sin la ruta del directorio temporal (ruido y detalle del servidor).
          const compilerMessage = compiled.error || compiled.output || "Error de compilación";
          return { success: false, results: [], error: this._stripTempPath(compilerMessage, dir) };
        }
      }

      const rawRun = spec.run(dir);
      const { command, args } = processLimits.wrap(rawRun.command, rawRun.args, spec.limits);
      const results = [];
      for (const input of inputs) {
        const result = await this._spawn(command, args, input, timeout, dir, "run");
        results.push({
          output: result.output,
          error: result.error,
          exitCode: result.exitCode,
        });
      }
      return { success: true, results, error: "" };
    } catch (err) {
      logger.error("Batch execution failed", { language, error: err.message });
      return { success: false, results: [], error: err.message };
    } finally {
      this._cleanup(dir);
    }
  }

  /**
   * Quita la ruta del directorio temporal de los mensajes del compilador.
   * @private
   */
  _stripTempPath(message, dir) {
    return message.split(dir + path.sep).join("");
  }

  /**
   * Elimina el directorio temporal con el fuente y los artefactos de compilación.
   * @private
   */
  _cleanup(dir) {
    if (!dir) return;
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch { /* ignorar */ }
  }

  /**
   * Mata el grupo de procesos completo, no solo el hijo directo.
   * Sin esto, el código del estudiante puede dejar descendientes vivos: heredan
   * las tuberías de stdout, así que la corrida no termina hasta que muere el
   * último, y el timeout deja de acotar la duración real.
   * @private
   */
  _killTree(proc) {
    try {
      process.kill(-proc.pid, "SIGKILL");
    } catch {
      // El grupo ya no existe; como respaldo, matar al hijo directo.
      try { proc.kill("SIGKILL"); } catch { /* ignorar */ }
    }
  }

  /**
   * Lanza un subproceso con límites de timeout y output.
   * `phase` solo cambia el mensaje de timeout que ve el estudiante.
   * @private
   */
  _spawn(command, args, input, timeout, cwd, phase) {
    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
        env: { PATH: process.env.PATH },
        // Grupo de procesos propio: permite matar a toda la descendencia.
        detached: true,
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;
      let orphanHandle = null;

      const settle = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutHandle);
        clearTimeout(orphanHandle);
        resolve(result);
      };

      const finish = (code, signal) => {
        if (timedOut) {
          const seconds = timeout / 1000;
          return settle({
            success: false,
            output: stdout,
            error: phase === "compile"
              ? `La compilación tardó más de ${seconds} segundos.`
              : `Tu código tardó más de ${seconds} segundos en ejecutarse.`,
            exitCode: -1,
          });
        }

        // Sin código de salida y con señal: lo mató el kernel, casi siempre por
        // exceder un límite de recursos. "exited with code null" no le dice nada
        // al estudiante.
        if (code === null && signal) {
          return settle({
            success: false,
            output: stdout,
            error: stderr || LIMIT_MESSAGES[signal] || `Tu programa fue detenido por el sistema (${signal}).`,
            exitCode: -1,
          });
        }

        settle({
          success: code === 0,
          output: stdout,
          error: stderr || (code === 0 ? "" : `Process exited with code ${code}`),
          exitCode: code,
        });
      };

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        this._killTree(proc);
      }, timeout);

      if (input) {
        proc.stdin.write(input);
      }
      proc.stdin.end();

      proc.stdout.on("data", (data) => {
        const chunk = data.toString();
        if (stdout.length + chunk.length <= MAX_OUTPUT) {
          stdout += chunk;
        }
      });

      proc.stderr.on("data", (data) => {
        const chunk = data.toString();
        if (stderr.length + chunk.length <= MAX_OUTPUT) {
          stderr += chunk;
        }
      });

      // "close" espera a que se cierren las tuberías, que un descendiente vivo
      // puede mantener abiertas indefinidamente. Al salir el hijo directo damos
      // una gracia corta y, si no cierran, matamos el grupo y resolvemos igual.
      proc.on("exit", (code, signal) => {
        orphanHandle = setTimeout(() => {
          if (settled) return;
          logger.warn("Descendientes vivos tras salir el proceso", { command, phase });
          this._killTree(proc);
          finish(code, signal);
        }, ORPHAN_GRACE_MS);
      });

      proc.on("close", (code, signal) => finish(code, signal));

      proc.on("error", (err) => {
        logger.error("Process spawn error", { command, phase, error: err.message });
        settle({
          success: false,
          output: "",
          error: `Error al ejecutar ${command}: ${err.message}`,
          exitCode: -1,
        });
      });
    });
  }
}

module.exports = new CodeRunner();
