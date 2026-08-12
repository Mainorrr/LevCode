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

  // Cola de ejecuciones. Compilar es lo caro, asi que el tope cuenta
  // submissions completas, no casos de prueba.
  MAX_CONCURRENT_RUNS: parseInt(process.env.MAX_CONCURRENT_RUNS || "4", 10),
  QUEUE_TIMEOUT: parseInt(process.env.QUEUE_TIMEOUT || "30000", 10),

  // Límites de recursos por proceso (se aplican con prlimit)
  MEMORY_MAX_MB: parseInt(process.env.MEMORY_MAX_MB || "512", 10),
  FSIZE_MAX_MB: parseInt(process.env.FSIZE_MAX_MB || "16", 10),
  // APAGADO por defecto (0). RLIMIT_NPROC no cuenta procesos sino TAREAS
  // (hilos), y es por UID en todo el sistema, no por proceso. Mientras el codigo
  // del estudiante comparta UID con el backend, cualquier tope razonable ya esta
  // superado por los hilos que existen: medido en una sesion normal, 147
  // procesos son 1193 tareas, asi que un tope de 96 —o de 512— hace que g++
  // falle al lanzar cc1plus y NINGUN lenguaje compilado funcione.
  // Mientras tanto la fork bomb queda acotada por el kill de grupo (5s) y por
  // la lista de patrones. Este tope recobra sentido al ejecutar con un UID
  // dedicado: ahi si aisla, y se enciende poniendo NPROC_MAX > 0.
  NPROC_MAX: parseInt(process.env.NPROC_MAX || "0", 10),

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
