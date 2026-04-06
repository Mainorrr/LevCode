import './ResultDisplay.css'

/**
 * Muestra los resultados de la evaluación contra los casos de prueba.
 *
 * Props:
 *   - testResults: array|null  - [{ input, expectedOutput, actualOutput, passed, executionTime, showInfo }]
 *   - compilationError: string|null - mensaje de error de compilación/ejecución
 *   - loading: boolean
 */
export default function ResultDisplay({ testResults, compilationError, loading }) {
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
          <div className="cases-list">
            {failedCases.map((tc, i) => (
              <div key={i} className="case-item">
                {tc.showInfo ? (
                  <>
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
                  </>
                ) : (
                  <p className="no-cases-msg">
                    Caso {i + 1}: incorrecto. Revisa tu solución.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
