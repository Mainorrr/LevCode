import { useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { nord } from '@fsegurai/codemirror-theme-nord'
import './CodeEditor.css'

/**
 * Componente CodeEditor
 * Integra CodeMirror con soporte para Python y captura de cambios
 *
 * Props:
 *   - code: string - Código actual en el editor
 *   - onChange: function - Callback cuando cambia el código
 *   - starterCode: string - Código inicial para el botón de revertir
 */
export default function CodeEditor({ code, onChange, starterCode }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        python(),
        nord,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [])

  function confirmRevert() {
    if (!viewRef.current || !starterCode) return
    viewRef.current.dispatch({
      changes: { from: 0, to: viewRef.current.state.doc.length, insert: starterCode },
    })
    onChange(starterCode)
    setShowConfirm(false)
  }

  return (
    <div className="editor-container">
      <div className="editor-label">
        <span>Código Python</span>
        {starterCode && (
          <button className="editor-revert-btn" onClick={() => setShowConfirm(true)} title="Restaurar código inicial">
            Iniciar de nuevo
          </button>
        )}
      </div>
      <div ref={editorRef} className="editor-content" />

      {showConfirm && (
        <div className="revert-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="revert-modal" onClick={e => e.stopPropagation()}>
            <p className="revert-modal-title">¿Borrar tu código?</p>
            <p className="revert-modal-body">Tu código actual será eliminado y reemplazado por el código inicial. Esta acción no se puede deshacer.</p>
            <div className="revert-modal-actions">
              <button className="revert-modal-cancel" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="revert-modal-confirm" onClick={confirmRevert}>Sí, borrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
