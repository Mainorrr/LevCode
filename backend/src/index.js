const app = require("./server");
const env = require("./config/env");
const logger = require("./utils/logger");
const migrate = require("./db/migrate");
const { enabledLanguages } = require("./services/languages");

const PORT = env.PORT;

// Ejecutar migraciones antes de aceptar tráfico
migrate().then(() => {
  logger.info("Database ready");
}).catch(() => {
  logger.warn("Database unavailable — sessions endpoint will return errors");
});

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: env.NODE_ENV,
  });
  // Un ENABLED_LANGUAGES mal escrito deja al juez sin lenguajes y todo envío se
  // rechaza. Que quede a la vista en los Deploy Logs, no solo al primer envío.
  const habilitados = enabledLanguages();
  const desconocidos = env.ENABLED_LANGUAGES.filter((id) => !habilitados.includes(id));
  if (habilitados.length === 0) {
    logger.error("NINGUN lenguaje habilitado: revisar ENABLED_LANGUAGES", { valor: process.env.ENABLED_LANGUAGES });
  } else {
    logger.info(`Lenguajes habilitados: ${habilitados.join(", ")}`);
  }
  if (desconocidos.length > 0) {
    logger.warn("ENABLED_LANGUAGES tiene valores que no son lenguajes conocidos", { desconocidos });
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    error: reason instanceof Error ? reason.message : String(reason),
  });
});

module.exports = server;
