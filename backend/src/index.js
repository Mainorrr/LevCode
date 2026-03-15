const app = require("./server");
const env = require("./config/env");
const logger = require("./utils/logger");
const migrate = require("./db/migrate");

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
    dockerImage: env.DOCKER_IMAGE,
  });
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

module.exports = server;
