import { useState, useMemo, useEffect } from 'react'
import './AdminPanel.css'

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Filtros
  const [filterCarnet, setFilterCarnet] = useState('')
  const [filterCurso, setFilterCurso] = useState('')
  const [filterGrupo, setFilterGrupo] = useState('')
  const [filterProblem, setFilterProblem] = useState('')
  const [filterSolved, setFilterSolved] = useState('')

  // Contraseñas de acceso
  const [accessPasswords, setAccessPasswords] = useState([])
  const [newAccessPw, setNewAccessPw] = useState('')
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
      cursos: [...new Set(sessions.map((s) => s.curso))].sort(),
      grupos: [...new Set(sessions.map((s) => s.grupo))].sort(),
      problems: [...new Set(sessions.map((s) => s.problem_id))].sort(),
    }
  }, [sessions])

  // Filtrado
  const filtered = useMemo(() => {
    if (!sessions) return []
    return sessions.filter((s) => {
      if (filterCarnet && !s.carnet.toLowerCase().includes(filterCarnet.toLowerCase())) return false
      if (filterCurso && s.curso !== filterCurso) return false
      if (filterGrupo && s.grupo !== filterGrupo) return false
      if (filterProblem && s.problem_id !== filterProblem) return false
      if (filterSolved === 'true' && !s.solved) return false
      if (filterSolved === 'false' && s.solved) return false
      return true
    })
  }, [sessions, filterCarnet, filterCurso, filterGrupo, filterProblem, filterSolved])

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

  const clearFilters = () => {
    setFilterCarnet('')
    setFilterCurso('')
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
        body: JSON.stringify({ adminPassword: password, newPassword: newAccessPw.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAccessPwError(data.error)
        return
      }
      setNewAccessPw('')
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
        <div className="admin-header-right">
          <span className="admin-count">{filtered.length} de {sessions.length} registros</span>
          <button onClick={exportCSV} className="admin-btn-export">
            Exportar CSV
          </button>
          <button onClick={fetchSessions} disabled={loading} className="admin-btn-refresh">
            {loading ? 'Cargando...' : 'Actualizar datos'}
          </button>
        </div>
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
          value={filterCurso}
          onChange={(e) => setFilterCurso(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">Todos los cursos</option>
          {uniqueValues.cursos?.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Carnet</th>
              <th>Curso</th>
              <th>Grupo</th>
              <th>Ejercicio</th>
              <th>Intentos</th>
              <th>Resuelto</th>
              <th>show_tests</th>
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
                <td>{s.curso}</td>
                <td>{s.grupo}</td>
                <td>{s.problem_id}</td>
                <td>{s.attempts}</td>
                <td className={s.solved ? 'admin-solved' : 'admin-unsolved'}>
                  {s.solved ? 'Sí' : 'No'}
                </td>
                <td className={s.show_tests ? 'admin-solved' : 'admin-unsolved'}>
                  {s.show_tests == null ? '—' : s.show_tests ? 'Sí' : 'No'}
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
                <td colSpan="12" className="admin-empty">No hay registros que coincidan con los filtros</td>
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
          <button type="submit" className="admin-btn-export">Agregar</button>
        </form>
        {accessPwError && <p className="admin-error">{accessPwError}</p>}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha de creación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {accessPasswords.map((pw) => (
                <tr key={pw.id}>
                  <td>{pw.id}</td>
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
                  <td colSpan="3" className="admin-empty">No hay contraseñas configuradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
