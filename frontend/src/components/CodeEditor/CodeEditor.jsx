import { useEffect, useRef, useState } from 'react'
import { EditorState, Compartment, Annotation } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { keymap, gutter, GutterMarker } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import './CodeEditor.css'

const privilegedTx = Annotation.define()

class LockMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('span')
    el.className = 'cm-lock-marker'
    el.textContent = '🔒︎'
    return el
  }
}
const lockMarker = new LockMarker()

/**
 * Componente CodeEditor
 * Integra CodeMirror con soporte para Python y captura de cambios
 *
 * Props:
 *   - code: string - Código actual en el editor
 *   - onChange: function - Callback cuando cambia el código
 *   - starterCode: string - Código inicial para el botón de revertir
 *   - readOnly: boolean - Si true, el editor no permite edición
 */
export default function CodeEditor({ code, onChange, starterCode, readOnly = false, actionSlot, isDark = true }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const readOnlyCompartment = useRef(new Compartment())
  const themeCompartment = useRef(new Compartment())
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!editorRef.current) return

    const lockedLength = starterCode ? starterCode.length : 0

    const lockFilter = EditorState.changeFilter.of((tr) => {
      if (tr.annotation(privilegedTx)) return true
      if (!tr.docChanged || lockedLength === 0) return true
      let allowed = true
      tr.changes.iterChangedRanges((fromA) => {
        if (fromA <= lockedLength) allowed = false
      })
      return allowed
    })

    const lockGutter = gutter({
      class: 'cm-lock-gutter',
      lineMarker(view, line) {
        return line.from < lockedLength ? lockMarker : null
      },
      initialSpacer: () => lockMarker,
    })

    const state = EditorState.create({
      doc: code,
      extensions: [
        lockGutter,
        basicSetup,
        keymap.of([indentWithTab]),
        python(),
        themeCompartment.current.of(isDark ? githubDark : githubLight),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { minHeight: "260px" },
          ".cm-gutter": { minHeight: "260px" },
        }),
        readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
        lockFilter,
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

  // Actualizar readOnly dinámicamente sin recrear el editor
  useEffect(() => {
    if (!viewRef.current) return
    viewRef.current.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
    })
  }, [readOnly])

  useEffect(() => {
    if (!viewRef.current) return
    viewRef.current.dispatch({
      effects: themeCompartment.current.reconfigure(isDark ? githubDark : githubLight),
    })
  }, [isDark])

  function confirmRevert() {
    if (!viewRef.current || !starterCode) return
    const newCode = starterCode + '\n'
    viewRef.current.dispatch({
      changes: { from: 0, to: viewRef.current.state.doc.length, insert: newCode },
      selection: { anchor: newCode.length },
      annotations: privilegedTx.of(true),
    })
    onChange(newCode)
    setShowConfirm(false)
  }

  return (
    <div className="editor-container">
      <div className="editor-label">
        <span>Código Python</span>
        <div className="editor-label-actions">
          {readOnly
            ? <span className="editor-solved-badge">¡Ejercicio completado!</span>
            : starterCode && (
              <button className="editor-revert-btn" onClick={() => setShowConfirm(true)} title="Restaurar código inicial">
                Iniciar de nuevo
              </button>
            )
          }
          {actionSlot}
        </div>
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
