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

  // Python Execution
  PYTHON_TIMEOUT: parseInt(process.env.PYTHON_TIMEOUT || "5000", 10),
  PYTHON_OUTPUT_MAX: parseInt(process.env.PYTHON_OUTPUT_MAX || "10485760", 10),

  // Database
  DATABASE_URL:
    process.env.DATABASE_URL || "postgresql://localhost:5432/levcode",

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Derived
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};
