require("dotenv").config({
  path:
    process.env.NODE_ENV === "development" ? "./.env.development" : "./.env",
});

module.exports = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Security
  API_PASSWORD: process.env.API_PASSWORD || "",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",

  // Ejecución de código (los nombres PYTHON_* se leen como fallback para no
  // romper despliegues existentes)
  RUN_TIMEOUT: parseInt(process.env.RUN_TIMEOUT || process.env.PYTHON_TIMEOUT || "5000", 10),
  COMPILE_TIMEOUT: parseInt(process.env.COMPILE_TIMEOUT || "10000", 10),
  OUTPUT_MAX: parseInt(process.env.OUTPUT_MAX || process.env.PYTHON_OUTPUT_MAX || "10485760", 10),

  // Lenguajes expuestos a los estudiantes. C++ y Java quedan fuera hasta que
  // existan sus límites de proceso y listas de patrones bloqueados.
  ENABLED_LANGUAGES: (process.env.ENABLED_LANGUAGES || "python")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Database
  DATABASE_URL:
    process.env.DATABASE_URL || "postgresql://localhost:5432/levcode",

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Derived
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};
