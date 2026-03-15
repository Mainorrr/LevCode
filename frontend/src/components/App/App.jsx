import { useState } from 'react'
import CodeEditor from '../CodeEditor/CodeEditor'
import ResultDisplay from '../ResultDisplay/ResultDisplay'
import UserForm from '../UserForm/UserForm'
import ExerciseMenu from '../ExerciseMenu/ExerciseMenu'
import { exercises } from '../../exercises/index'
import './App.css'

/**
 * Componente principal de LevCode.
 *
 * Flujo de vistas:
 *   'form'     → El estudiante ingresa carnet, grupo y semestre
 *   'menu'     → Selecciona un ejercicio de la lista
 *   'exercise' → Editor + resultados para el ejercicio seleccionado
 */
export default function App() {
  const [view, setView] = useState('form')
  const [userInfo, setUserInfo] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [code, setCode] = useState('')
  const [testResults, setTestResults] = useState(null)
  const [compilationError, setCompilationError] = useState(null)
  const [loading, setLoading] = useState(false)

  // ── View: form ────────────────────────────────────────────────────────────
  const handleUserFormSubmit = (info) => {
    setUserInfo(info)
    setView('menu')
  }

  // ── View: menu ────────────────────────────────────────────────────────────
  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise)
    setCode(exercise.config.starterCode)
    setTestResults(null)
    setCompilationError(null)
    setView('exercise')
  }

  // ── View: exercise ────────────────────────────────────────────────────────

  /**
   * Ejecuta el código contra todos los casos de prueba del ejercicio.
   * El frontend itera los casos y llama al backend una vez por caso,
   * luego compara el output con el esperado localmente.
   * Si hay un error de compilación en el primer intento, se detiene.
   */
  const handleSubmit = async () => {
    setLoading(true)
    setTestResults(null)
    setCompilationError(null)

    const { config, testcases } = selectedExercise
    const results = []

    for (const tc of testcases) {
      try {
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            userId: userInfo.carnet,
            problemId: config.id,
            input: tc.input,
          }),
        })

        const data = await response.json()

        // Error de compilación o de ejecución interna: detener inmediatamente
        if (!data.success) {
          setCompilationError(data.error)
          recordSession(false)
          setLoading(false)
          return
        }

        const passed = data.output?.trim() === tc.expectedOutput.trim()
        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: data.output ?? '',
          passed,
          executionTime: data.executionTime,
        })
      } catch (err) {
        setCompilationError(`Error de conexión: ${err.message}`)
        setLoading(false)
        return
      }
    }

    setTestResults(results)

    // Registrar el intento en la base de datos.
    // solved = true solo si TODOS los casos pasaron.
    const allPassed = results.length > 0 && results.every((r) => r.passed)
    recordSession(allPassed)

    setLoading(false)
  }

  /**
   * Envía los datos del intento al backend para persistirlos en la DB.
   * No bloquea la UI ni muestra error al usuario si falla.
   */
  const recordSession = (solved) => {
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carnet: userInfo.carnet,
        grupo: userInfo.grupo,
        semestre: userInfo.semestre,
        problemId: selectedExercise.config.id,
        solved,
      }),
    }).catch(() => {
      // Silencioso: no interrumpir la experiencia del estudiante
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>LevCode</h1>
        <p>Escuela de Ciencias de la Computación e Informática</p>
      </header>

      {view === 'form' && (
        <UserForm onSubmit={handleUserFormSubmit} />
      )}

      {view === 'menu' && (
        <div className="app-body">
          <ExerciseMenu
            exercises={exercises}
            onSelect={handleExerciseSelect}
            userInfo={userInfo}
          />
        </div>
      )}

      {view === 'exercise' && selectedExercise && (
        <div className="app-content">
          {/* Panel izquierdo: descripción + editor */}
          <div className="editor-section">
            <div className="exercise-header">
              <button className="back-btn" onClick={() => setView('menu')}>
                ← Ejercicios
              </button>
              <h2 className="exercise-title">{selectedExercise.config.title}</h2>
            </div>

            <div className="exercise-description">
              {selectedExercise.config.description.split('\n').map((line, i) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))}
            </div>

            <div className="user-badge">
              {userInfo.carnet} &nbsp;·&nbsp; Grupo {userInfo.grupo} &nbsp;·&nbsp; Semestre {userInfo.semestre}
            </div>

            {/* key={id} hace que CodeMirror se reinicie al cambiar de ejercicio */}
            <CodeEditor
              key={selectedExercise.config.id}
              code={code}
              onChange={setCode}
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Ejecutando...' : 'Ejecutar Código'}
            </button>
          </div>

          {/* Panel derecho: resultados */}
          <ResultDisplay
            testResults={testResults}
            compilationError={compilationError}
            showTestCases={selectedExercise.config.showTestCases}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}
