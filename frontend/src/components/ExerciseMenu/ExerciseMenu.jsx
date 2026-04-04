import './ExerciseMenu.css'

/**
 * Menú de selección de ejercicios.
 *
 * Props:
 *   - exercises: array de { config, testcases }
 *   - onSelect: function(exercise) - callback al seleccionar un ejercicio
 *   - userInfo: { carnet, grupo, curso }
 */
export default function ExerciseMenu({ exercises, onSelect, userInfo, solvedExercises, inProgressExercises, onChangeUser }) {
  return (
    <div className="menu-container">
      <div className="menu-header">
        <h2 className="menu-title">Ejercicios</h2>
        <div className="menu-header-right">
          <span className="menu-user">
            {userInfo.carnet} &nbsp;·&nbsp; {userInfo.curso} &nbsp;·&nbsp; Grupo {userInfo.grupo}
          </span>
          <button className="menu-change-btn" onClick={onChangeUser}>
            Cambiar datos
          </button>
        </div>
      </div>

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
