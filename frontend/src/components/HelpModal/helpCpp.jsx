import DocLink from './DocLink'

// Ayuda de C++. Mismos temas y profundidad que la de Python y Java: ningún
// lenguaje debe recibir más ayuda que otro. Estilo del curso: std:: explícito
// (sin using namespace std) e indentación de 2 espacios.
const REF = 'https://es.cppreference.com/w/cpp'

const cppSections = [
  {
    id: 'entrada-salida',
    title: 'Entrada y salida',
    content: (
      <>
        <p>Para leer datos se utiliza <code>std::cin</code> con el operador <code>{'>>'}</code>. Para mostrar datos en pantalla se utiliza <code>std::cout</code> con el operador <code>{'<<'}</code>. Ambos están en <code>{'<iostream>'}</code>.</p>
        <pre>{`#include <iostream>
#include <string>

int main() {
  std::string color;
  std::cin >> color;
  std::cout << "Mi color es " << color << std::endl;
}`}</pre>
        <p><code>std::cin {'>>'}</code> lee hasta el siguiente espacio o cambio de línea, y convierte el texto al tipo de la variable.</p>
        <DocLink href={`${REF}/io/cin`}>Documentación de std::cin</DocLink>
        <DocLink href={`${REF}/io/cout`}>Documentación de std::cout</DocLink>
      </>
    ),
  },
  {
    id: 'tipos',
    title: 'Tipos de datos',
    content: (
      <>
        <p>En C++ toda variable se declara con su tipo. Los tipos básicos son:</p>
        <ul>
          <li><code>int</code> — números enteros (ej. <code>5</code>, <code>-3</code>)</li>
          <li><code>double</code> — números con decimales (ej. <code>3.14</code>)</li>
          <li><code>char</code> — un carácter (ej. <code>'a'</code>)</li>
          <li><code>bool</code> — booleanos (<code>true</code> o <code>false</code>)</li>
          <li><code>std::string</code> — cadenas de texto (ej. <code>"hola"</code>), en <code>{'<string>'}</code></li>
        </ul>
        <p>Para convertir entre tipos:</p>
        <pre>{`int edad = 0;
double altura = 0.0;
std::cin >> edad >> altura;          // cin convierte al tipo de la variable

double mitad = static_cast<double>(edad) / 2;  // entero a decimal
int numero = std::stoi("42");        // texto a entero
std::string texto = std::to_string(42);  // número a texto`}</pre>
        <DocLink href={`${REF}/language/types`}>Tipos fundamentales</DocLink>
        <DocLink href={`${REF}/string/basic_string/stol`}>std::stoi</DocLink>
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
          <li><code>%</code> módulo (resto de la división, solo con enteros)</li>
          <li>No hay operador de potencia: se usa <code>std::pow</code> de <code>{'<cmath>'}</code></li>
        </ul>
        <pre>{`10 / 3              // 3
10 % 3              // 1
10.0 / 3            // 3.33333
std::pow(3, 4)      // 81`}</pre>
        <p><strong>Comparación:</strong> <code>==</code>, <code>!=</code>, <code>{'<'}</code>, <code>{'>'}</code>, <code>{'<='}</code>, <code>{'>='}</code></p>
        <p><strong>Lógicos:</strong> <code>{'&&'}</code> (y), <code>||</code> (o), <code>!</code> (no)</p>
        <DocLink href={`${REF}/language/operator_arithmetic`}>Operadores aritméticos</DocLink>
        <DocLink href={`${REF}/numeric/math/pow`}>std::pow</DocLink>
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
  std::cout << "calor" << std::endl;
} else {
  std::cout << "frio" << std::endl;
}`}</pre>
        <p>Cuando hay varias opciones se usa <code>else if</code>:</p>
        <pre>{`if (hora < 12) {
  std::cout << "manana" << std::endl;
} else if (hora < 18) {
  std::cout << "tarde" << std::endl;
} else {
  std::cout << "noche" << std::endl;
}`}</pre>
        <p>En C++ la indentación no es obligatoria, pero las llaves sí definen el bloque.</p>
        <DocLink href={`${REF}/language/if`}>Sentencia if</DocLink>
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
  std::cout << "hola" << std::endl;   // imprime "hola" 3 veces
}

std::string palabra = "abc";
for (const char letra : palabra) {
  std::cout << letra << std::endl;    // imprime a, b, c
}`}</pre>
        <p>El ciclo <code>while</code> se repite mientras se cumpla una condición.</p>
        <pre>{`int intentos = 3;
while (intentos > 0) {
  std::cout << "queda intento" << std::endl;
  --intentos;
}`}</pre>
        <DocLink href={`${REF}/language/for`}>Ciclo for</DocLink>
        <DocLink href={`${REF}/language/range-for`}>Ciclo for por rango</DocLink>
        <DocLink href={`${REF}/language/while`}>Ciclo while</DocLink>
      </>
    ),
  },
  {
    id: 'funciones',
    title: 'Funciones',
    content: (
      <>
        <p>Una función declara el tipo que devuelve y el tipo de cada parámetro. Debe estar definida antes de usarse.</p>
        <pre>{`int triplicar(const int x) {
  return x * 3;
}

int main() {
  const int resultado = triplicar(4);  // 12
}`}</pre>
        <p>Las funciones pueden recibir varios parámetros. Una función que no devuelve nada es <code>void</code>.</p>
        <pre>{`bool cabeEnCaja(const int volumen, const int limite) {
  return volumen <= limite;
}

if (cabeEnCaja(80, 100)) {
  std::cout << "cabe" << std::endl;
}`}</pre>
        <DocLink href={`${REF}/language/functions`}>Funciones</DocLink>
      </>
    ),
  },
  {
    id: 'listas',
    title: 'Vectores',
    content: (
      <>
        <p>Un <code>{'std::vector'}</code> contiene varios elementos del mismo tipo, en orden. Los índices empiezan en 0. Está en <code>{'<vector>'}</code>.</p>
        <pre>{`std::vector<std::string> colores = {"rojo", "verde", "azul", "amarillo"};
std::cout << colores[0] << std::endl;                   // rojo
std::cout << colores[colores.size() - 1] << std::endl;  // amarillo (último)
std::cout << colores.size() << std::endl;               // 4`}</pre>
        <p>Operaciones comunes:</p>
        <pre>{`std::vector<int> numeros;
numeros.push_back(7);   // agregar al final
numeros.push_back(9);

for (const int x : numeros) {   // recorrer
  std::cout << x << std::endl;
}`}</pre>
        <p>Para encontrar la posición de un elemento puedes recorrer con un índice:</p>
        <pre>{`for (size_t i = 0; i < colores.size(); ++i) {
  if (colores[i] == buscado) {
    std::cout << i << std::endl;
    break;
  }
}`}</pre>
        <DocLink href={`${REF}/container/vector`}>std::vector</DocLink>
        <DocLink href={`${REF}/container/vector/push_back`}>push_back</DocLink>
        <DocLink href={`${REF}/algorithm/sort`}>std::sort</DocLink>
      </>
    ),
  },
  {
    id: 'cadenas',
    title: 'Cadenas (strings)',
    content: (
      <>
        <p>Para combinar texto y valores en la salida se encadena <code>{'<<'}</code>:</p>
        <pre>{`std::string ciudad = "Lima";
int habitantes = 1000000;
std::cout << ciudad << " cuenta con " << habitantes << " habitantes" << std::endl;`}</pre>
        <p>Dos <code>std::string</code> se concatenan con <code>+</code>:</p>
        <pre>{`std::string mensaje = "Bienvenido a " + ciudad;
std::cout << mensaje << std::endl;`}</pre>
        <p>Para leer una línea completa, con espacios incluidos, se usa <code>std::getline</code>. Con <code>.size()</code> se obtiene la longitud y con <code>[i]</code> cada carácter.</p>
        <pre>{`std::string linea;
std::getline(std::cin, linea);
std::cout << linea.size() << std::endl;
std::cout << linea[0] << std::endl;`}</pre>
        <DocLink href={`${REF}/string/basic_string`}>std::string</DocLink>
        <DocLink href={`${REF}/string/basic_string/getline`}>std::getline</DocLink>
      </>
    ),
  },
  {
    id: 'errores',
    title: 'Errores comunes',
    content: (
      <>
        <ul>
          <li><strong>expected ';' (o expected ',' or ';'):</strong> falta el punto y coma al final de una instrucción.</li>
          <li><strong>'x' was not declared in this scope:</strong> usaste una variable que no existe (revisa mayúsculas/minúsculas), o falta el <code>std::</code> o el <code>#include</code> de lo que estás usando.</li>
          <li><strong>expected '}':</strong> llaves mal cerradas.</li>
          <li><strong>no match for 'operator...':</strong> mezclaste tipos incompatibles, por ejemplo sumar un <code>std::string</code> con un número.</li>
          <li><strong>División entera inesperada:</strong> <code>7 / 2</code> da <code>3</code> porque ambos son enteros. Usa <code>7.0 / 2</code> o convierte con <code>static_cast{'<double>'}</code>.</li>
        </ul>
        <DocLink href={`${REF}/language`}>Referencia del lenguaje</DocLink>
      </>
    ),
  },
]

export default cppSections
