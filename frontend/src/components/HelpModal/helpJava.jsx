import DocLink from './DocLink'

// Ayuda de Java. Mismos temas y profundidad que la de Python y C++: ningún
// lenguaje debe recibir más ayuda que otro. Estilo del curso: indentación de 2
// espacios y final donde el valor no cambia, como en el código inicial.
const API = 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java'
const TUT = 'https://docs.oracle.com/javase/tutorial/java'

const javaSections = [
  {
    id: 'entrada-salida',
    title: 'Entrada y salida',
    content: (
      <>
        <p>Para leer datos se utiliza un <code>Scanner</code>, que ya viene creado en el código inicial. Para mostrar datos en pantalla se utiliza <code>System.out.println()</code>.</p>
        <pre>{`import java.util.Scanner;

public class Main {
  public static void main(final String[] args) {
    final Scanner sc = new Scanner(System.in);
    final String color = sc.next();
    System.out.println("Mi color es " + color);
  }
}`}</pre>
        <p><code>sc.next()</code> lee una palabra (hasta el siguiente espacio o cambio de línea). <code>System.out.print()</code> imprime sin cambiar de línea.</p>
        <DocLink href={`${API}/util/Scanner.html`}>Documentación de Scanner</DocLink>
        <DocLink href={`${API}/io/PrintStream.html#println(java.lang.String)`}>Documentación de println()</DocLink>
      </>
    ),
  },
  {
    id: 'tipos',
    title: 'Tipos de datos',
    content: (
      <>
        <p>En Java toda variable se declara con su tipo. Los tipos básicos son:</p>
        <ul>
          <li><code>int</code> — números enteros (ej. <code>5</code>, <code>-3</code>)</li>
          <li><code>double</code> — números con decimales (ej. <code>3.14</code>)</li>
          <li><code>char</code> — un carácter (ej. <code>'a'</code>)</li>
          <li><code>boolean</code> — booleanos (<code>true</code> o <code>false</code>)</li>
          <li><code>String</code> — cadenas de texto (ej. <code>"hola"</code>)</li>
        </ul>
        <p>Para convertir entre tipos:</p>
        <pre>{`final int edad = sc.nextInt();          // lee un entero
final double altura = sc.nextDouble();  // lee un decimal

final double mitad = (double) edad / 2;        // entero a decimal
final int numero = Integer.parseInt("42");     // texto a entero
final String texto = String.valueOf(42);       // número a texto`}</pre>
        <DocLink href={`${TUT}/nutsandbolts/datatypes.html`}>Tipos primitivos</DocLink>
        <DocLink href={`${API}/lang/Integer.html#parseInt(java.lang.String)`}>Integer.parseInt</DocLink>
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
          <li><code>/</code> entre dos enteros es división entera (descarta el decimal)</li>
          <li><code>%</code> módulo (resto de la división)</li>
          <li>No hay operador de potencia: se usa <code>Math.pow</code></li>
        </ul>
        <pre>{`10 / 3             // 3
10 % 3             // 1
10.0 / 3           // 3.3333333333333335
Math.pow(3, 4)     // 81.0`}</pre>
        <p><strong>Comparación:</strong> <code>==</code>, <code>!=</code>, <code>{'<'}</code>, <code>{'>'}</code>, <code>{'<='}</code>, <code>{'>='}</code></p>
        <p><strong>Lógicos:</strong> <code>{'&&'}</code> (y), <code>||</code> (o), <code>!</code> (no)</p>
        <DocLink href={`${TUT}/nutsandbolts/operators.html`}>Operadores</DocLink>
        <DocLink href={`${API}/lang/Math.html#pow(double,double)`}>Math.pow</DocLink>
      </>
    ),
  },
  {
    id: 'condicionales',
    title: 'Condicionales (if / else if / else)',
    content: (
      <>
        <p>Las condiciones permiten ejecutar código solo cuando se cumple algo. La condición va entre paréntesis y el bloque entre llaves.</p>
        <pre>{`if (temperatura > 25) {
  System.out.println("calor");
} else {
  System.out.println("frio");
}`}</pre>
        <p>Cuando hay varias opciones se usa <code>else if</code>:</p>
        <pre>{`if (hora < 12) {
  System.out.println("manana");
} else if (hora < 18) {
  System.out.println("tarde");
} else {
  System.out.println("noche");
}`}</pre>
        <p>En Java la indentación no es obligatoria, pero las llaves sí definen el bloque.</p>
        <DocLink href={`${TUT}/nutsandbolts/if.html`}>Sentencia if</DocLink>
      </>
    ),
  },
  {
    id: 'ciclos',
    title: 'Ciclos (for y while)',
    content: (
      <>
        <p>El ciclo <code>for</code> tiene inicio, condición y avance.</p>
        <pre>{`for (int i = 0; i < 3; ++i) {
  System.out.println("hola");   // imprime "hola" 3 veces
}

final String palabra = "abc";
for (final char letra : palabra.toCharArray()) {
  System.out.println(letra);    // imprime a, b, c
}`}</pre>
        <p>El ciclo <code>while</code> se repite mientras se cumpla una condición.</p>
        <pre>{`int intentos = 3;
while (intentos > 0) {
  System.out.println("queda intento");
  --intentos;
}`}</pre>
        <DocLink href={`${TUT}/nutsandbolts/for.html`}>Ciclo for</DocLink>
        <DocLink href={`${TUT}/nutsandbolts/while.html`}>Ciclo while</DocLink>
      </>
    ),
  },
  {
    id: 'funciones',
    title: 'Métodos',
    content: (
      <>
        <p>Un método declara el tipo que devuelve y el tipo de cada parámetro. Para llamarlo desde <code>main</code> debe ser <code>static</code> y estar dentro de la clase.</p>
        <pre>{`public class Main {
  static int triplicar(final int x) {
    return x * 3;
  }

  public static void main(final String[] args) {
    final int resultado = triplicar(4);  // 12
  }
}`}</pre>
        <p>Los métodos pueden recibir varios parámetros. Un método que no devuelve nada es <code>void</code>.</p>
        <pre>{`static boolean cabeEnCaja(final int volumen, final int limite) {
  return volumen <= limite;
}

if (cabeEnCaja(80, 100)) {
  System.out.println("cabe");
}`}</pre>
        <DocLink href={`${TUT}/javaOO/methods.html`}>Definir métodos</DocLink>
      </>
    ),
  },
  {
    id: 'listas',
    title: 'Arreglos y listas',
    content: (
      <>
        <p>Un arreglo contiene una cantidad fija de elementos del mismo tipo, en orden. Los índices empiezan en 0.</p>
        <pre>{`final String[] colores = {"rojo", "verde", "azul", "amarillo"};
System.out.println(colores[0]);                   // rojo
System.out.println(colores[colores.length - 1]);  // amarillo (último)
System.out.println(colores.length);               // 4`}</pre>
        <p>Si la cantidad cambia, se usa un <code>ArrayList</code> (en <code>java.util</code>):</p>
        <pre>{`final ArrayList<Integer> numeros = new ArrayList<>();
numeros.add(7);   // agregar al final
numeros.add(9);

for (final int x : numeros) {   // recorrer
  System.out.println(x);
}`}</pre>
        <p>Para encontrar la posición de un elemento puedes recorrer con un índice:</p>
        <pre>{`for (int i = 0; i < colores.length; ++i) {
  if (colores[i].equals(buscado)) {
    System.out.println(i);
    break;
  }
}`}</pre>
        <DocLink href={`${TUT}/nutsandbolts/arrays.html`}>Arreglos</DocLink>
        <DocLink href={`${API}/util/ArrayList.html`}>ArrayList</DocLink>
        <DocLink href={`${API}/util/Arrays.html#sort(int%5B%5D)`}>Arrays.sort</DocLink>
      </>
    ),
  },
  {
    id: 'cadenas',
    title: 'Cadenas (strings)',
    content: (
      <>
        <p>Para combinar texto y valores se concatena con <code>+</code>:</p>
        <pre>{`final String ciudad = "Lima";
final int habitantes = 1000000;
System.out.println(ciudad + " cuenta con " + habitantes + " habitantes");`}</pre>
        <p>El resultado de concatenar también es un <code>String</code>:</p>
        <pre>{`final String mensaje = "Bienvenido a " + ciudad;
System.out.println(mensaje);`}</pre>
        <p>Para leer una línea completa, con espacios incluidos, se usa <code>sc.nextLine()</code>. Con <code>.length()</code> se obtiene la longitud y con <code>.charAt(i)</code> cada carácter. Dos cadenas se comparan con <code>.equals()</code>, no con <code>==</code>.</p>
        <pre>{`final String linea = sc.nextLine();
System.out.println(linea.length());
System.out.println(linea.charAt(0));
System.out.println(linea.equals("hola"));`}</pre>
        <DocLink href={`${API}/lang/String.html`}>Clase String</DocLink>
        <DocLink href={`${API}/util/Scanner.html#nextLine()`}>Scanner.nextLine</DocLink>
      </>
    ),
  },
  {
    id: 'errores',
    title: 'Errores comunes',
    content: (
      <>
        <ul>
          <li><strong>';' expected:</strong> falta el punto y coma al final de una instrucción.</li>
          <li><strong>cannot find symbol:</strong> usaste una variable o método que no existe (revisa mayúsculas/minúsculas), o falta el <code>import</code> de la clase que estás usando.</li>
          <li><strong>class X is public, should be declared in a file named X.java:</strong> la clase debe llamarse <code>Main</code>.</li>
          <li><strong>incompatible types:</strong> mezclaste tipos incompatibles, por ejemplo guardar un <code>double</code> en un <code>int</code>.</li>
          <li><strong>InputMismatchException:</strong> <code>sc.nextInt()</code> encontró algo que no es un entero.</li>
        </ul>
        <DocLink href={`${TUT}/nutsandbolts/index.html`}>Fundamentos del lenguaje</DocLink>
      </>
    ),
  },
]

export default javaSections
