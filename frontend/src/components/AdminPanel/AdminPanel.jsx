import { useState, useMemo, useEffect } from 'react'
import './AdminPanel.css'

function ExportButton({ onClick, label, info }) {
  return (
    <button onClick={onClick} className="admin-btn-export">
      <span className="export-label">{label}</span>
      <span className="info-tip" onClick={(e) => e.stopPropagation()}>
        <span className="info-tip-icon" tabIndex={0} aria-label={info}>i</span>
        <span className="info-tip-content" role="tooltip">{info}</span>
      </span>
    </button>
  )
}

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Filtros
  const [filterCarnet, setFilterCarnet] = useState('')
  const [filterGrupo, setFilterGrupo] = useState('')
  const [filterProblem, setFilterProblem] = useState('')
  const [filterSolved, setFilterSolved] = useState('')

  // Contraseñas de acceso
  const [accessPasswords, setAccessPasswords] = useState([])
  const [newAccessPw, setNewAccessPw] = useState('')
  const [newAccessPwDesc, setNewAccessPwDesc] = useState('')
  const [accessPwError, setAccessPwError] = useState('')

  const fetchSessions = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error de autenticación')
        setLoading(false)
        return
      }

      setSessions(data.sessions)
    } catch {
      setError('Error de conexión con el servidor')
    }
    setLoading(false)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    fetchSessions()
  }

  // Valores únicos para los dropdowns de filtro
  const uniqueValues = useMemo(() => {
    if (!sessions) return {}
    return {
      grupos: [...new Set(sessions.map((s) => s.grupo))].sort(),
      problems: [...new Set(sessions.map((s) => s.problem_id))].sort(),
    }
  }, [sessions])

  // Filtrado
  const filtered = useMemo(() => {
    if (!sessions) return []
    return sessions.filter((s) => {
      if (filterCarnet && !s.carnet.toLowerCase().includes(filterCarnet.toLowerCase())) return false
      if (filterGrupo && s.grupo !== filterGrupo) return false
      if (filterProblem && s.problem_id !== filterProblem) return false
      if (filterSolved === 'true' && !s.solved) return false
      if (filterSolved === 'false' && s.solved) return false
      return true
    })
  }, [sessions, filterCarnet, filterGrupo, filterProblem, filterSolved])

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'medium' })
  }

  const exportCSV = async () => {
    try {
      const res = await fetch('/api/export/csv', {
        headers: { 'X-API-Password': password },
      })
      if (!res.ok) {
        setError('Error al exportar CSV')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `levcode_sessions_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error de conexión al exportar')
    }
  }

  const exportSusCSV = async () => {
    try {
      const res = await fetch('/api/export/sus', {
        headers: { 'X-API-Password': password },
      })
      if (!res.ok) {
        setError('Error al exportar SUS')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `levcode_sus_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error de conexión al exportar')
    }
  }

  const downloadFromUrl = async (url, fallbackName) => {
    try {
      const res = await fetch(url, { headers: { 'X-API-Password': password } })
      if (!res.ok) {
        setError('Error al descargar archivo')
        return
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fallbackName
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setError('Error de conexión al descargar')
    }
  }

  const exportEventsLog = () =>
    downloadFromUrl('/api/export/log/events', `levcode_events_${new Date().toISOString().slice(0, 10)}.csv`)
  const exportSubmissionsLog = () =>
    downloadFromUrl('/api/export/log/submissions', `levcode_submissions_${new Date().toISOString().slice(0, 10)}.csv`)
  const exportLoginsLog = () =>
    downloadFromUrl('/api/export/log/logins', `levcode_logins_${new Date().toISOString().slice(0, 10)}.csv`)

  const exportAttemptsCSV = async () => {
    try {
      const res = await fetch('/api/export/attempts', {
        headers: { 'X-API-Password': password },
      })
      if (!res.ok) {
        setError('Error al exportar intentos')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `levcode_attempts_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error de conexión al exportar')
    }
  }

  const clearFilters = () => {
    setFilterCarnet('')
    setFilterGrupo('')
    setFilterProblem('')
    setFilterSolved('')
  }

  // ── Contraseñas de acceso ─────────────────────────────────────────────────
  const fetchAccessPasswords = async () => {
    try {
      const res = await fetch('/api/access/passwords', {
        headers: { 'X-Admin-Password': password },
      })
      if (res.ok) {
        const data = await res.json()
        setAccessPasswords(data.passwords)
      }
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    if (sessions) fetchAccessPasswords()
  }, [sessions])

  const handleAddAccessPw = async (e) => {
    e.preventDefault()
    setAccessPwError('')
    if (!newAccessPw.trim()) return
    try {
      const res = await fetch('/api/access/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: password,
          newPassword: newAccessPw.trim(),
          description: newAccessPwDesc.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAccessPwError(data.error)
        return
      }
      setNewAccessPw('')
      setNewAccessPwDesc('')
      fetchAccessPasswords()
    } catch {
      setAccessPwError('Error de conexión')
    }
  }

  const handleDeleteAccessPw = async (id) => {
    try {
      await fetch(`/api/access/passwords/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Password': password },
      })
      fetchAccessPasswords()
    } catch { /* silencioso */ }
  }

  // Pantalla de login
  if (sessions === null) {
    return (
      <div className="admin-container">
        <div className="admin-login">
          <h2>Panel de Administración</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              autoFocus
            />
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Panel de datos
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Panel de Administración</h2>
      </div>

      <div className="admin-export-bar">
        <ExportButton
          onClick={exportCSV}
          label="Exportar sesiones"
          info="Descarga la tabla exercise_sessions de la base de datos: una fila por (estudiante, ejercicio) con intentos, resuelto y tratamientos asignados."
        />
        <ExportButton
          onClick={exportSusCSV}
          label="Exportar cuestionarios SUS"
          info="Descarga la tabla sus_responses: respuestas del cuestionario SUS (q1..q10), entry_time, submit_time y si fue enviado."
        />
        <ExportButton
          onClick={exportAttemptsCSV}
          label="Exportar intentos"
          info="Descarga (en JSON) la tabla attempt_code: el código Python enviado en cada intento. Usa JSON porque el código tiene saltos de línea."
        />
        <ExportButton
          onClick={exportEventsLog}
          label="Exportar log de eventos"
          info="Descarga log.csv del servidor: eventos generales de usuario (EXERCISE_START, EXERCISE_SOLVED, ATTEMPT_FAIL, SUS_ENTER, SUS_SUBMIT...) con tratamientos."
        />
        <ExportButton
          onClick={exportSubmissionsLog}
          label="Exportar log de envíos"
          info="Descarga submissions_log.csv del servidor: cada ejecución de código Python con tiempo de ejecución."
        />
        <ExportButton
          onClick={exportLoginsLog}
          label="Exportar log de logins"
          info="Descarga login_log.csv del servidor: eventos de login (validación de contraseña por carnet)."
        />
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Buscar carnet..."
          value={filterCarnet}
          onChange={(e) => setFilterCarnet(e.target.value)}
          className="admin-filter-input"
        />
        <select
          value={filterGrupo}
          onChange={(e) => setFilterGrupo(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">Todos los grupos</option>
          {uniqueValues.grupos?.map((g) => (
            <option key={g} value={g}>Grupo {g}</option>
          ))}
        </select>
        <select
          value={filterProblem}
          onChange={(e) => setFilterProblem(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">Todos los ejercicios</option>
          {uniqueValues.problems?.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterSolved}
          onChange={(e) => setFilterSolved(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">Resuelto: todos</option>
          <option value="true">Resuelto</option>
          <option value="false">No resuelto</option>
        </select>
        <button onClick={clearFilters} className="admin-btn-clear">Limpiar filtros</button>
        <button onClick={fetchSessions} disabled={loading} className="admin-btn-refresh">
          {loading ? 'Cargando...' : 'Actualizar datos'}
        </button>
      </div>

      <div className="admin-table-count">
        {filtered.length} de {sessions.length} registros
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Carnet</th>
              <th>Grupo</th>
              <th>Ejercicio</th>
              <th>Intentos</th>
              <th>Resuelto</th>
              <th>hide_tests</th>
              <th>show_tries</th>
              <th>try_timer</th>
              <th>Inicio</th>
              <th>Último intento</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.carnet}</td>
                <td>{s.grupo}</td>
                <td>{s.problem_id}</td>
                <td>{s.attempts}</td>
                <td className={s.solved ? 'admin-solved' : 'admin-unsolved'}>
                  {s.solved ? 'Sí' : 'No'}
                </td>
                <td className={s.hide_tests ? 'admin-unsolved' : 'admin-solved'}>
                  {s.hide_tests == null ? '—' : s.hide_tests ? 'Sí' : 'No'}
                </td>
                <td className={s.show_tries ? 'admin-solved' : 'admin-unsolved'}>
                  {s.show_tries == null ? '—' : s.show_tries ? 'Sí' : 'No'}
                </td>
                <td className={s.try_timer ? 'admin-solved' : 'admin-unsolved'}>
                  {s.try_timer == null ? '—' : s.try_timer ? 'Sí' : 'No'}
                </td>
                <td>{formatDate(s.created_at)}</td>
                <td>{formatDate(s.updated_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="11" className="admin-empty">No hay registros que coincidan con los filtros</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Contraseñas de acceso ── */}
      <div className="admin-access-section">
        <h3>Contraseñas de acceso</h3>
        <form className="admin-access-form" onSubmit={handleAddAccessPw}>
          <input
            type="text"
            placeholder="Nueva contraseña..."
            value={newAccessPw}
            onChange={(e) => setNewAccessPw(e.target.value)}
            className="admin-filter-input"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newAccessPwDesc}
            onChange={(e) => setNewAccessPwDesc(e.target.value)}
            maxLength={200}
            className="admin-filter-input"
          />
          <button type="submit" className="admin-btn-export">Agregar</button>
        </form>
        {accessPwError && <p className="admin-error">{accessPwError}</p>}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Fecha de creación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {accessPasswords.map((pw) => (
                <tr key={pw.id}>
                  <td>{pw.id}</td>
                  <td>{pw.description || <span className="admin-empty-cell">—</span>}</td>
                  <td>{formatDate(pw.created_at)}</td>
                  <td>
                    <button
                      className="admin-btn-delete"
                      onClick={() => handleDeleteAccessPw(pw.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {accessPasswords.length === 0 && (
                <tr>
                  <td colSpan="4" className="admin-empty">No hay contraseñas configuradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
