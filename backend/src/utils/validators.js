const logger = require("./logger");

/**
 * Validates Java source code before compilation
 */
const validateJavaCode = (code) => {
  // Check if code is empty
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return {
      valid: false,
      error: "Code cannot be empty",
    };
  }

  // Check for suspicious patterns (basic security check)
  const dangerousPatterns = [
    /Runtime\.getRuntime\(\)\.exec/gi,
    /ProcessBuilder/gi,
    /Files\.readAllBytes/gi,
    /new FileInputStream/gi,
    /System\.setSecurityManager/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: "Code contains potentially dangerous operations",
      };
    }
  }

  // Check maximum code size (1MB)
  const maxSize = 1024 * 1024;
  if (code.length > maxSize) {
    return {
      valid: false,
      error: "Code size exceeds maximum (1MB)",
    };
  }

  return { valid: true };
};

/**
 * Validates submission request payload
 */
const validateSubmissionRequest = (body) => {
  const { code, userId = null, problemId = null } = body;

  // Validate code
  if (!code) {
    return { valid: false, error: "Code is required" };
  }

  const codeValidation = validateJavaCode(code);
  if (!codeValidation.valid) {
    return codeValidation;
  }

  return { valid: true };
};

module.exports = {
  validateJavaCode,
  validateSubmissionRequest,
};
