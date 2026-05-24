import { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import './HelpModal.css'

const SECTIONS = [
  {
    id: 'entrada-salida',
    title: 'Entrada y salida',
    content: (
      <>
        <p>Para leer datos del usuario se utiliza <code>input()</code>. Para mostrar datos en pantalla se utiliza <code>print()</code>.</p>
        <pre>{`nombre = input()
print("Hola,", nombre)`}</pre>
        <p><code>input()</code> siempre devuelve un texto (cadena). Si necesitas un número, debes convertirlo.</p>
        <DocLink href="https://docs.python.org/es/3/library/functions.html#input">Documentación de input()</DocLink>
        <DocLink href="https://docs.python.org/es/3/library/functions.html#print">Documentación de print()</DocLink>
      </>
    ),
  },
  {
    id: 'tipos',
    title: 'Tipos de datos',
    content: (
      <>
        <p>Los tipos básicos en Python son:</p>
        <ul>
          <li><code>int</code> — números enteros (ej. <code>5</code>, <code>-3</code>)</li>
          <li><code>float</code> — números con decimales (ej. <code>3.14</code>)</li>
          <li><code>str</code> — cadenas de texto (ej. <code>"hola"</code>)</li>
          <li><code>bool</code> — booleanos (<code>True</code> o <code>False</code>)</li>
        </ul>
        <p>Para convertir entre tipos:</p>
        <pre>{`edad = int(input())     # convierte texto a entero
precio = float(input()) # convierte texto a decimal
texto = str(42)         # convierte número a texto`}</pre>
        <DocLink href="https://docs.python.org/es/3/library/stdtypes.html">Tipos integrados</DocLink>
      </>
    ),
  },
  {
    id: 'operadores',
    title: 'Operadores',
    content: (
      <>
        <p><strong>Aritméticos:</strong></p>
        <ul>
          <li><code>+</code> suma · <code>-</code> resta · <code>*</code> multiplicación · <code>/</code> división</li>
          <li><code>//</code> división entera (descarta el decimal)</li>
          <li><code>%</code> módulo (resto de la división)</li>
          <li><code>**</code> potencia (ej. <code>2**3</code> es 8)</li>
        </ul>
        <pre>{`7 // 2   # 3
7 % 2    # 1
2 ** 5   # 32`}</pre>
        <p><strong>Comparación:</strong> <code>==</code>, <code>!=</code>, <code>{'<'}</code>, <code>{'>'}</code>, <code>{'<='}</code>, <code>{'>='}</code></p>
        <p><strong>Lógicos:</strong> <code>and</code>, <code>or</code>, <code>not</code></p>
        <DocLink href="https://docs.python.org/es/3/reference/expressions.html#operator-summary">Resumen de operadores</DocLink>
      </>
    ),
  },
  {
    id: 'condicionales',
    title: 'Condicionales (if / elif / else)',
    content: (
      <>
        <p>Las condiciones permiten ejecutar código solo cuando se cumple algo.</p>
        <pre>{`if nota >= 60:
    print("aprobado")
else:
    print("reprobado")`}</pre>
        <p>Cuando hay varias opciones se usa <code>elif</code>:</p>
        <pre>{`if n > 0:
    print("positivo")
elif n < 0:
    print("negativo")
else:
    print("cero")`}</pre>
        <p>La indentación (4 espacios) es obligatoria en Python.</p>
        <DocLink href="https://docs.python.org/es/3/tutorial/controlflow.html#if-statements">Sentencia if</DocLink>
      </>
    ),
  },
  {
    id: 'ciclos',
    title: 'Ciclos (for y while)',
    content: (
      <>
        <p>El ciclo <code>for</code> recorre una secuencia. <code>range(n)</code> genera los números de 0 a n-1.</p>
        <pre>{`for i in range(5):       # 0, 1, 2, 3, 4
    print(i)

for i in range(1, 6):    # 1, 2, 3, 4, 5
    print(i)

for i in range(0, 10, 2): # 0, 2, 4, 6, 8
    print(i)`}</pre>
        <p>El ciclo <code>while</code> se repite mientras se cumpla una condición.</p>
        <pre>{`n = 10
suma = 0
while n > 0:
    suma += n
    n -= 1`}</pre>
        <DocLink href="https://docs.python.org/es/3/tutorial/controlflow.html#for-statements">Ciclo for</DocLink>
        <DocLink href="https://docs.python.org/es/3/reference/compound_stmts.html#while">Ciclo while</DocLink>
        <DocLink href="https://docs.python.org/es/3/library/functions.html#func-range">Función range()</DocLink>
      </>
    ),
  },
  {
    id: 'funciones',
    title: 'Funciones (def y return)',
    content: (
      <>
        <p>Una función agrupa código que puede recibir parámetros y devolver un valor.</p>
        <pre>{`def doble(x):
    return x * 2

resultado = doble(5)  # 10`}</pre>
        <p>Las funciones pueden recibir varios parámetros y devolver cualquier tipo.</p>
        <pre>{`def es_par(n):
    return n % 2 == 0

if es_par(8):
    print("es par")`}</pre>
        <DocLink href="https://docs.python.org/es/3/tutorial/controlflow.html#defining-functions">Definir funciones</DocLink>
      </>
    ),
  },
  {
    id: 'listas',
    title: 'Listas',
    content: (
      <>
        <p>Una lista contiene varios elementos en orden. Los índices empiezan en 0.</p>
        <pre>{`numeros = [10, 20, 30, 40]
print(numeros[0])   # 10
print(numeros[-1])  # 40 (último)
print(len(numeros)) # 4`}</pre>
        <p>Operaciones comunes:</p>
        <pre>{`lista = []
lista.append(5)     # agregar al final
lista.append(7)

for x in lista:     # recorrer
    print(x)

total = sum(lista)  # suma todos los elementos
lista.sort()        # ordena de menor a mayor`}</pre>
        <p>Para encontrar la posición de un elemento puedes recorrer con <code>enumerate</code>:</p>
        <pre>{`for i, valor in enumerate(lista):
    if valor == buscado:
        print(i)
        break`}</pre>
        <DocLink href="https://docs.python.org/es/3/tutorial/datastructures.html#more-on-lists">Más sobre listas</DocLink>
        <DocLink href="https://docs.python.org/es/3/library/functions.html#enumerate">Función enumerate()</DocLink>
        <DocLink href="https://docs.python.org/es/3/library/functions.html#sorted">Función sorted()</DocLink>
      </>
    ),
  },
  {
    id: 'cadenas',
    title: 'Cadenas (strings)',
    content: (
      <>
        <p>Para combinar texto y valores se pueden usar <em>f-strings</em>:</p>
        <pre>{`nombre = "Ana"
edad = 25
print(f"{nombre} tiene {edad} años")`}</pre>
        <p>También se puede concatenar con comas en <code>print</code>:</p>
        <pre>{`print(nombre, "tiene", edad, "años")`}</pre>
        <p>O usar concatenación con <code>+</code> (solo entre cadenas):</p>
        <pre>{`mensaje = "Hola, " + nombre + "!"
print(mensaje)`}</pre>
        <DocLink href="https://docs.python.org/es/3/tutorial/inputoutput.html#formatted-string-literals">f-strings</DocLink>
        <DocLink href="https://docs.python.org/es/3/library/stdtypes.html#text-sequence-type-str">Tipo str</DocLink>
      </>
    ),
  },
  {
    id: 'errores',
    title: 'Errores comunes',
    content: (
      <>
        <ul>
          <li><strong>SyntaxError:</strong> falta dos puntos al final de <code>if</code>, <code>for</code>, <code>def</code>, etc., o paréntesis mal cerrados.</li>
          <li><strong>IndentationError:</strong> bloque mal indentado. Usa 4 espacios consistentemente.</li>
          <li><strong>NameError:</strong> usaste una variable que no existe (revisa mayúsculas/minúsculas).</li>
          <li><strong>TypeError:</strong> mezclaste tipos incompatibles, por ejemplo sumar texto con número sin convertir con <code>int()</code>.</li>
          <li><strong>ValueError:</strong> <code>int("hola")</code> falla porque el texto no es un número.</li>
        </ul>
        <DocLink href="https://docs.python.org/es/3/tutorial/errors.html">Errores y excepciones</DocLink>
      </>
    ),
  },
]

function DocLink({ href, children }) {
  return (
    <a className="help-doclink" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalLink size={13} />
    </a>
  )
}

export default function HelpModal({ onClose }) {
  const [active, setActive] = useState(SECTIONS[0].id)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const current = SECTIONS.find((s) => s.id === active)

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>Ayuda de Python</h2>
          <button className="help-close" onClick={onClose} aria-label="Cerrar ayuda">
            <X size={20} />
          </button>
        </div>
        <div className="help-body">
          <nav className="help-nav">
            {SECTIONS.map((s) => (
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
