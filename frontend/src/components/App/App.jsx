import { useState } from 'react'
import CodeEditor from '../CodeEditor/CodeEditor'
import ResultDisplay from '../ResultDisplay/ResultDisplay'
import './App.css'

/**
 * Component principal de LevCode
 * Maneja el estado de la aplicación y la lógica de validación del carnet
 */
export default function App() {
  const [code, setCode] = useState(`public class Solution {
  public static void main(String[] args) {
    // Escriba aquí su código Java
    System.out.println("¡Hola Mundo!");
  }
}`)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')

  /**
   * Valida que el carnet tenga el formato correcto: 1 letra + 5 dígitos
   */
  const validateCarnet = (carnet) => {
    const carnetRegex = /^[A-Za-z\d]{6}$/
    return carnetRegex.test(carnet)
  }

  /**
   * Maneja el envío del código para compilación y ejecución
   */
  const handleSubmit = async () => {
    // Validación del carnet estudiantil
    if (!userId.trim()) {
      setResult({
        success: false,
        error: 'El Carnet Estudiantil es requerido',
        output: '',
        executionTime: 0,
      })
      return
    }

    if (!validateCarnet(userId)) {
      setResult({
        success: false,
        error: 'Formato de Carnet Estudiantil inválido.',
        output: '',
        executionTime: 0,
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: `Error de conexión: ${error.message}`,
        output: '',
        executionTime: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Nombre App</h1>
        <p>Un proyecto de la Escuela de Ciencias de la Computación e Informática </p>
      </header>

      <div className="app-content">
        <div className="editor-section">
          <div className="metadata">
            <input
              type="text"
              placeholder="Carnet Estudiantil"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="input"
              required
              maxLength="6"
            />
          </div>

          <CodeEditor code={code} onChange={setCode} />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Código'}
          </button>
        </div>

        <ResultDisplay result={result} />
      </div>
    </div>
  )
}
