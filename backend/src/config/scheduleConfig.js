/**
 * Configuración de horarios de laboratorio por grupo.
 *
 * Cada grupo tiene una o más ventanas (start/end) en hora local de Costa Rica
 * (UTC-6, sin DST). Los formatos son ISO 8601 sin zona — el offset se aplica
 * automáticamente via la constante TIMEZONE.
 *
 * Fuera de estas ventanas se bloquean:
 *   - POST /api/submissions       (ejecutar código)
 *   - POST /api/submissions/batch (ejecutar código batch)
 *   - POST /api/sessions          (registrar intento)
 *
 * Lo que NO se bloquea (siempre permitido):
 *   - /api/sus            (cuestionario SUS, lo único accesible fuera de horario)
 *   - Cualquier GET (lectura de estado, tratamientos, etc.)
 *   - /api/admin, /api/access, /api/export (operaciones administrativas)
 *
 * ─── Toggles para pruebas ────────────────────────────────────────────────
 *   BYPASS_ALL_SCHEDULES = true   →  ignora el horario para TODOS los grupos.
 *                                    Útil para QA general o demos.
 *   DISABLE_SCHEDULE_FOR_TEST     →  el grupo "Test" nunca se ve restringido
 *                                    (carnet X00000 puede entrar siempre).
 *
 * Para ajustar un horario: edita la sección SCHEDULES más abajo.
 */

// ─────────────────── CONFIGURACIÓN ───────────────────
const BYPASS_ALL_SCHEDULES = false
const DISABLE_SCHEDULE_FOR_TEST = true
const TIMEZONE = '-06:00' // Costa Rica
// ─────────────────────────────────────────────────────

// Horarios por grupo (extraídos de Exp26a.csv)
const SCHEDULES = {
  '01': [
    { start: '2026-06-05T13:00', end: '2026-06-05T15:00' }, // Vie 05-Jun 13:00-15:00 · Aula 302
  ],
  '02': [
    { start: '2026-06-04T09:00', end: '2026-06-04T12:00' }, // Jue 04-Jun 09:00-12:00 · Aula 6-6
    { start: '2026-06-08T10:00', end: '2026-06-08T12:00' }, // Lun 08-Jun 10:00-12:00 · Aula 6-6
  ],
  '03': [
    { start: '2026-06-09T07:00', end: '2026-06-09T10:00' }, // Mar 09-Jun 07:00-10:00 · Aula 302
  ],
  '04': [
    { start: '2026-06-04T09:00', end: '2026-06-04T12:00' }, // Jue 04-Jun 09:00-12:00 · Aula 303
    { start: '2026-06-08T10:00', end: '2026-06-08T12:00' }, // Lun 08-Jun 10:00-12:00 · Aula 303
  ],
  '05': [
    { start: '2026-06-04T13:00', end: '2026-06-04T15:00' }, // Jue 04-Jun 13:00-15:00 · Aula 303
  ],
  '06': [
    { start: '2026-06-04T09:00', end: '2026-06-04T12:00' }, // Jue 04-Jun 09:00-12:00 · Auditorio
    { start: '2026-06-08T10:00', end: '2026-06-08T12:00' }, // Lun 08-Jun 10:00-12:00 · Auditorio
  ],
  '07': [
    { start: '2026-06-11T07:00', end: '2026-06-11T09:00' }, // Jue 11-Jun 07:00-09:00 · Aula 302
  ],
  '08': [
    { start: '2026-06-04T13:00', end: '2026-06-04T15:00' }, // Jue 04-Jun 13:00-15:00 · Aula 302
  ],
  '09': [
    { start: '2026-06-05T09:00', end: '2026-06-05T12:00' }, // Vie 05-Jun 09:00-12:00 · Aula 303
  ],
}

const { getGroupsForCarnet } = require('../Users/usersLoader')

function isInsideWindow(now, window) {
  const start = new Date(window.start + ':00' + TIMEZONE)
  const end = new Date(window.end + ':00' + TIMEZONE)
  return now >= start && now <= end
}

/**
 * Determina si un carnet puede enviar código en este momento.
 * - Aplica BYPASS_ALL_SCHEDULES y DISABLE_SCHEDULE_FOR_TEST.
 * - Si el carnet pertenece a varios grupos, basta con que UNO esté activo.
 */
function isCarnetAllowedNow(carnet, now = new Date()) {
  if (BYPASS_ALL_SCHEDULES) return true
  const groups = getGroupsForCarnet(carnet)
  if (!groups || groups.size === 0) return false
  if (DISABLE_SCHEDULE_FOR_TEST && groups.has('Test')) return true
  for (const grupo of groups) {
    const windows = SCHEDULES[grupo]
    if (!windows) continue
    for (const w of windows) {
      if (isInsideWindow(now, w)) return true
    }
  }
  return false
}

module.exports = {
  isCarnetAllowedNow,
  SCHEDULES,
  BYPASS_ALL_SCHEDULES,
  DISABLE_SCHEDULE_FOR_TEST,
}
