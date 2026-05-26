import { useState, useEffect, useRef } from 'react'
import { Play, HelpCircle, Trash2 } from 'lucide-react'
import CodeEditor from '../CodeEditor/CodeEditor'
import HelpModal from '../HelpModal/HelpModal'
import ResultDisplay from '../ResultDisplay/ResultDisplay'
import UserForm from '../UserForm/UserForm'
import ExerciseMenu from '../ExerciseMenu/ExerciseMenu'
import AdminPanel from '../AdminPanel/AdminPanel'
import SUSForm from '../SUSForm/SUSForm'
import { exercises } from '../../exercises/index'
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
    const raw = sessionStorage.getItem('levcode_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    sessionStorage.removeItem('levcode_user')
    return null
  }
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function buildCodeWithStarters(topStarter, bottomStarter, editable = '\n') {
  let result = ''
  if (topStarter) result += topStarter
  if (topStarter && !topStarter.endsWith('\n')) result += '\n'
  result += editable
  if (bottomStarter && !editable.endsWith('\n')) result += '\n'
  if (bottomStarter) result += bottomStarter
  if (bottomStarter && !bottomStarter.endsWith('\n')) result += '\n'
  return result
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin')
  const [isDark, setIsDark] = useState(() => localStorage.getItem('levcode_theme') !== 'light')
  const savedAccessPw = sessionStorage.getItem('levcode_access_pw')
  const initialUser = getSavedUser()
  const [view, setView] = useState(initialUser && savedAccessPw ? 'menu' : 'form')
  const [userInfo, setUserInfo] = useState(initialUser)
  const [accessPassword, setAccessPassword] = useState(savedAccessPw || '')
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
  const [susStatus, setSusStatus] = useState({ exists: false, submitted: false })
  const [assignedExerciseIds, setAssignedExerciseIds] = useState(null)
  const cooldownRef = useRef(null)
  const toastRef = useRef(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [susConfirmOpen, setSusConfirmOpen] = useState(false)
  const [flushConfirmOpen, setFlushConfirmOpen] = useState(false)
  const [flushing, setFlushing] = useState(false)

  const isTestUser = userInfo?.carnet === 'X00000' && userInfo?.grupo === 'Test'

  const handleFlushTestUser = async () => {
    setFlushing(true)
    try {
      await fetch('/api/sessions/test-user-data', {
        method: 'DELETE',
        headers: { 'X-Access-Password': accessPassword },
      })
      // Limpiar drafts y cooldown locales del usuario de prueba
      const prefix = 'levcode_draft_X00000_'
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(prefix) || k === 'levcode_cooldown_X00000') {
          localStorage.removeItem(k)
        }
      })
      window.location.reload()
    } catch {
      setFlushing(false)
      setFlushConfirmOpen(false)
    }
  }

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
          sessionStorage.removeItem('levcode_user')
          setAccessPassword('')
          setUserInfo(null)
          setSessionLoading(false)
          setView('form')
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

  // Cargar (o crear) la asignación de ejercicios del estudiante
  const fetchAssignment = (carnet, grupo, pw) => {
    const url = `/api/exercises/assignment/${encodeURIComponent(carnet)}?grupo=${encodeURIComponent(grupo || '')}`
    fetch(url, { headers: { 'X-Access-Password': pw } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.success) setAssignedExerciseIds(data.exercises || [])
      })
      .catch(() => { /* silencioso */ })
  }

  // Cargar estado del cuestionario SUS desde el backend
  const fetchSusStatus = (carnet, pw) => {
    fetch(`/api/sus/status/${carnet}`, {
      headers: { 'X-Access-Password': pw },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSusStatus({ exists: !!data.exists, submitted: !!data.submitted })
      })
      .catch(() => {
        // silencioso
      })
  }

  // Solo al montar: cargar estado si hay datos guardados
  useEffect(() => {
    if (initialUser && savedAccessPw) {
      fetchSessionStatus(initialUser.carnet, savedAccessPw)
      fetchSusStatus(initialUser.carnet, savedAccessPw)
      fetchAssignment(initialUser.carnet, initialUser.grupo, savedAccessPw)
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

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    localStorage.setItem('levcode_theme', isDark ? 'dark' : 'light')
  }, [isDark])

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

  const startCooldown = (attemptCount) => {
    const duration = Math.min(attemptCount * 5, 60) * 1000
    const key = getCooldownKey(userInfo.carnet)
    const expiresAt = Date.now() + duration
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

  const getAttemptsColor = (n) => {
    const style = getComputedStyle(document.documentElement)
    const hexToRgb = (hex) => {
      const h = hex.trim().replace('#', '')
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }
    const [sr, sg, sb] = hexToRgb(style.getPropertyValue('--success'))
    const [dr, dg, db] = hexToRgb(style.getPropertyValue('--danger'))
    const t = Math.min(n / 5, 1)
    return `rgb(${Math.round(sr + t * (dr - sr))}, ${Math.round(sg + t * (dg - sg))}, ${Math.round(sb + t * (db - sb))})`
  }

  // ── View: form (único paso de ingreso) ────────────────────────────────────
  const handleUserFormSubmit = (info) => {
    const { accessPassword: pw, ...userData } = info
    sessionStorage.setItem('levcode_user', JSON.stringify(userData))
    sessionStorage.setItem('levcode_access_pw', pw)
    setUserInfo(userData)
    setAccessPassword(pw)
    setView('menu')
    fetchSessionStatus(userData.carnet, pw)
    fetchSusStatus(userData.carnet, pw)
    fetchAssignment(userData.carnet, userData.grupo, pw)
  }

  const handleChangeUser = () => {
    sessionStorage.removeItem('levcode_user')
    sessionStorage.removeItem('levcode_access_pw')
    setUserInfo(null)
    setAccessPassword('')
    setSolvedExercises(new Set())
    setInProgressExercises(new Set())
    setSusStatus({ exists: false, submitted: false })
    setAssignedExerciseIds(null)
    setView('form')
  }

  // ── View: menu ────────────────────────────────────────────────────────────
  const draftKey = (problemId) => `levcode_draft_${userInfo?.carnet}_${problemId}`

  const handleExerciseSelect = (exercise) => {
    if (solvedExercises.has(exercise.config.id)) {
      showToast('¡Ejercicio Completado!')
      return
    }

    setSelectedExercise(exercise)
    const starter = exercise.config.starterCode || ''
    const starterPosition = exercise.config.starterPosition || 'top'
    const topStarter = typeof exercise.config.starterCodeTop === 'string'
      ? exercise.config.starterCodeTop
      : (starterPosition === 'top' ? starter : '')
    const bottomStarter = typeof exercise.config.starterCodeBottom === 'string'
      ? exercise.config.starterCodeBottom
      : (starterPosition === 'bottom' ? starter : '')
    const saved = localStorage.getItem(draftKey(exercise.config.id))
    let initialCode = ''
    if (saved) {
      const startsOk = topStarter ? saved.startsWith(topStarter) : true
      const endsOk = bottomStarter ? saved.endsWith(bottomStarter) : true
      initialCode = startsOk && endsOk ? saved : buildCodeWithStarters(topStarter, bottomStarter)
    } else {
      initialCode = buildCodeWithStarters(topStarter, bottomStarter)
    }
    setCode(initialCode)
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
        if (tryTimer) startCooldown(attempts + 1)
        setLoading(false)
        return
      }

      // Buscar el primer caso con error de ejecución/compilación/timeout
      const firstError = data.results.find((r) => r.exitCode !== 0)
      if (firstError) {
        setCompilationError(firstError.error)
        recordSession(false)
        if (tryTimer) startCooldown(attempts + 1)
        setLoading(false)
        return
      }

      const results = data.results.map((r, i) => {
        const tc = testcases[i]
        return {
          caseNumber: i + 1,
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
      recordSession(allPassed)

      if (allPassed) {
        localStorage.removeItem(draftKey(selectedExercise.config.id))
        setSolvedExercises((prev) => new Set(prev).add(selectedExercise.config.id))
        setInProgressExercises((prev) => {
          const next = new Set(prev)
          next.delete(selectedExercise.config.id)
          return next
        })
      } else if (tryTimer) {
        startCooldown(attempts + 1)
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
        problemId: selectedExercise.config.id,
        solved,
        code,
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
  const themeToggle = (
    <button className="theme-toggle" onClick={() => setIsDark(d => !d)} title={isDark ? 'Modo claro' : 'Modo oscuro'}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )

  const helpButton = !isAdmin && view !== 'form' && (
    <button className="help-toggle" onClick={() => setHelpOpen(true)} title="Ayuda de Python">
      <HelpCircle size={18} />
    </button>
  )

  const flushTestButton = isTestUser && (
    <button
      className="flush-toggle"
      onClick={() => setFlushConfirmOpen(true)}
      title="Borrar datos del usuario de pruebas (X00000)"
    >
      <Trash2 size={16} />
      <span>Borrar datos</span>
    </button>
  )

  const susButton = userInfo && accessPassword && view === 'menu' && (
    <button
      className="sus-toggle"
      onClick={() => !susStatus.submitted && setSusConfirmOpen(true)}
      disabled={susStatus.submitted}
      title={susStatus.submitted ? 'Ya respondido' : 'Cuestionario al finalizar'}
    >
      {susStatus.submitted ? 'Cuestionario ✓' : 'Cuestionario al finalizar'}
    </button>
  )

  if (isAdmin) {
    return (
      <div className="app-container">
        <div className="top-bar">{themeToggle}</div>
        <AdminPanel />
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="top-bar">
        {flushTestButton}
        {susButton}
        {helpButton}
        {themeToggle}
      </div>
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {flushConfirmOpen && (
        <div className="confirm-overlay" onClick={() => !flushing && setFlushConfirmOpen(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-modal-title">¿Borrar datos del usuario de pruebas?</p>
            <p className="confirm-modal-body">Se eliminarán <strong>todas las sesiones y respuestas SUS de X00000</strong>. Esta acción solo afecta al usuario de pruebas. La página se recargará al terminar.</p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={() => setFlushConfirmOpen(false)} disabled={flushing}>Cancelar</button>
              <button className="confirm-modal-confirm flush-confirm" onClick={handleFlushTestUser} disabled={flushing}>
                {flushing ? 'Borrando...' : 'Borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {susConfirmOpen && (
        <div className="confirm-overlay" onClick={() => setSusConfirmOpen(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-modal-title">¿Comenzar el cuestionario?</p>
            <p className="confirm-modal-body">Este cuestionario debes responderlo <strong>solo cuando se acabe tu tiempo o al haber completado todos los ejercicios</strong>. Debe ser <strong>lo último que realices antes de salir del laboratorio</strong>.</p>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={() => setSusConfirmOpen(false)}>Cancelar</button>
              <button className="confirm-modal-confirm" onClick={() => { setSusConfirmOpen(false); setView('sus') }}>Comenzar</button>
            </div>
          </div>
        </div>
      )}
      <header className="app-header">
        <h1>Lev Code</h1>
        <p>Un proyecto para el curso de Investigación en ciencias de la computación</p>
      </header>

      {toast && <div className="app-toast">{toast}</div>}

      {view === 'form' && (
        <UserForm onSubmit={handleUserFormSubmit} />
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

      {view === 'sus' && userInfo && (
        <div className="app-body">
          <SUSForm
            carnet={userInfo.carnet}
            grupo={userInfo.grupo}
            accessPassword={accessPassword}
            showToast={showToast}
            onComplete={() => {
              fetchSusStatus(userInfo.carnet, accessPassword)
              setView('menu')
            }}
          />
        </div>
      )}

      {view === 'menu' && !sessionLoading && !sessionError && (
        <div className="app-body">
          <ExerciseMenu
            exercises={userInfo && assignedExerciseIds
              ? exercises.filter((ex) => assignedExerciseIds.includes(ex.config.id))
              : exercises}
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
                  style={{ background: getAttemptsColor(attempts) }}
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
              starterCodeTop={selectedExercise.config.starterCodeTop}
              starterCodeBottom={selectedExercise.config.starterCodeBottom}
              starterPosition={selectedExercise.config.starterPosition}
              readOnly={solvedExercises.has(selectedExercise.config.id)}
              isDark={isDark}
              actionSlot={
                <button
                  onClick={handleSubmit}
                  disabled={loading || solvedExercises.has(selectedExercise.config.id) || cooldownRemaining > 0}
                  className={`submit-btn${solvedExercises.has(selectedExercise.config.id) ? ' submit-btn-solved' : ''}${cooldownRemaining > 0 ? ' submit-btn-cooldown' : ''}`}
                >
                  {solvedExercises.has(selectedExercise.config.id) ? (
                    'Ejercicio completado'
                  ) : cooldownRemaining > 0 ? (
                    `Espera ${cooldownRemaining}s`
                  ) : loading ? (
                    'Ejecutando...'
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" strokeWidth={0} />
                      Ejecutar
                    </>
                  )}
                </button>
              }
            />
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
