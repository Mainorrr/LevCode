import './ExerciseMenu.css'

/**
 * Menú de selección de ejercicios.
 *
 * Props:
 *   - exercises: array de { config, testcases }
 *   - onSelect: function(exercise) - callback al seleccionar un ejercicio
 *   - userInfo: { carnet, grupo }
 *   - susSubmitted: boolean - si ya respondió el cuestionario final
 *   - onOpenSus: function - abre la confirmación del cuestionario
 */
export default function ExerciseMenu({ exercises, onSelect, userInfo, solvedExercises, inProgressExercises, susSubmitted, onOpenSus }) {
  const allSolved = exercises.length > 0 && exercises.every((ex) => solvedExercises.has(ex.config.id))
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
        Cuando se le indique que puede comenzar, seleccione uno de los ejercicios de la lista. En la esquina superior derecha encontrará los botones para alternar entre modo claro y oscuro, y para acceder a la guía del lenguaje que esté usando.
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

      {/* Cuestionario final: grande y debajo de los ejercicios para que nadie se
          vaya sin responderlo. Abre la misma confirmación que el botón de la
          barra, que advierte que debe ser lo último antes de salir. */}
      {susSubmitted ? (
        <div className="menu-sus menu-sus-done">
          <div>
            <h3 className="menu-sus-title">Cuestionario respondido ✓</h3>
            <p className="menu-sus-text">Gracias. Ya puede salir del laboratorio.</p>
          </div>
        </div>
      ) : (
        <div className={`menu-sus${allSolved ? ' menu-sus-ready' : ''}`}>
          <div>
            <h3 className="menu-sus-title">Cuestionario final</h3>
            <p className="menu-sus-text">
              {allSolved
                ? 'Completó todos los ejercicios. Responda el cuestionario antes de salir del laboratorio.'
                : 'Al terminarse el tiempo o al completar todos los ejercicios, responda el cuestionario. Debe ser lo último que realice antes de salir del laboratorio.'}
            </p>
          </div>
          <button type="button" className="menu-sus-btn" onClick={onOpenSus}>
            Responder cuestionario
          </button>
        </div>
      )}
    </div>
  )
}
