import { useState } from 'react'
import './UserForm.css'

/**
 * Formulario inicial para capturar datos del estudiante.
 * Esta información se almacena con cada submission para análisis estadístico.
 *
 * Props:
 *   - onSubmit: function({ carnet, grupo, semestre, curso }) - callback al confirmar datos
 */
export default function UserForm({ onSubmit }) {
  const [carnet, setCarnet] = useState('')
  const [grupo, setGrupo] = useState('')
  const [semestre, setSemestre] = useState('')
  const [curso, setCurso] = useState('')
  const [error, setError] = useState('')

  const validateCarnet = (value) => /^[A-Za-z]\d{5}$/.test(value)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!carnet.trim()) {
      setError('El carnet estudiantil es requerido.')
      return
    }
    if (!validateCarnet(carnet)) {
      setError('Formato de carnet inválido. Debe ser 1 letra seguida de 5 dígitos (ej: A12345).')
      return
    }
    if (!grupo.trim()) {
      setError('El grupo es requerido.')
      return
    }
    if (!semestre || semestre < 1 || semestre > 8) {
      setError('El semestre debe ser un número entre 1 y 8.')
      return
    }
    if (!curso.trim()) {
      setError('El curso es requerido.')
      return
    }

    onSubmit({ carnet: carnet.toUpperCase(), grupo: grupo.trim(), semestre: Number(semestre), curso: curso.trim() })
  }

  return (
    <div className="userform-container">
      <div className="userform-card">
        <h2 className="userform-title">Datos del Estudiante</h2>
        <p className="userform-subtitle">
          Ingresa tu información antes de comenzar. Estos datos son necesarios para registrar tus intentos.
        </p>

        <form onSubmit={handleSubmit} className="userform-form">
          <div className="userform-field">
            <label htmlFor="carnet">Carnet Estudiantil</label>
            <input
              id="carnet"
              type="text"
              placeholder="ej: A12345"
              value={carnet}
              onChange={(e) => setCarnet(e.target.value)}
              maxLength={6}
              className="userform-input"
            />
          </div>

          <div className="userform-field">
            <label htmlFor="curso">Curso</label>
            <input
              id="curso"
              type="text"
              placeholder="ej: Programación I"
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              maxLength={255}
              className="userform-input"
            />
          </div>

          <div className="userform-field">
            <label htmlFor="grupo">Grupo</label>
            <input
              id="grupo"
              type="text"
              placeholder="ej: 01"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="userform-input"
            />
          </div>

          <div className="userform-field">
            <label htmlFor="semestre">
              Semestre de la carrera
              <span className="userform-tooltip">
                i
                <span className="userform-tooltip-text">
                  Indica el semestre en el que llevas la mayoría de tus cursos actualmente.
                </span>
              </span>
            </label>
            <input
              id="semestre"
              type="number"
              placeholder="ej: 3"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              min={1}
              max={8}
              className="userform-input"
            />
          </div>

          {error && <p className="userform-error">{error}</p>}

          <button type="submit" className="userform-btn">
            Ver Ejercicios
          </button>
        </form>
      </div>
    </div>
  )
}
