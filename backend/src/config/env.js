require('dotenv').config({
  path: process.env.NODE_ENV === 'development' 
    ? './.env.development' 
    : './.env'
});

module.exports = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Security
  API_PASSWORD: process.env.API_PASSWORD || 'levcode123',

  // Docker & Java Execution
  DOCKER_IMAGE: process.env.DOCKER_IMAGE || 'levcode-java:latest',
  JAVA_TIMEOUT: parseInt(process.env.JAVA_TIMEOUT || '5000', 10),
  JAVA_MEMORY: process.env.JAVA_MEMORY || '128m',
  JAVA_OUTPUT_MAX: parseInt(process.env.JAVA_OUTPUT_MAX || '10485760', 10),

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/levcode',

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Derived
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
