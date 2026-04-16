import { useState, useEffect, useRef } from 'react'
import CodeEditor from '../CodeEditor/CodeEditor'
import ResultDisplay from '../ResultDisplay/ResultDisplay'
import UserForm from '../UserForm/UserForm'
import ExerciseMenu from '../ExerciseMenu/ExerciseMenu'
import AdminPanel from '../AdminPanel/AdminPanel'
import { exercises } from '../../exercises/index'
import groupExercises from '../../groupExercises.json'
import './App.css'

/**
 * Componente principal de LevCode.
 *
 * Flujo de vistas:
 *   'form'     → El estudiante ingresa carnet y grupo
 *   'menu'     → Selecciona un ejercicio de la lista
 *   'exercise' → Editor + resultados para el ejercicio seleccionado
 */
function getSavedUser() {
  try {
    const raw = localStorage.getItem('levcode_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem('levcode_user')
    return null
  }
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin')
  const savedAccessPw = sessionStorage.getItem('levcode_access_pw')
  const initialUser = getSavedUser()
  const [view, setView] = useState(initialUser && savedAccessPw ? 'menu' : savedAccessPw ? 'form' : 'access')
  const [userInfo, setUserInfo] = useState(initialUser)
  const [accessPassword, setAccessPassword] = useState(savedAccessPw || '')
  const [accessPasswordInput, setAccessPasswordInput] = useState('')
  const [accessError, setAccessError] = useState('')
  const [accessLoading, setAccessLoading] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [code, setCode] = useState('')
  const [testResults, setTestResults] = useState(null)
  const [compilationError, setCompilationError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [solvedExercises, setSolvedExercises] = useState(new Set())
  const [inProgressExercises, setInProgressExercises] = useState(new Set())
  const [attempts, setAttempts] = useState(0)
  const [showTries, setShowTries] = useState(false)
  const [hideTests, setHideTests] = useState(false)
  const [tryTimer, setTryTimer] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [sessionLoading, setSessionLoading] = useState(!!initialUser && !!savedAccessPw)
  const [sessionError, setSessionError] = useState(false)
  const [toast, setToast] = useState(null)
  const cooldownRef = useRef(null)
  const toastRef = useRef(null)

  const showToast = (message) => {
    clearTimeout(toastRef.current)
    setToast(message)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  // Cargar estado de ejercicios desde el backend
  const fetchSessionStatus = (carnet, pw) => {
    setSessionLoading(true)
    setSessionError(false)
    fetch(`/api/sessions/status/${carnet}`, {
      headers: { 'X-Access-Password': pw },
    })
      .then(async (r) => {
        if (r.status === 401) {
          sessionStorage.removeItem('levcode_access_pw')
          setAccessPassword('')
          setSessionLoading(false)
          setView('access')
          return null
        }
        if (!r.ok) {
          const text = await r.text()
          throw new Error(`Status ${r.status}: ${text}`)
        }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setSolvedExercises(new Set(data.solved || []))
        setInProgressExercises(new Set(data.inProgress || []))
        setSessionLoading(false)
      })
      .catch((err) => {
        console.error('fetchSessionStatus error:', err)
        setSessionError(true)
        setSessionLoading(false)
      })
  }

  // Solo al montar: cargar estado si hay datos guardados
  useEffect(() => {
    if (initialUser && savedAccessPw) {
      fetchSessionStatus(initialUser.carnet, savedAccessPw)
    } else {
      setSessionLoading(false)
    }
  }, [])

  // Detectar ruta /admin por pathname
  useEffect(() => {
    const onPopState = () => setIsAdmin(window.location.pathname === '/admin')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Guardar borrador del código en localStorage (debounced 500ms)
  useEffect(() => {
    if (!selectedExercise || !userInfo?.carnet) return
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey(selectedExercise.config.id), code)
    }, 500)
    return () => clearTimeout(timer)
  }, [code, selectedExercise])

  // ── Cooldown global (try_timer) ─────────────────────────────────────────────
  const getCooldownKey = (carnet) => `levcode_cooldown_${carnet}`

  const startCooldown = () => {
    const key = getCooldownKey(userInfo.carnet)
    const expiresAt = Date.now() + 30000
    localStorage.setItem(key, String(expiresAt))
    tickCooldown(expiresAt)
  }

  const tickCooldown = (expiresAt) => {
    clearInterval(cooldownRef.current)
    const update = () => {
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000)
      if (remaining <= 0) {
        setCooldownRemaining(0)
        clearInterval(cooldownRef.current)
      } else {
        setCooldownRemaining(remaining)
      }
    }
    update()
    cooldownRef.current = setInterval(update, 1000)
  }

  const loadGlobalCooldown = () => {
    if (!userInfo) return
    const key = getCooldownKey(userInfo.carnet)
    const expiresAt = Number(localStorage.getItem(key))
    if (expiresAt && expiresAt > Date.now()) {
      tickCooldown(expiresAt)
    } else {
      setCooldownRemaining(0)
      clearInterval(cooldownRef.current)
    }
  }

  // Cargar cooldown global al montar y limpiar al desmontar
  useEffect(() => {
    loadGlobalCooldown()
    return () => clearInterval(cooldownRef.current)
  }, [userInfo?.carnet])

  /** Interpola de verde (#A3BE8C) a rojo (#BF616A) según intentos (0–5). */
  const getAttemptsColor = (n) => {
    const t = Math.min(n / 5, 1)
    const r = Math.round(163 + t * (191 - 163))
    const g = Math.round(190 + t * (97 - 190))
    const b = Math.round(140 + t * (106 - 140))
    return `rgb(${r}, ${g}, ${b})`
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
        body: JSON.stringify({ password: accessPasswordInput }),
      })
      if (!res.ok) {
        setAccessError('Error del servidor. Intenta de nuevo.')
        setAccessLoading(false)
        return
      }
      const data = await res.json()
      if (!data.valid) {
        setAccessError('Contraseña incorrecta')
        setAccessLoading(false)
        return
      }
      sessionStorage.setItem('levcode_access_pw', accessPasswordInput)
      setAccessPassword(accessPasswordInput)
      setAccessLoading(false)
      if (userInfo) {
        setView('menu')
        fetchSessionStatus(userInfo.carnet, accessPasswordInput)
      } else {
        setView('form')
      }
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
    fetchSessionStatus(info.carnet, accessPassword)
  }

  const handleChangeUser = () => {
    localStorage.removeItem('levcode_user')
    sessionStorage.removeItem('levcode_access_pw')
    setUserInfo(null)
    setAccessPassword('')
    setAccessPasswordInput('')
    setSolvedExercises(new Set())
    setInProgressExercises(new Set())
    setView('access')
  }

  // ── View: menu ────────────────────────────────────────────────────────────
  const draftKey = (problemId) => `levcode_draft_${userInfo?.carnet}_${problemId}`

  const handleExerciseSelect = (exercise) => {
    if (solvedExercises.has(exercise.config.id)) {
      showToast('¡Ejercicio Completado!')
      return
    }

    setSelectedExercise(exercise)
    const saved = localStorage.getItem(draftKey(exercise.config.id))
    setCode(saved ?? exercise.config.starterCode)
    setTestResults(null)
    setCompilationError(null)
    setAttempts(0)
    setShowTries(false)
    setHideTests(false)
    setTryTimer(false)
    loadGlobalCooldown()
    setView('exercise')

    const isNew = !solvedExercises.has(exercise.config.id) && !inProgressExercises.has(exercise.config.id)

    const applyTreatments = (data) => {
      setAttempts(data.attempts)
      setShowTries(!!data.showTries)
      setHideTests(!!data.hideTests)
      setTryTimer(!!data.tryTimer)
      if (data.tryTimer) loadGlobalCooldown()
    }

    if (isNew) {
      // Primera vez: crear registro en DB (attempts = 0)
      setInProgressExercises((prev) => new Set(prev).add(exercise.config.id))
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Access-Password': accessPassword },
        body: JSON.stringify({
          carnet: userInfo.carnet,
          grupo: userInfo.grupo,
          problemId: exercise.config.id,
          solved: false,
        }),
      })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => { if (data.success) applyTreatments(data) })
        .catch(() => { setView('menu') })
    } else {
      // Ya existe: solo leer datos sin incrementar
      fetch(`/api/sessions/${userInfo.carnet}/${exercise.config.id}`, {
        headers: { 'X-Access-Password': accessPassword },
      })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => {
          if (data.success) {
            applyTreatments(data)
            if (data.solved && data.solutionCode) {
              setCode(data.solutionCode)
            }
          }
        })
        .catch(() => { setView('menu') })
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
        if (tryTimer) startCooldown()
        setLoading(false)
        return
      }

      // Buscar el primer caso con error de ejecución/compilación/timeout
      const firstError = data.results.find((r) => r.exitCode !== 0)
      if (firstError) {
        setCompilationError(firstError.error)
        recordSession(false)
        if (tryTimer) startCooldown()
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
          showInfo: hideTests ? !!tc.showInfoHidden : tc.showInfo !== false,
        }
      })

      setTestResults(results)

      const allPassed = results.length > 0 && results.every((r) => r.passed)
      recordSession(allPassed, allPassed ? code : undefined)

      if (allPassed) {
        localStorage.removeItem(draftKey(selectedExercise.config.id))
        setSolvedExercises((prev) => new Set(prev).add(selectedExercise.config.id))
        setInProgressExercises((prev) => {
          const next = new Set(prev)
          next.delete(selectedExercise.config.id)
          return next
        })
      } else if (tryTimer) {
        startCooldown()
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
  const recordSession = (solved, solutionCode) => {
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Password': accessPassword },
      body: JSON.stringify({
        carnet: userInfo.carnet,
        grupo: userInfo.grupo,
        problemId: selectedExercise.config.id,
        solved,
        ...(solutionCode !== undefined && { solutionCode }),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAttempts(data.attempts)
      })
      .catch(() => {
        // Silencioso: no interrumpir la experiencia del estudiante
      })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Lev Code</h1>
          <p>Un proyecto para el curso de Investigación en ciencias de la computación</p>
        </header>
        <AdminPanel />
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Lev Code</h1>
        <p>Un proyecto para el curso de Investigación en ciencias de la computación</p>
      </header>

      {toast && <div className="app-toast">{toast}</div>}

      {view === 'form' && (
        <UserForm onSubmit={handleUserFormSubmit} initialData={userInfo} />
      )}

      {view === 'access' && (
        <div className="access-gate">
          <h2>Contraseña de acceso</h2>
          <form onSubmit={handleAccessSubmit}>
            <input
              type="password"
              placeholder="Contraseña"
              value={accessPasswordInput}
              onChange={(e) => setAccessPasswordInput(e.target.value)}
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
            exercises={userInfo ? exercises.filter((ex) => {
              const allowed = groupExercises[userInfo.grupo]
              return !allowed || allowed.includes(ex.config.id)
            }) : exercises}
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
              <button className="back-btn" onClick={() => { setView('menu'); fetchSessionStatus(userInfo.carnet, accessPassword) }}>
                ← Ejercicios
              </button>
              <h2 className="exercise-title">{selectedExercise.config.title}</h2>
              {showTries && (
                <span
                  className="exercise-timer"
                  style={{ color: getAttemptsColor(attempts), borderColor: getAttemptsColor(attempts) }}
                >
                  Intentos: {attempts}
                </span>
              )}
            </div>

            <div className="exercise-description">
              {selectedExercise.config.description.split('\n').map((line, i) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))}
            </div>

            <div className="user-badge">
              {userInfo.carnet} &nbsp;·&nbsp; Grupo {userInfo.grupo}
            </div>

            {/* key={id} hace que CodeMirror se reinicie al cambiar de ejercicio */}
            <CodeEditor
              key={selectedExercise.config.id}
              code={code}
              onChange={setCode}
              starterCode={selectedExercise.config.starterCode}
              readOnly={solvedExercises.has(selectedExercise.config.id)}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || solvedExercises.has(selectedExercise.config.id) || cooldownRemaining > 0}
              className={`submit-btn${solvedExercises.has(selectedExercise.config.id) ? ' submit-btn-solved' : ''}${cooldownRemaining > 0 ? ' submit-btn-cooldown' : ''}`}
            >
              {solvedExercises.has(selectedExercise.config.id)
                ? 'Ejercicio completado'
                : cooldownRemaining > 0
                  ? `Espera ${cooldownRemaining}s`
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
