const { isCarnetAllowedNow } = require('../config/scheduleConfig')

/**
 * Bloquea POST requests cuando el carnet del request está fuera del horario
 * asignado a su grupo. Los GET y los demás métodos siempre pasan.
 *
 * Aplicar antes del router en rutas que envían datos al backend
 * (submissions, sessions). NO aplicar al router de SUS.
 */
function scheduleGuard(req, res, next) {
  if (req.method !== 'POST') return next()

  // Identificar carnet en el body (submissions usa userId; sessions usa carnet)
  const carnet = (req.body && (req.body.userId || req.body.carnet)) || null
  if (!carnet) return next() // que el endpoint maneje la falta de carnet

  if (!isCarnetAllowedNow(carnet)) {
    return res.status(403).json({
      success: false,
      error: 'Fuera del horario asignado a tu grupo. Solo el cuestionario está disponible.',
    })
  }
  next()
}

module.exports = scheduleGuard
