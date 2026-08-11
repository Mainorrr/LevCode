const codeRunner = require("./codeRunner");
const validators = require("../utils/validators");
const logger = require("../utils/logger");
const env = require("../config/env");
const { DEFAULT_LANGUAGE, enabledLanguages } = require("./languages");
const { queue, QueueTimeoutError } = require("./runQueue");

/**
 * Capa de alto nivel para ejecución de código de estudiantes.
 * Valida el código según su lenguaje y delega la ejecución a codeRunner.
 */
class CodeExecutor {
  /**
   * Ejecuta código con un solo input.
   */
  async execute(code, input = "", language = DEFAULT_LANGUAGE) {
    const validation = validators.validateCode(code, language);
    if (!validation.valid) {
      return { success: false, output: "", error: validation.error, executionTime: 0 };
    }

    const startTime = Date.now();
    let result;
    try {
      result = await queue.run(() => codeRunner.execute(code, input, language));
    } catch (err) {
      if (err instanceof QueueTimeoutError) {
        return { success: false, output: "", error: err.message, executionTime: Date.now() - startTime };
      }
      throw err;
    }
    const executionTime = Date.now() - startTime;

    logger.info("Code executed", {
      language,
      success: result.success,
      executionTime,
      exitCode: result.exitCode,
    });

    return { success: result.success, output: result.output, error: result.error, executionTime };
  }

  /**
   * Ejecuta código contra múltiples inputs.
   */
  async executeBatch(code, inputs, language = DEFAULT_LANGUAGE) {
    const validation = validators.validateCode(code, language);
    if (!validation.valid) {
      return { success: false, results: [], error: validation.error, executionTime: 0 };
    }

    const startTime = Date.now();
    let result;
    try {
      result = await queue.run(() => codeRunner.executeBatch(code, inputs, language));
    } catch (err) {
      if (err instanceof QueueTimeoutError) {
        return { success: false, results: [], error: err.message, executionTime: Date.now() - startTime };
      }
      throw err;
    }
    const executionTime = Date.now() - startTime;

    logger.info("Batch executed", {
      language,
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
   * Retorna los límites de ejecución y los lenguajes disponibles.
   */
  getLimits() {
    return {
      timeout: env.RUN_TIMEOUT,
      compileTimeout: env.COMPILE_TIMEOUT,
      maxOutput: env.OUTPUT_MAX,
      languages: enabledLanguages(),
      concurrency: queue.stats(),
    };
  }
}

module.exports = new CodeExecutor();
