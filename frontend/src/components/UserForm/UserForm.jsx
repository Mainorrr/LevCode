import { useState, useEffect } from 'react'
import { groups } from '../../courses'
import './UserForm.css'

export default function UserForm({ onSubmit, initialData, accessPassword }) {
  const [nombreCompleto, setNombreCompleto] = useState(initialData?.nombre_completo || '')
  const [carnet, setCarnet] = useState(initialData?.carnet || '')
  const [selectedGrupo, setSelectedGrupo] = useState(initialData?.grupo || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [usersMap, setUsersMap] = useState(null)  // null = cargando, object = listo
  const [loadError, setLoadError] = useState(false)

  const loadUsers = () => {
    setLoadError(false)
    setUsersMap(null)
    fetch('/api/users', {
      headers: { 'X-Access-Password': accessPassword },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.success) {
          const map = {}
          for (const u of data.users) map[u.carnet.toUpperCase()] = u.grupo
          setUsersMap(map)
        } else {
          setLoadError(true)
        }
      })
      .catch(() => setLoadError(true))
  }

  useEffect(() => { loadUsers() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const upperCarnet = carnet.trim().toUpperCase()

    if (!nombreCompleto.trim()) {
      setError('El nombre completo es requerido.')
      return
    }
    if (!upperCarnet) {
      setError('El carnet estudiantil es requerido.')
      return
    }
    if (!/^[A-Za-z\d]{6}$/.test(upperCarnet)) {
      setError('Formato de carnet inválido. Debe tener exactamente 6 caracteres alfanuméricos.')
      return
    }
    if (!selectedGrupo) {
      setError('Debes seleccionar un grupo.')
      return
    }
    if (selectedGrupo !== 'Test') {
      if (!(upperCarnet in usersMap)) {
        setError('carnet no es parte del proyecto')
        return
      }
      if (usersMap[upperCarnet] !== selectedGrupo) {
        setError('carnet y grupo son diferentes')
        return
      }
    }

    setSubmitting(true)
    try {
      await fetch(`/api/users/${upperCarnet}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Password': accessPassword,
        },
        body: JSON.stringify({ nombre_completo: nombreCompleto.trim() }),
      })
    } catch {
      // Continuar aunque falle el guardado del nombre
    }
    setSubmitting(false)

    onSubmit({
      carnet: upperCarnet,
      grupo: selectedGrupo,
      nombre_completo: nombreCompleto.trim(),
    })
  }

  const isReady = usersMap !== null && !loadError

  return (
    <div className="userform-container">
      <div className="userform-card">
        <h2 className="userform-title">Datos del Estudiante</h2>

        {loadError && (
          <div className="userform-load-error">
            <p>No se pudo cargar la lista de estudiantes.</p>
            <button className="userform-retry-btn" onClick={loadUsers}>Reintentar</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="userform-form">
          <div className="userform-field">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              id="nombre"
              type="text"
              placeholder="ej: Juan Pérez Solís"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="userform-input"
            />
          </div>

          <div className="userform-field">
            <label htmlFor="carnet">Carnet Estudiantil</label>
            <input
              id="carnet"
              type="text"
              placeholder="ej: C12345"
              value={carnet}
              onChange={(e) => setCarnet(e.target.value)}
              maxLength={6}
              className="userform-input"
            />
          </div>

          <div className="userform-field">
            <label htmlFor="grupo">Grupo</label>
            <select
              id="grupo"
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
              className="userform-input"
            >
              <option value="">Selecciona un grupo</option>
              {groups.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </div>

          {error && <p className="userform-error">{error}</p>}

          <button
            type="submit"
            className="userform-btn"
            disabled={!isReady || submitting}
          >
            {submitting ? 'Verificando...' : !isReady ? 'Cargando...' : 'Ver Ejercicios'}
          </button>
        </form>
      </div>
    </div>
  )
}
