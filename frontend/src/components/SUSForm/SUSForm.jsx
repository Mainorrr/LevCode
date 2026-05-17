import { useEffect, useState } from 'react'
import { SUS_QUESTIONS, SUS_SCALE } from './questions'
import './SUSForm.css'

/**
 * Cuestionario SUS (System Usability Scale) en español.
 *
 * Props:
 *   - carnet: string
 *   - grupo: string
 *   - accessPassword: string
 *   - onComplete: function(submitted: boolean) — vuelve al menú
 *   - showToast: function(msg) — opcional
 */
export default function SUSForm({ carnet, grupo, accessPassword, onComplete, showToast }) {
  const [answers, setAnswers] = useState(Array(SUS_QUESTIONS.length).fill(null))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Registrar entrada al montar
  useEffect(() => {
    fetch('/api/sus/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Password': accessPassword },
      body: JSON.stringify({ carnet, grupo }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (r.status === 409 && data.submitted) {
          showToast && showToast('Ya enviaste el cuestionario anteriormente.')
          onComplete(true)
        }
      })
      .catch(() => {
        // silencioso: el envío posterior reintentará si la fila no existe
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = (qIdx, value) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[qIdx] = value
      return next
    })
  }

  const allAnswered = answers.every((a) => a !== null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!allAnswered) {
      setError('Debes responder todas las preguntas antes de enviar.')
      return
    }

    setSubmitting(true)
    const body = { carnet }
    answers.forEach((v, i) => {
      body[`q${i + 1}`] = v
    })

    try {
      const r = await fetch('/api/sus/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Access-Password': accessPassword },
        body: JSON.stringify(body),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(data.error || 'Error al enviar el cuestionario.')
        setSubmitting(false)
        return
      }
      showToast && showToast('Gracias por completar el cuestionario.')
      onComplete(true)
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
      setSubmitting(false)
    }
  }

  return (
    <div className="susform-container">
      <div className="susform-card">
        <h2 className="susform-title">Cuestionario al finalizar</h2>
        <p className="susform-subtitle">
          Por favor responde cada afirmación según tu experiencia con el sistema.
          Solo puedes enviar el cuestionario una vez.
        </p>

        <form onSubmit={handleSubmit} className="susform-form">
          {SUS_QUESTIONS.map((text, i) => (
            <fieldset key={i} className="susform-question">
              <legend className="susform-question-text">
                {i + 1}. {text}
              </legend>
              <div className="susform-scale">
                {SUS_SCALE.map((opt) => {
                  const selected = answers[i] === opt.value
                  return (
                    <label
                      key={opt.value}
                      className={`susform-option ${selected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`q${i + 1}`}
                        value={opt.value}
                        checked={selected}
                        onChange={() => handleSelect(i, opt.value)}
                      />
                      <span className="susform-option-value">{opt.value}</span>
                      <span className="susform-option-label">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))}

          {error && <p className="susform-error">{error}</p>}

          <div className="susform-actions">
            <button
              type="button"
              className="susform-btn susform-btn-secondary"
              onClick={() => onComplete(false)}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="susform-btn"
              disabled={!allAnswered || submitting}
            >
              {submitting ? 'Enviando...' : 'Enviar cuestionario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
