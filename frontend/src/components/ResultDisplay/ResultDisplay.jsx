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
// Los casos grandes tienen entradas de miles de líneas o decenas de miles de
// caracteres en una sola línea. Mostrarlas completas llena la pantalla y
// congela el navegador; se muestra el inicio y cuánto hay en total. Aplica
// también a "Tu salida": el backend permite hasta 10 MB.
const MAX_LINEAS = 20
const MAX_CARACTERES = 1500

function recortar(texto) {
  const lineas = texto.split('\n')
  let visible = lineas.slice(0, MAX_LINEAS).join('\n')
  if (visible.length > MAX_CARACTERES) visible = visible.slice(0, MAX_CARACTERES)
  if (visible.length === texto.length) return { visible: texto, nota: null }
  const nota = lineas.length > 1
    ? `Se muestra solo el inicio: ${lineas.length.toLocaleString('es')} líneas en total.`
    : `Se muestra solo el inicio: ${texto.length.toLocaleString('es')} caracteres en total.`
  return { visible: visible + '\n…', nota }
}

function Valor({ texto, className }) {
  const { visible, nota } = recortar(texto)
  // Un solo contenedor: la fila es una grilla de dos columnas (etiqueta, valor).
  return (
    <div className="case-value-wrap">
      <pre className={className}>{visible}</pre>
      {nota && <span className="case-note">{nota}</span>}
    </div>
  )
}

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

      {/* Todos los casos: pasados (verde) y fallidos (rojo) */}
      {!allPassed && testResults.length > 0 && (
        <div className="result-box">
          <div className="cases-title-row">
            <h3 className="cases-title">Casos de prueba</h3>
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
          </div>
          <div className="cases-list">
            {testResults.map((tc) => {
              const isOpen = !!openCases[tc.caseNumber]
              const canExpand = tc.showInfo
              return (
                <div key={tc.caseNumber} className={`case-item ${tc.passed ? 'passed' : 'failed'}`}>
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
                          <Valor className="case-value" texto={tc.input} />
                        </div>
                      )}
                      <div className="case-row">
                        <span className="case-label">Esperado</span>
                        <Valor className="case-value expected" texto={tc.expectedOutput} />
                      </div>
                      <div className="case-row">
                        <span className="case-label">Tu salida</span>
                        <Valor className="case-value actual" texto={tc.actualOutput || '(vacío)'} />
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
