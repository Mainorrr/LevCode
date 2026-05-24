import { useState } from 'react'
import { groups } from '../../courses'
import './UserForm.css'

export default function UserForm({ onSubmit }) {
  const [carnet, setCarnet] = useState('')
  const [selectedGrupo, setSelectedGrupo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const upperCarnet = carnet.trim().toUpperCase()

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
    if (!password) {
      setError('La contraseña es requerida.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/access/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, carnet: upperCarnet, grupo: selectedGrupo }),
      })
      if (!res.ok) {
        setError('Error del servidor. Intenta de nuevo.')
        setSubmitting(false)
        return
      }
      const data = await res.json()
      if (!data.valid) {
        setError(data.error || 'Contraseña incorrecta')
        setSubmitting(false)
        return
      }
    } catch {
      setError('Error de conexión con el servidor')
      setSubmitting(false)
      return
    }
    setSubmitting(false)

    onSubmit({
      carnet: upperCarnet,
      grupo: selectedGrupo,
      accessPassword: password,
    })
  }

  return (
    <div className="userform-container">
      <div className="userform-card">
        <h2 className="userform-title">Datos del Estudiante</h2>

        <form onSubmit={handleSubmit} className="userform-form">
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

          <div className="userform-field">
            <label htmlFor="password">Contraseña de acceso</label>
            <input
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="userform-input"
            />
          </div>

          {error && <p className="userform-error">{error}</p>}

          <button
            type="submit"
            className="userform-btn"
            disabled={submitting}
          >
            {submitting ? 'Verificando...' : 'Ver Ejercicios'}
          </button>
        </form>
      </div>
    </div>
  )
}
