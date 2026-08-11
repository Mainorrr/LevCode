const { DEFAULT_LANGUAGE, isEnabled } = require("../services/languages");

const MAX_CODE_SIZE = 1024 * 1024; // 1MB

/**
 * Patrones bloqueados por lenguaje.
 *
 * Un lenguaje sin lista definida aquí NO puede ejecutarse, aunque esté en el
 * registro de languages.js: validateCode falla cerrado.
 *
 * Para lenguajes compilados esta lista NO es la defensa principal — el código
 * nativo llega a las syscalls por caminos que ninguna regex cubre. La defensa
 * real son los límites de proceso (processLimits.js) y el kill de grupo. Aquí
 * solo se cierran las puertas obvias: ejecutar programas, tocar el sistema de
 * archivos y abrir red.
 *
 * Se prefiere errar hacia dejar pasar antes que hacia el falso positivo: un
 * estudiante bloqueado por escribir algo inocente reintenta a ciegas, que es
 * justo la conducta que este proyecto mide.
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
    // Crear procesos: sin esto una fork bomb pasaba la validación.
    /os\.fork/i,
    /os\.spawn/i,
    /multiprocessing/i,
    /pty\./i,
  ],

  cpp: [
    // Ejecutar programas
    /\bsystem\s*\(/,
    /\bpopen\s*\(/,
    /\bfork\s*\(/,
    /\bexec[lv][pe]?e?\s*\(/,
    /\bdlopen\s*\(/,
    /\b__asm\b|\basm\s*(volatile)?\s*[({]/,
    // Sistema de archivos y red por cabecera. Bloquear la cabecera es más
    // fiable que perseguir cada función que trae.
    /#\s*include\s*[<"]\s*(fstream|filesystem|cstdio|stdio\.h|unistd\.h|sys\/|netdb\.h|arpa\/|netinet\/|dlfcn\.h|csignal|signal\.h|thread|future)/,
    /\bstd\s*::\s*filesystem/,
    /\bfopen\s*\(|\bfreopen\s*\(/,
    /\bofstream\b|\bifstream\b|\bfstream\b/,
  ],

  java: [
    // Ejecutar programas
    /\bRuntime\s*\.\s*getRuntime\s*\(/,
    /\bProcessBuilder\b/,
    // Sistema de archivos
    /\bjava\s*\.\s*io\s*\.\s*File\b/,
    /\bFile(Reader|Writer|InputStream|OutputStream)\b/,
    /\bRandomAccessFile\b/,
    /\bjava\s*\.\s*nio\s*\.\s*file\b/,
    /\bFiles\s*\.|\bPaths\s*\./,
    // Red
    /\bjava\s*\.\s*net\b/,
    /\b(Socket|ServerSocket|URL|URLConnection|HttpClient)\s*[(.]/,
    // Reflexión, carga de clases y salidas al entorno
    /\bjava\s*\.\s*lang\s*\.\s*reflect\b/,
    /\bClassLoader\b|\bsun\s*\.\s*misc\b|\bUnsafe\b/,
    /\bSystem\s*\.\s*(exit|load|loadLibrary|getenv|getProperty)\s*\(/,
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
