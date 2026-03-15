const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");
const logger = require("../utils/logger");
const config = require("../config/env");
const dockerConfig = require("../config/docker");

/**
 * Manages Docker container execution for Java code
 */
class DockerManager {
  /**
   * Executes Java code inside Docker container
   * @param {string} javaCode - The Java source code to execute
   * @param {string} input - Stdin input for the Java program (test case input)
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<{success: boolean, output: string, error: string, exitCode: number}>}
   */
  async executeInDocker(javaCode, input = "", timeout = dockerConfig.LIMITS.timeout) {
    try {
      const result = await this._runDockerContainer(javaCode, input, timeout);
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
   * Runs Docker container and compiles/executes Java code.
   * Java source is base64-encoded in the bash command; test input is piped via stdin.
   * @private
   */
  async _runDockerContainer(javaCode, input, timeout) {
    return new Promise((resolve) => {
      // Base64-encode the Java source so it can be embedded safely in the bash
      // command. This frees stdin to carry the test-case input for the program.
      const encodedCode = Buffer.from(javaCode).toString("base64");
      const bashCmd = `echo '${encodedCode}' | base64 -d > Solution.java && javac Solution.java && java Solution`;

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

      // Pipe test-case input to the Java program's stdin
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
