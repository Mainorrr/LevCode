import { useState } from 'react'
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import './ResultDisplay.css'

/**
 * Muestra los resultados de la evaluación contra los casos de prueba.
 *
 * Props:
 *   - testResults: array|null  - [{ caseNumber, input, expectedOutput, actualOutput, passed, executionTime, showInfo }]
 *   - compilationError: string|null - mensaje de error de compilación/ejecución
 *   - loading: boolean
 */
export default function ResultDisplay({ testResults, compilationError, loading }) {
  const [openCases, setOpenCases] = useState({})

  if (loading) {
    return (
      <div className="result-section">
        <div className="result-placeholder">
          <p>Ejecutando...</p>
        </div>
      </div>
    )
  }

  if (!testResults && !compilationError) {
    return (
      <div className="result-section">
        <div className="result-placeholder">
          <p>Los resultados aparecerán aquí</p>
        </div>
      </div>
    )
  }

  // ── Error de compilación ──────────────────────────────────────────────────
  if (compilationError) {
    return (
      <div className="result-section">
        <div className="result-header failure">
          <h2>Error de compilación</h2>
        </div>
        <div className="result-box">
          <pre className="error-text">{compilationError}</pre>
        </div>
      </div>
    )
  }

  // ── Veredicto ─────────────────────────────────────────────────────────────
  const passed = testResults.filter((r) => r.passed).length
  const total = testResults.length
  const allPassed = passed === total

  const failedCases = testResults.filter((r) => !r.passed)

  const toggleCase = (caseNumber) => {
    setOpenCases((prev) => ({ ...prev, [caseNumber]: !prev[caseNumber] }))
  }

  return (
    <div className="result-section">
      <div className={`result-header ${allPassed ? 'success' : 'failure'}`}>
        <h2>{allPassed ? 'Correcto' : 'Incorrecto'}</h2>
        <span className="verdict-score">
          {passed} / {total} casos correctos
        </span>
      </div>

      {/* Casos fallidos */}
      {!allPassed && failedCases.length > 0 && (
        <div className="result-box">
          <h3 className="cases-title">Casos fallidos</h3>
          <div className="cases-legend">
            <span className="legend-item">
              <Eye size={14} className="case-eye visible" /> Información disponible
            </span>
            <span className="legend-item">
              <EyeOff size={14} className="case-eye hidden" /> Caso oculto
            </span>
            <span className="legend-item">
              <ChevronDown size={14} /> Click para desplegar
            </span>
          </div>
          <div className="cases-list">
            {failedCases.map((tc) => {
              const isOpen = !!openCases[tc.caseNumber]
              const canExpand = tc.showInfo
              return (
                <div key={tc.caseNumber} className="case-item">
                  <button
                    type="button"
                    className="case-header"
                    onClick={() => canExpand && toggleCase(tc.caseNumber)}
                    disabled={!canExpand}
                    aria-expanded={canExpand ? isOpen : undefined}
                  >
                    <span className="case-header-left">
                      {tc.showInfo ? (
                        <Eye size={16} className="case-eye visible" aria-label="Caso visible" />
                      ) : (
                        <EyeOff size={16} className="case-eye hidden" aria-label="Caso oculto" />
                      )}
                      <span className="case-name">Caso {tc.caseNumber}</span>
                    </span>
                    {canExpand && (
                      <span className="case-header-right">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    )}
                  </button>

                  {canExpand && isOpen && (
                    <div className="case-body">
                      {tc.input !== '' && (
                        <div className="case-row">
                          <span className="case-label">Entrada</span>
                          <pre className="case-value">{tc.input}</pre>
                        </div>
                      )}
                      <div className="case-row">
                        <span className="case-label">Esperado</span>
                        <pre className="case-value expected">{tc.expectedOutput}</pre>
                      </div>
                      <div className="case-row">
                        <span className="case-label">Tu salida</span>
                        <pre className="case-value actual">{tc.actualOutput || '(vacío)'}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
