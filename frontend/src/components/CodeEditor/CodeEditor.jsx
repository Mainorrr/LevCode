import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { python } from '@codemirror/lang-python'
import { nord } from '@fsegurai/codemirror-theme-nord'
import './CodeEditor.css'

/**
 * Componente CodeEditor
 * Integra CodeMirror con soporte para Java y captura de cambios
 * 
 * Props:
 *   - code: string - Código actual en el editor
 *   - onChange: function - Callback cuando cambia el código
 */
export default function CodeEditor({ code, onChange }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
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

  return (
    <div className="editor-container">
      <label className="editor-label">Código Python</label>
      <div ref={editorRef} className="editor-content" />
    </div>
  )
}
