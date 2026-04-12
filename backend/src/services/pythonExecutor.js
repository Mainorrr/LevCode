const pythonRunner = require("./pythonRunner");
const validators = require("../utils/validators");
const logger = require("../utils/logger");
const env = require("../config/env");

/**
 * Capa de alto nivel para ejecución de código Python.
 * Valida el código y delega la ejecución a pythonRunner.
 */
class PythonExecutor {
  /**
   * Ejecuta código Python con un solo input.
   */
  async execute(code, input = "") {
    const validation = validators.validatePythonCode(code);
    if (!validation.valid) {
      return { success: false, output: "", error: validation.error, executionTime: 0 };
    }

    const startTime = Date.now();
    const result = await pythonRunner.execute(code, input);
    const executionTime = Date.now() - startTime;

    logger.info("Python code executed", {
      success: result.success,
      executionTime,
      exitCode: result.exitCode,
    });

    return { success: result.success, output: result.output, error: result.error, executionTime };
  }

  /**
   * Ejecuta código Python contra múltiples inputs.
   */
  async executeBatch(code, inputs) {
    const validation = validators.validatePythonCode(code);
    if (!validation.valid) {
      return { success: false, results: [], error: validation.error, executionTime: 0 };
    }

    const startTime = Date.now();
    const result = await pythonRunner.executeBatch(code, inputs);
    const executionTime = Date.now() - startTime;

    logger.info("Python batch executed", {
      success: result.success,
      testCases: inputs.length,
      executionTime,
    });

    return {
      success: result.success,
      results: result.results,
      error: result.error,
      executionTime,
    };
  }

  /**
   * Retorna los límites de ejecución.
   */
  getLimits() {
    return {
      timeout: parseInt(env.PYTHON_TIMEOUT || "5000", 10),
      maxOutput: parseInt(env.PYTHON_OUTPUT_MAX || "10485760", 10),
    };
  }
}

module.exports = new PythonExecutor();
