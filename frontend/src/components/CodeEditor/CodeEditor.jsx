import { useEffect, useRef, useState } from 'react'
import { EditorState, Compartment, Annotation, StateField, RangeSetBuilder } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { keymap, gutter, GutterMarker, Decoration } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import { RefreshCw } from 'lucide-react'
import './CodeEditor.css'

const privilegedTx = Annotation.define()

class LockMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('span')
    el.className = 'cm-lock-marker'
    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="10" rx="2"/><circle cx="12" cy="16" r="1"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>'
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

    // Mueve el cursor al inicio de la primera línea editable si intenta entrar a la zona bloqueada.
    const lockSelectionFilter = EditorState.transactionFilter.of((tr) => {
      if (lockedLength === 0 || !tr.selection) return tr
      const sel = tr.selection.main
      if (sel.anchor <= lockedLength || sel.head <= lockedLength) {
        const docLen = tr.newDoc.length
        // Buscar el inicio de la primera línea cuyo from > lockedLength
        let target = Math.min(lockedLength + 1, docLen)
        if (target <= docLen) {
          const line = tr.newDoc.lineAt(target)
          target = line.from
          if (target <= lockedLength) target = Math.min(line.to + 1, docLen)
        }
        return [tr, { selection: { anchor: target, head: target } }]
      }
      return tr
    })

    const lockGutter = gutter({
      class: 'cm-lock-gutter',
      lineMarker(view, line) {
        return line.from < lockedLength ? lockMarker : null
      },
      initialSpacer: () => lockMarker,
    })

    const lockedLineDeco = Decoration.line({ class: 'cm-locked-line' })
    const lockedLinesField = StateField.define({
      create(state) {
        const builder = new RangeSetBuilder()
        if (lockedLength > 0) {
          let pos = 0
          while (pos < state.doc.length) {
            const line = state.doc.lineAt(pos)
            if (line.from >= lockedLength) break
            builder.add(line.from, line.from, lockedLineDeco)
            pos = line.to + 1
          }
        }
        return builder.finish()
      },
      update(deco) { return deco },
      provide: f => EditorView.decorations.from(f),
    })

    const state = EditorState.create({
      doc: code,
      extensions: [
        lockGutter,
        lockedLinesField,
        basicSetup,
        keymap.of([indentWithTab]),
        python(),
        themeCompartment.current.of(isDark ? githubDark : githubLight),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { minHeight: "260px", paddingTop: "0", paddingBottom: "0" },
          ".cm-gutter": { minHeight: "260px" },
          ".cm-gutters": { paddingTop: "0", paddingBottom: "0" },
        }),
        readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
        lockFilter,
        lockSelectionFilter,
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
        <div className="editor-label-left">
          {!readOnly && starterCode && (
            <button className="editor-revert-btn" onClick={() => setShowConfirm(true)} title="Iniciar de nuevo" aria-label="Iniciar de nuevo">
              <RefreshCw size={14} strokeWidth={3} />
            </button>
          )}
          <span>Código Python</span>
        </div>
        <div className="editor-label-actions">
          {readOnly && <span className="editor-solved-badge">¡Ejercicio completado!</span>}
          {actionSlot}
        </div>
      </div>
      <div ref={editorRef} className="editor-content" />

      {showConfirm && (
        <div className="revert-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="revert-modal" onClick={e => e.stopPropagation()}>
            <p className="revert-modal-title">¿Borrar tu código?</p>
            <p className="revert-modal-body">Tu código actual será eliminado y reemplazado por el código inicial. Puedes deshacer esta acción presionando Ctrl + Z en el teclado.</p>
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
