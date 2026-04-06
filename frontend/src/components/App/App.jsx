import { useState, useEffect, useRef } from 'react'
import CodeEditor from '../CodeEditor/CodeEditor'
import ResultDisplay from '../ResultDisplay/ResultDisplay'
import UserForm from '../UserForm/UserForm'
import ExerciseMenu from '../ExerciseMenu/ExerciseMenu'
import AdminPanel from '../AdminPanel/AdminPanel'
import { exercises } from '../../exercises/index'
import './App.css'

/**
 * Componente principal de LevCode.
 *
 * Flujo de vistas:
 *   'form'     → El estudiante ingresa carnet, grupo y curso
 *   'menu'     → Selecciona un ejercicio de la lista
 *   'exercise' → Editor + resultados para el ejercicio seleccionado
 */
export default function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#/admin')
  const savedUser = localStorage.getItem('levcode_user')
  const savedAccessPw = sessionStorage.getItem('levcode_access_pw')
  const [view, setView] = useState(savedUser && savedAccessPw ? 'menu' : savedAccessPw ? 'form' : 'access')
  const [userInfo, setUserInfo] = useState(savedUser ? JSON.parse(savedUser) : null)
  const [accessPassword, setAccessPassword] = useState(savedAccessPw || '')
  const [accessError, setAccessError] = useState('')
  const [accessLoading, setAccessLoading] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [code, setCode] = useState('')
  const [testResults, setTestResults] = useState(null)
  const [compilationError, setCompilationError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [solvedExercises, setSolvedExercises] = useState(new Set())
  const [inProgressExercises, setInProgressExercises] = useState(new Set())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [sessionLoading, setSessionLoading] = useState(!!savedUser && !!savedAccessPw)
  const [sessionError, setSessionError] = useState(false)
  const timerRef = useRef(null)

  // Cargar estado de ejercicios si hay usuario guardado y contraseña de acceso
  const fetchSessionStatus = (carnet, pw) => {
    setSessionLoading(true)
    setSessionError(false)
    fetch(`/api/sessions/status/${carnet}`, {
      headers: { 'X-Access-Password': pw },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.solved) setSolvedExercises(new Set(data.solved))
        if (data.inProgress) setInProgressExercises(new Set(data.inProgress))
        setSessionLoading(false)
      })
      .catch(() => {
        setSessionError(true)
        setSessionLoading(false)
      })
  }

  useEffect(() => {
    if (!userInfo || !accessPassword) {
      setSessionLoading(false)
      return
    }
    fetchSessionStatus(userInfo.carnet, accessPassword)
  }, [userInfo?.carnet, accessPassword])

  // Detectar ruta /admin por hash
  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash === '#/admin')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Start/reset timer when entering an exercise
  useEffect(() => {
    if (view !== 'exercise') return
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [view, selectedExercise])

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // ── View: access (primer paso) ─────────────────────────────────────────────
  const handleAccessSubmit = async (e) => {
    e.preventDefault()
    setAccessError('')
    setAccessLoading(true)
    try {
      const res = await fetch('/api/access/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: accessPassword }),
      })
      const data = await res.json()
      if (!data.valid) {
        setAccessError('Contraseña incorrecta')
        setAccessLoading(false)
        return
      }
      sessionStorage.setItem('levcode_access_pw', accessPassword)
      setAccessLoading(false)
      // Si ya hay usuario guardado, ir directo al menú; sino pedir datos
      setView(userInfo ? 'menu' : 'form')
    } catch {
      setAccessError('Error de conexión con el servidor')
      setAccessLoading(false)
    }
  }

  // ── View: form (segundo paso) ─────────────────────────────────────────────
  const handleUserFormSubmit = (info) => {
    localStorage.setItem('levcode_user', JSON.stringify(info))
    setUserInfo(info)
    setView('menu')
  }

  const handleChangeUser = () => {
    localStorage.removeItem('levcode_user')
    sessionStorage.removeItem('levcode_access_pw')
    setAccessPassword('')
    setSolvedExercises(new Set())
    setInProgressExercises(new Set())
    setView('access')
  }

  // ── View: menu ────────────────────────────────────────────────────────────
  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise)
    setCode(exercise.config.starterCode)
    setTestResults(null)
    setCompilationError(null)
    setView('exercise')

    // Registrar intento 0 (apertura) si no está resuelto ni en progreso
    if (!solvedExercises.has(exercise.config.id) && !inProgressExercises.has(exercise.config.id)) {
      setInProgressExercises((prev) => new Set(prev).add(exercise.config.id))
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Access-Password': accessPassword },
        body: JSON.stringify({
          carnet: userInfo.carnet,
          grupo: userInfo.grupo,
          curso: userInfo.curso,
          problemId: exercise.config.id,
          solved: false,
        }),
      }).catch(() => {})
    }
  }

  // ── View: exercise ────────────────────────────────────────────────────────

  /**
   * Ejecuta el código contra todos los casos de prueba en un solo contenedor.
   * Envía todos los inputs al backend en una sola llamada batch.
   */
  const handleSubmit = async () => {
    setLoading(true)
    setTestResults(null)
    setCompilationError(null)

    const { config, testcases } = selectedExercise

    try {
      const response = await fetch('/api/submissions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Access-Password': accessPassword },
        body: JSON.stringify({
          code,
          userId: userInfo.carnet,
          problemId: config.id,
          inputs: testcases.map((tc) => tc.input),
        }),
      })

      const data = await response.json()

      // Error global (código bloqueado, error de Docker, etc.)
      if (!data.success) {
        setCompilationError(data.error)
        recordSession(false)
        setLoading(false)
        return
      }

      // Buscar el primer caso con error de ejecución/compilación/timeout
      const firstError = data.results.find((r) => r.exitCode !== 0)
      if (firstError) {
        setCompilationError(firstError.error)
        recordSession(false)
        setLoading(false)
        return
      }

      const results = data.results.map((r, i) => {
        const tc = testcases[i]
        return {
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: r.output ?? '',
          passed: r.output?.trim() === tc.expectedOutput.trim(),
          executionTime: Math.round(data.executionTime / testcases.length),
          showInfo: tc.showInfo !== false,
        }
      })

      setTestResults(results)

      const allPassed = results.length > 0 && results.every((r) => r.passed)
      recordSession(allPassed)

      if (allPassed) {
        setSolvedExercises((prev) => new Set(prev).add(selectedExercise.config.id))
        setInProgressExercises((prev) => {
          const next = new Set(prev)
          next.delete(selectedExercise.config.id)
          return next
        })
      }

      setLoading(false)
    } catch (err) {
      setCompilationError(`Error de conexión: ${err.message}`)
      setLoading(false)
    }
  }

  /**
   * Envía los datos del intento al backend para persistirlos en la DB.
   * No bloquea la UI ni muestra error al usuario si falla.
   */
  const recordSession = (solved) => {
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Password': accessPassword },
      body: JSON.stringify({
        carnet: userInfo.carnet,
        grupo: userInfo.grupo,
        curso: userInfo.curso,
        problemId: selectedExercise.config.id,
        solved,
      }),
    }).catch(() => {
      // Silencioso: no interrumpir la experiencia del estudiante
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Lev Code</h1>
          <p>Escuela de Ciencias de la Computación e Informática</p>
        </header>
        <AdminPanel />
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Lev Code</h1>
        <p>Escuela de Ciencias de la Computación e Informática</p>
      </header>

      {view === 'form' && (
        <UserForm onSubmit={handleUserFormSubmit} initialData={userInfo} />
      )}

      {view === 'access' && (
        <div className="access-gate">
          <h2>Contraseña de acceso</h2>
          <p>Ingresa la contraseña proporcionada por tu profesor.</p>
          <form onSubmit={handleAccessSubmit}>
            <input
              type="password"
              placeholder="Contraseña"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              className="admin-input"
              autoFocus
            />
            {accessError && <p className="admin-error">{accessError}</p>}
            <button type="submit" className="admin-btn" disabled={accessLoading}>
              {accessLoading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      )}

      {view === 'menu' && sessionLoading && (
        <div className="app-body">
          <div className="session-loading">
            <p>Conectando con el servidor...</p>
          </div>
        </div>
      )}

      {view === 'menu' && !sessionLoading && sessionError && (
        <div className="app-body">
          <div className="session-error">
            <p>No se pudo conectar con el servidor.</p>
            <button className="submit-btn" onClick={() => fetchSessionStatus(userInfo.carnet, accessPassword)}>
              Reintentar
            </button>
          </div>
        </div>
      )}

      {view === 'menu' && !sessionLoading && !sessionError && (
        <div className="app-body">
          <ExerciseMenu
            exercises={exercises}
            onSelect={handleExerciseSelect}
            userInfo={userInfo}
            solvedExercises={solvedExercises}
            inProgressExercises={inProgressExercises}
            onChangeUser={handleChangeUser}
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
              <span className="exercise-timer">{formatTime(elapsedSeconds)}</span>
            </div>

            <div className="exercise-description">
              {selectedExercise.config.description.split('\n').map((line, i) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))}
            </div>

            <div className="user-badge">
              {userInfo.carnet} &nbsp;·&nbsp; {userInfo.curso} &nbsp;·&nbsp; Grupo {userInfo.grupo}
            </div>

            {/* key={id} hace que CodeMirror se reinicie al cambiar de ejercicio */}
            <CodeEditor
              key={selectedExercise.config.id}
              code={code}
              onChange={setCode}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || solvedExercises.has(selectedExercise.config.id)}
              className={`submit-btn${solvedExercises.has(selectedExercise.config.id) ? ' submit-btn-solved' : ''}`}
            >
              {solvedExercises.has(selectedExercise.config.id)
                ? 'Ejercicio completado'
                : loading ? 'Ejecutando...' : 'Ejecutar Código'}
            </button>
          </div>

          {/* Panel derecho: resultados */}
          <ResultDisplay
            testResults={testResults}
            compilationError={compilationError}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}
