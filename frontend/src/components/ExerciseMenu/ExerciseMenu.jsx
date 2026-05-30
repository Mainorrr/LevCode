import './ExerciseMenu.css'

/**
 * Menú de selección de ejercicios.
 *
 * Props:
 *   - exercises: array de { config, testcases }
 *   - onSelect: function(exercise) - callback al seleccionar un ejercicio
 *   - userInfo: { carnet, grupo }
 */
export default function ExerciseMenu({ exercises, onSelect, userInfo, solvedExercises, inProgressExercises }) {
  return (
    <div className="menu-container">
      <div className="menu-header">
        <h2 className="menu-title">Ejercicios</h2>
        <div className="menu-header-right">
          <span className="menu-user">
            {userInfo.carnet} &nbsp;·&nbsp; Grupo {userInfo.grupo}
          </span>
        </div>
      </div>

      <p className="menu-instructions">
        Cuando se le indique que puede comenzar, seleccione uno de los ejercicios de la lista. En la esquina superior derecha encontrará los botones para alternar entre modo claro y oscuro, y para acceder a la guía del lenguaje Python.
      </p>

      <div className="menu-grid">
        {exercises.map((exercise) => {
          const solved = solvedExercises.has(exercise.config.id)
          const inProgress = inProgressExercises.has(exercise.config.id)
          const btnClass = solved ? ' menu-card-btn-solved' : inProgress ? ' menu-card-btn-progress' : ''
          const label = solved ? 'Completado' : inProgress ? 'En progreso' : 'Comenzar'
          return (
            <div key={exercise.config.id} className="menu-card">
              <h3 className="menu-card-title">{exercise.config.title}</h3>
              <button
                className={`menu-card-btn${btnClass}`}
                onClick={() => onSelect(exercise)}
              >
                {label}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
