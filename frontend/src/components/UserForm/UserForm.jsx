import { useState, useEffect } from 'react'
import './UserForm.css'

/**
 * Formulario inicial para capturar datos del estudiante.
 * Curso y grupo se seleccionan desde la base de datos.
 *
 * Props:
 *   - onSubmit: function({ carnet, grupo, semestre, curso }) - callback al confirmar datos
 */
export default function UserForm({ onSubmit }) {
  const [carnet, setCarnet] = useState('')
  const [semestre, setSemestre] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedGrupo, setSelectedGrupo] = useState('')
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data) => setCourses(data))
      .catch(() => setError('No se pudieron cargar los cursos. Verifica tu conexión.'))
      .finally(() => setLoadingCourses(false))
  }, [])

  const validateCarnet = (value) => /^[A-Za-z]\d{5}$/.test(value)

  const selectedCourse = courses.find((c) => String(c.id) === selectedCourseId)

  const handleCourseChange = (e) => {
    setSelectedCourseId(e.target.value)
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
    if (!selectedCourseId) {
      setError('Debes seleccionar un curso.')
      return
    }
    if (!selectedGrupo) {
      setError('Debes seleccionar un grupo.')
      return
    }
    if (!semestre || semestre < 1 || semestre > 8) {
      setError('El semestre debe ser un número entre 1 y 8.')
      return
    }

    onSubmit({
      carnet: carnet.toUpperCase(),
      grupo: selectedGrupo,
      semestre: Number(semestre),
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
              value={selectedCourseId}
              onChange={handleCourseChange}
              className="userform-input"
              disabled={loadingCourses}
            >
              <option value="">{loadingCourses ? 'Cargando cursos...' : 'Selecciona un curso'}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
