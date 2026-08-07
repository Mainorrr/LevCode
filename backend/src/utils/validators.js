const { DEFAULT_LANGUAGE, isEnabled } = require("../services/languages");

const MAX_CODE_SIZE = 1024 * 1024; // 1MB

/**
 * Patrones bloqueados por lenguaje.
 *
 * Un lenguaje sin lista definida aquí NO puede ejecutarse, aunque esté en el
 * registro de languages.js: validateCode falla cerrado. Las listas de C++ y Java
 * llegan junto con los límites de proceso (fase 2) — para lenguajes compilados
 * una lista negra por regex es insuficiente por sí sola.
 */
const DANGEROUS_PATTERNS = {
  python: [
    /import\s+subprocess/i,
    /subprocess\./i,
    /os\.system\s*\(/i,
    /os\.popen\s*\(/i,
    /os\.execv\s*\(/i,
    /os\.execve\s*\(/i,
    /__import__\s*\(/i,
    /importlib/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /compile\s*\(/i,
    /open\s*\(/i,
    /os\.environ/i,
    /os\.path/i,
    /os\.listdir/i,
    /os\.remove/i,
    /os\.rename/i,
    /os\.mkdir/i,
    /os\.rmdir/i,
    /os\.getcwd/i,
    /os\.chdir/i,
    /shutil/i,
    /socket/i,
    /http/i,
    /urllib/i,
    /requests/i,
    /ctypes/i,
    /signal/i,
  ],
};

/**
 * Valida el código fuente de un estudiante antes de ejecutarlo.
 */
const validateCode = (code, language = DEFAULT_LANGUAGE) => {
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return { valid: false, error: "Code cannot be empty" };
  }

  const patterns = DANGEROUS_PATTERNS[language];
  if (!patterns) {
    return { valid: false, error: `Lenguaje no soportado: ${language}` };
  }

  for (const pattern of patterns) {
    if (pattern.test(code)) {
      return { valid: false, error: "Code contains potentially dangerous operations" };
    }
  }

  if (code.length > MAX_CODE_SIZE) {
    return { valid: false, error: "Code size exceeds maximum (1MB)" };
  }

  return { valid: true };
};

/**
 * Valida que el lenguaje solicitado esté disponible para los estudiantes.
 */
const validateLanguage = (language) => {
  if (typeof language !== "string" || !language) {
    return { valid: false, error: "El campo language debe ser una cadena" };
  }
  if (!isEnabled(language)) {
    return { valid: false, error: `Lenguaje no disponible: ${language}` };
  }
  return { valid: true };
};

/**
 * Valida el payload de una submission.
 */
const validateSubmissionRequest = (body) => {
  const { code, language = DEFAULT_LANGUAGE } = body;

  if (!code) {
    return { valid: false, error: "Code is required" };
  }

  const languageValidation = validateLanguage(language);
  if (!languageValidation.valid) {
    return languageValidation;
  }

  return validateCode(code, language);
};

module.exports = {
  validateCode,
  validateLanguage,
  validateSubmissionRequest,
};
