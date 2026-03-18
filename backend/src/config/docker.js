const env = require("./env");

module.exports = {
  // Docker container limits
  LIMITS: {
    timeout: env.PYTHON_TIMEOUT, // 5000ms
    memory: env.PYTHON_MEMORY, // 128m
    maxOutput: env.PYTHON_OUTPUT_MAX, // 10MB
  },

  // Docker run options
  RUN_OPTIONS: {
    Image: env.DOCKER_IMAGE,
    HostConfig: {
      Memory: 128 * 1024 * 1024, // 128MB in bytes
      NetworkMode: "none", // No network access
    },
    Cmd: ["bash"],
  },

  // Python execution
  PYTHON: {
    filename: "solution.py",
    timeout: env.PYTHON_TIMEOUT,
  },
};
