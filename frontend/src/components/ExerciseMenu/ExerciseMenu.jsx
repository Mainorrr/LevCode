import './ExerciseMenu.css'

/**
 * Menú de selección de ejercicios.
 *
 * Props:
 *   - exercises: array de { config, testcases }
 *   - onSelect: function(exercise) - callback al seleccionar un ejercicio
 *   - userInfo: { carnet, grupo, semestre }
 */
export default function ExerciseMenu({ exercises, onSelect, userInfo }) {
  return (
    <div className="menu-container">
      <div className="menu-header">
        <h2 className="menu-title">Ejercicios</h2>
        <span className="menu-user">
          {userInfo.carnet} &nbsp;|&nbsp; Grupo {userInfo.grupo} &nbsp;|&nbsp; Semestre {userInfo.semestre}
        </span>
      </div>

      <div className="menu-grid">
        {exercises.map((exercise) => (
          <div key={exercise.config.id} className="menu-card">
            <h3 className="menu-card-title">{exercise.config.title}</h3>
            <p className="menu-card-desc">
              {exercise.config.description.split('\n')[0]}
            </p>
            <div className="menu-card-meta">
              <span className="menu-card-cases">
                {exercise.testcases.length} caso{exercise.testcases.length !== 1 ? 's' : ''} de prueba
              </span>
            </div>
            <button
              className="menu-card-btn"
              onClick={() => onSelect(exercise)}
            >
              Comenzar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
