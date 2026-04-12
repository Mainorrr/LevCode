const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const logger = require("../utils/logger");
const config = require("../config/env");

const TIMEOUT = parseInt(config.PYTHON_TIMEOUT || "5000", 10);
const MAX_OUTPUT = parseInt(config.PYTHON_OUTPUT_MAX || "10485760", 10);

/**
 * Ejecuta código Python 3 directamente con child_process.
 * Reemplaza a dockerManager — no requiere Docker.
 */
class PythonRunner {
  /**
   * Ejecuta código Python contra un solo input.
   * @param {string} pythonCode - Código fuente Python
   * @param {string} input - Entrada estándar
   * @param {number} timeout - Timeout en ms
   * @returns {Promise<{success: boolean, output: string, error: string, exitCode: number}>}
   */
  async execute(pythonCode, input = "", timeout = TIMEOUT) {
    const tmpFile = this._writeTempFile(pythonCode);

    try {
      return await this._runProcess(tmpFile, input, timeout);
    } finally {
      this._cleanup(tmpFile);
    }
  }

  /**
   * Ejecuta código Python contra múltiples inputs secuencialmente.
   * @param {string} pythonCode - Código fuente Python
   * @param {string[]} inputs - Array de entradas estándar
   * @param {number} timeout - Timeout en ms por caso
   * @returns {Promise<{success: boolean, results: Array, error: string}>}
   */
  async executeBatch(pythonCode, inputs, timeout = TIMEOUT) {
    const tmpFile = this._writeTempFile(pythonCode);

    try {
      const results = [];
      for (const input of inputs) {
        const result = await this._runProcess(tmpFile, input, timeout);
        results.push({
          output: result.output,
          error: result.error,
          exitCode: result.exitCode,
        });
      }
      return { success: true, results, error: "" };
    } catch (err) {
      logger.error("Batch execution failed", { error: err.message });
      return { success: false, results: [], error: err.message };
    } finally {
      this._cleanup(tmpFile);
    }
  }

  /**
   * Escribe el código a un archivo temporal.
   * @private
   */
  _writeTempFile(pythonCode) {
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `levcode_${Date.now()}_${Math.random().toString(36).slice(2)}.py`);
    fs.writeFileSync(tmpFile, pythonCode, "utf-8");
    return tmpFile;
  }

  /**
   * Elimina el archivo temporal.
   * @private
   */
  _cleanup(tmpFile) {
    try {
      fs.unlinkSync(tmpFile);
    } catch { /* ignorar */ }
  }

  /**
   * Ejecuta un archivo Python en un subproceso con límites de timeout y output.
   * @private
   */
  _runProcess(filePath, input, timeout) {
    return new Promise((resolve) => {
      const proc = spawn("python3", [filePath], {
        stdio: ["pipe", "pipe", "pipe"],
        env: { PATH: process.env.PATH },
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGKILL");
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

      proc.on("close", (code) => {
        clearTimeout(timeoutHandle);

        if (timedOut) {
          return resolve({
            success: false,
            output: stdout,
            error: `Tu código tardó más de ${timeout / 1000} segundos en ejecutarse.`,
            exitCode: -1,
          });
        }

        resolve({
          success: code === 0,
          output: stdout,
          error: stderr || (code === 0 ? "" : `Process exited with code ${code}`),
          exitCode: code,
        });
      });

      proc.on("error", (err) => {
        clearTimeout(timeoutHandle);
        logger.error("Python process error", { error: err.message });
        resolve({
          success: false,
          output: "",
          error: `Error al ejecutar Python: ${err.message}`,
          exitCode: -1,
        });
      });
    });
  }
}

module.exports = new PythonRunner();
