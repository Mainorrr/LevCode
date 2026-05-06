/**
 * Stamps each request with a start timestamp so loggers can compute duration_ms.
 */
module.exports = function requestTimer(req, res, next) {
  req._startedAt = Date.now();
  next();
};
