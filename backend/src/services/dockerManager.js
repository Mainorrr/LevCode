const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");
const logger = require("../utils/logger");
const config = require("../config/env");
const dockerConfig = require("../config/docker");

/**
 * Manages Docker container execution for Python code
 */
class DockerManager {
  /**
   * Executes Python code inside Docker container
   * @param {string} pythonCode - The Python source code to execute
   * @param {string} input - Stdin input for the Python program (test case input)
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<{success: boolean, output: string, error: string, exitCode: number}>}
   */
  async executeInDocker(pythonCode, input = "", timeout = dockerConfig.LIMITS.timeout) {
    try {
      const result = await this._runDockerContainer(pythonCode, input, timeout);
      return result;
    } catch (error) {
      logger.error("Docker execution failed", { error: error.message });
      return {
        success: false,
        output: "",
        error: error.message,
        exitCode: -1,
      };
    }
  }

  /**
   * Runs Docker container and executes Python code.
   * Python source is base64-encoded in the bash command; test input is piped via stdin.
   * @private
   */
  async _runDockerContainer(pythonCode, input, timeout) {
    return new Promise((resolve) => {
      // Base64-encode the Python source so it can be embedded safely in the bash
      // command. This frees stdin to carry the test-case input for the program.
      const encodedCode = Buffer.from(pythonCode).toString("base64");
      const bashCmd = `echo '${encodedCode}' | base64 -d > solution.py && python3 solution.py`;

      const dockerCmd = [
        "run",
        "--rm",
        "-i",
        `--memory=${dockerConfig.LIMITS.memory}`,
        "--network=none",
        config.DOCKER_IMAGE,
        "bash",
        "-c",
        bashCmd,
      ];

      logger.debug("Running Docker command", { dockerCmd });

      const process = spawn("docker", dockerCmd);

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      // Pipe test-case input to the Python program's stdin
      if (input) {
        process.stdin.write(input);
      }
      process.stdin.end();

      // Set timeout
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        process.kill();
        logger.warn("Docker execution timeout", { timeout });
      }, timeout);

      process.stdout.on("data", (data) => {
        const chunk = data.toString();
        if (stdout.length + chunk.length <= dockerConfig.LIMITS.maxOutput) {
          stdout += chunk;
        } else {
          logger.warn("Output exceeded max size", {
            maxSize: dockerConfig.LIMITS.maxOutput,
          });
        }
      });

      process.stderr.on("data", (data) => {
        const chunk = data.toString();
        if (stderr.length + chunk.length <= dockerConfig.LIMITS.maxOutput) {
          stderr += chunk;
        }
      });

      process.on("close", (code) => {
        clearTimeout(timeoutHandle);

        if (timedOut) {
          return resolve({
            success: false,
            output: stdout,
            error: `Execution timeout after ${timeout}ms`,
            exitCode: -1,
          });
        }

        const success = code === 0;
        const error =
          stderr || (success ? "" : `Process exited with code ${code}`);

        resolve({
          success,
          output: stdout,
          error,
          exitCode: code,
        });

        logger.debug("Docker execution completed", { exitCode: code, success });
      });

      process.on("error", (err) => {
        clearTimeout(timeoutHandle);
        logger.error("Docker process error", { error: err.message });

        resolve({
          success: false,
          output: "",
          error: `Docker error: ${err.message}`,
          exitCode: -1,
        });
      });
    });
  }

  /**
   * Executes Python code against multiple inputs in a single Docker container.
   * Uses runner.py to run the code once per input and return JSON results.
   * @param {string} pythonCode - The Python source code
   * @param {string[]} inputs - Array of stdin inputs (one per test case)
   * @param {number} timeout - Timeout in milliseconds for the entire container
   * @returns {Promise<{success: boolean, results: Array, error: string}>}
   */
  async executeBatch(pythonCode, inputs, timeout = dockerConfig.LIMITS.timeout) {
    return new Promise((resolve) => {
      const encodedCode = Buffer.from(pythonCode).toString("base64");
      const encodedInputs = Buffer.from(JSON.stringify(inputs)).toString("base64");
      const perCaseTimeout = Math.floor(timeout / 1000);

      // Total container timeout: per-case timeout * number of cases + 5s buffer
      const containerTimeout = timeout * inputs.length + 5000;

      const dockerCmd = [
        "run",
        "--rm",
        `--memory=${dockerConfig.LIMITS.memory}`,
        "--network=none",
        config.DOCKER_IMAGE,
        "python3",
        "/usr/local/bin/runner.py",
        encodedCode,
        encodedInputs,
        String(perCaseTimeout),
      ];

      logger.debug("Running Docker batch command", { testCases: inputs.length });

      const proc = spawn("docker", dockerCmd);

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        proc.kill();
        logger.warn("Docker batch execution timeout", { containerTimeout });
      }, containerTimeout);

      proc.stdout.on("data", (data) => {
        const chunk = data.toString();
        if (stdout.length + chunk.length <= dockerConfig.LIMITS.maxOutput) {
          stdout += chunk;
        }
      });

      proc.stderr.on("data", (data) => {
        const chunk = data.toString();
        if (stderr.length + chunk.length <= dockerConfig.LIMITS.maxOutput) {
          stderr += chunk;
        }
      });

      proc.on("close", (code) => {
        clearTimeout(timeoutHandle);

        if (timedOut) {
          return resolve({
            success: false,
            results: [],
            error: `Container timeout after ${containerTimeout}ms`,
          });
        }

        if (code === 137) {
          return resolve({
            success: false,
            results: [],
            error: "Tu código usó demasiada memoria y fue detenido.",
          });
        }

        try {
          const results = JSON.parse(stderr);
          resolve({ success: true, results, error: "" });
        } catch {
          resolve({
            success: false,
            results: [],
            error: stderr || `Runner exited with code ${code}`,
          });
        }
      });

      proc.on("error", (err) => {
        clearTimeout(timeoutHandle);
        resolve({
          success: false,
          results: [],
          error: `Docker error: ${err.message}`,
        });
      });
    });
  }

  /**
   * Check if Docker image exists locally
   */
  async checkImageExists() {
    return new Promise((resolve) => {
      const process = spawn("docker", ["images", config.DOCKER_IMAGE, "-q"]);

      let output = "";
      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.on("close", () => {
        resolve(output.trim().length > 0);
      });

      process.on("error", () => {
        resolve(false);
      });
    });
  }
}

module.exports = new DockerManager();
