import { EditorSelection } from '@codemirror/state'

/**
 * Nueva línea conservando la indentación de la línea actual, sin agregar
 * niveles nuevos.
 *
 * El Enter que trae `basicSetup` indenta según la sintaxis del lenguaje y suma
 * un nivel al abrir bloque (`:` en Python, `{` en C++/Java). Para quien está
 * aprendiendo, ese salto automático se lee como que el editor "mete un
 * tabulador solo", y encima deja la indentación en un estado que el estudiante
 * no eligió.
 *
 * Se copia el blanco inicial de lo que hay ANTES del cursor, no el de la línea
 * completa: así, partir una línea desde dentro de su indentación no arrastra
 * más espacio del que el estudiante ya había escrito.
 *
 * Vive en su propio módulo (sin JSX) para poder probarlo sin navegador.
 */
export function newlineKeepIndent(state) {
  return state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from)
    const beforeCursor = line.text.slice(0, range.from - line.from)
    const indent = /^[ \t]*/.exec(beforeCursor)[0]
    const insert = state.lineBreak + indent
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.cursor(range.from + insert.length),
    }
  })
}

/** Comando de CodeMirror que aplica `newlineKeepIndent`. */
export function insertNewlineKeepIndent(view) {
  view.dispatch(
    view.state.update(newlineKeepIndent(view.state), {
      scrollIntoView: true,
      userEvent: 'input',
    }),
  )
  return true
}
