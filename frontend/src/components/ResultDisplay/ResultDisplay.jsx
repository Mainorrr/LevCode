import './ResultDisplay.css'

/**
 * Componente ResultDisplay
 * Muestra los resultados de la compilación y ejecución del código
 * 
 * Props:
 *   - result: object|null - Objeto con { success, output, error, executionTime, limits }
 */
export default function ResultDisplay({ result }) {
  if (!result) {
    return (
      <div className="result-section">
        <div className="result-placeholder">
          <p>Los resultados aparecerán aquí</p>
        </div>
      </div>
    )
  }

  return (
    <div className="result-section">
      <div className={`result-header ${result.success ? 'success' : 'failure'}`}>
        <h2>{result.success ? 'Éxito' : 'Error'}</h2>
        <p className="execution-time">{result.executionTime}ms</p>
      </div>

      {result.output && (
        <div className="result-box">
          <h3>Output</h3>
          <pre className="output">{result.output}</pre>
        </div>
      )}

      {result.error && (
        <div className="result-box error">
          <h3>Error</h3>
          <pre className="error-text">{result.error}</pre>
        </div>
      )}
    </div>
  )
}
