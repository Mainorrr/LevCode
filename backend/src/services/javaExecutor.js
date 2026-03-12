const dockerManager = require('./dockerManager');
const validators = require('../utils/validators');
const logger = require('../utils/logger');
const dockerConfig = require('../config/docker');

/**
 * Manages Java code compilation and execution
 */
class JavaExecutor {
  /**
   * Execute Java code
   * @param {string} code - Java source code
   * @returns {Promise<{success: boolean, output: string, error: string, executionTime: number}>}
   */
  async execute(code) {
    // Validate input code
    const validation = validators.validateJavaCode(code);
    if (!validation.valid) {
      return {
        success: false,
        output: '',
        error: validation.error,
        executionTime: 0,
      };
    }

    // Execute in Docker
    const startTime = Date.now();
    const result = await dockerManager.executeInDocker(
      code,
      dockerConfig.LIMITS.timeout
    );
    const executionTime = Date.now() - startTime;

    logger.info('Java code executed', {
      success: result.success,
      executionTime,
      exitCode: result.exitCode,
    });

    return {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime,
    };
  }

  /**
   * Get execution limits
   */
  getLimits() {
    return dockerConfig.LIMITS;
  }
}

module.exports = new JavaExecutor();
