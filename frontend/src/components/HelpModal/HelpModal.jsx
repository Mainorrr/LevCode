import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import pythonSections from './helpPython'
import cppSections from './helpCpp'
import javaSections from './helpJava'
import './HelpModal.css'

// La ayuda es la del lenguaje que el estudiante eligió. Las tres cubren los
// mismos temas, con los mismos ids de sección, y se cae a Python si llega un
// lenguaje desconocido.
const HELP_BY_LANGUAGE = {
  python: { title: 'Ayuda de Python', sections: pythonSections },
  cpp:    { title: 'Ayuda de C++',    sections: cppSections },
  java:   { title: 'Ayuda de Java',   sections: javaSections },
}

export function helpTitle(language) {
  return (HELP_BY_LANGUAGE[language] || HELP_BY_LANGUAGE.python).title
}

export default function HelpModal({ onClose, language = 'python' }) {
  const { title, sections } = HELP_BY_LANGUAGE[language] || HELP_BY_LANGUAGE.python
  const [active, setActive] = useState(sections[0].id)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const current = sections.find((s) => s.id === active) || sections[0]

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>{title}</h2>
          <button className="help-close" onClick={onClose} aria-label="Cerrar ayuda">
            <X size={20} />
          </button>
        </div>
        <div className="help-body">
          <nav className="help-nav">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`help-nav-item${active === s.id ? ' active' : ''}`}
                onClick={() => setActive(s.id)}
              >
                {s.title}
              </button>
            ))}
          </nav>
          <div className="help-content">
            <h3>{current.title}</h3>
            {current.content}
          </div>
        </div>
      </div>
    </div>
  )
}
