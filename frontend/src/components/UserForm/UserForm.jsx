import { useState } from 'react'
import { courses } from '../../courses'
import './UserForm.css'

/**
 * Formulario inicial para capturar datos del estudiante.
 * Cursos y grupos se cargan desde un archivo de configuración local.
 *
 * Props:
 *   - onSubmit: function({ carnet, grupo, curso }) - callback al confirmar datos
 */
export default function UserForm({ onSubmit, initialData }) {
  const initCourseIdx = initialData
    ? String(courses.findIndex((c) => c.name === initialData.curso))
    : ''

  const [carnet, setCarnet] = useState(initialData?.carnet || '')
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(initCourseIdx !== '-1' ? initCourseIdx : '')
  const [selectedGrupo, setSelectedGrupo] = useState(initialData?.grupo || '')
  const [error, setError] = useState('')

  const validateCarnet = (value) => /^[A-Za-z]\d{5}$/.test(value)

  const selectedCourse = selectedCourseIdx !== '' ? courses[selectedCourseIdx] : null

  const handleCourseChange = (e) => {
    setSelectedCourseIdx(e.target.value)
    setSelectedGrupo('')
  }

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
    if (selectedCourseIdx === '') {
      setError('Debes seleccionar un curso.')
      return
    }
    if (!selectedGrupo) {
      setError('Debes seleccionar un grupo.')
      return
    }

    onSubmit({
      carnet: carnet.toUpperCase(),
      grupo: selectedGrupo,
      curso: selectedCourse.name,
    })
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
            <select
              id="curso"
              value={selectedCourseIdx}
              onChange={handleCourseChange}
              className="userform-input"
            >
              <option value="">Selecciona un curso</option>
              {courses.map((c, i) => (
                <option key={c.name} value={i}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="userform-field">
            <label htmlFor="grupo">Grupo</label>
            <select
              id="grupo"
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
              className="userform-input"
              disabled={!selectedCourse}
            >
              <option value="">
                {!selectedCourse ? 'Selecciona un curso primero' : 'Selecciona un grupo'}
              </option>
              {selectedCourse?.groups?.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
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
