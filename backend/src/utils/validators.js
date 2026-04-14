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

  // Check for suspicious patterns (basic security check)
  const dangerousPatterns = [
    /import\s+subprocess/gi,
    /subprocess\./gi,
    /os\.system\s*\(/gi,
    /os\.popen\s*\(/gi,
    /os\.execv\s*\(/gi,
    /os\.execve\s*\(/gi,
    /__import__\s*\(/gi,
    /importlib/gi,
    /eval\s*\(/gi,
    /exec\s*\(/gi,
    /compile\s*\(/gi,
    /open\s*\(/gi,
    /os\.environ/gi,
    /os\.path/gi,
    /os\.listdir/gi,
    /os\.remove/gi,
    /os\.rename/gi,
    /os\.mkdir/gi,
    /os\.rmdir/gi,
    /os\.getcwd/gi,
    /os\.chdir/gi,
    /shutil/gi,
    /socket/gi,
    /http/gi,
    /urllib/gi,
    /requests/gi,
    /ctypes/gi,
    /signal/gi,
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
