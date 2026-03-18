const logger = require("./logger");

/**
 * Validates Python source code before execution
 */
const validatePythonCode = (code) => {
  // Check if code is empty
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return {
      valid: false,
      error: "Code cannot be empty",
    };
  }

  // Reject Java code
  const javaPatterns = [
    /public\s+class\s+\w+/,
    /public\s+static\s+void\s+main/,
    /System\.out\.print/,
    /import\s+java\./,
  ];

  for (const pattern of javaPatterns) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: "Solo se acepta código Python",
      };
    }
  }

  // Check for suspicious patterns (basic security check)
  const dangerousPatterns = [
    /import\s+subprocess/gi,
    /subprocess\./gi,
    /os\.system\s*\(/gi,
    /os\.popen\s*\(/gi,
    /os\.execv\s*\(/gi,
    /os\.execve\s*\(/gi,
    /__import__\s*\(/gi,
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

  const codeValidation = validatePythonCode(code);
  if (!codeValidation.valid) {
    return codeValidation;
  }

  return { valid: true };
};

module.exports = {
  validatePythonCode,
  validateSubmissionRequest,
};
