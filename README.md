# Juego matemático de tablero

## Idea del juego

El objetivo es llegar a un resultado resolviendo una cadena de cuentas. El resultado de cada operación se convierte en el número inicial de la siguiente, hasta alcanzar la meta.

Los números y el orden de los operadores varían aleatoriamente. Cada nivel usa una cantidad fija de operaciones para que el reto sea más manejable.

## Dificultad adaptable

Cada nivel cambia la cantidad y el tipo de operaciones, además de cuánto feedback recibe el jugador. En Fácil y Medio todas las casillas están disponibles desde el comienzo y se pueden completar o modificar en cualquier orden.

### Fácil

- Genera una cadena de 3 operaciones con números del 1 al 7 y suma, resta y multiplicación.
- Cada cuenta usa una vez cada operador del nivel.
- Cada cuenta tiene 6 casillas para completar (dos por operación: operador y número). En total se ven 13 espacios, contando inicio, signos igual y resultados.
- Todas las casillas se pueden completar o cambiar en cualquier orden.
- Muestra los resultados intermedios y marca cada operación correcta o incorrecta para que se pueda corregir enseguida.
- Muestra cuántas operaciones se calcularon.

### Medio

- Genera una cadena de 4 operaciones con números del 1 al 7 y suma, resta, multiplicación y división.
- Cada cuenta usa una vez cada operador del nivel.
- Cada cuenta tiene 8 casillas para completar y 17 espacios visibles en total.
- Muestra los resultados intermedios, pero no señala cuáles son correctos o incorrectos.
- Solo valida el resultado final. Si no coincide con la meta, se puede modificar cualquier ficha y la cadena se recalcula.
- Muestra cuántas operaciones se calcularon.

### Difícil

- Genera una cadena de 5 operaciones con números del 1 al 7 y suma, resta, multiplicación, división y potenciación (`^`).
- Cada cuenta usa una vez cada operador del nivel.
- Cada cuenta tiene 10 casillas para completar y 21 espacios visibles en total.
- Todas las casillas se pueden completar antes de validar la cadena.
- Oculta el indicador de progreso y espera a que se pulse **Comprobar cuenta** para mostrar los resultados y las marcas de acierto o error.

### Extremo

- Genera una cadena de 6 operaciones con números del 1 al 7 y los seis operadores: suma, resta, multiplicación, división, potenciación (`^`) y raíz (`√`).
- Cada cuenta usa una vez cada operador del nivel.
- Cada cuenta tiene 12 casillas para completar y 25 espacios visibles en total.
- Usa las mismas mecánicas de comprobación final que Difícil.

En potenciación, la ficha numérica indica el exponente y se limita a 2 o 3 para mantener los resultados manejables. En raíz, esa ficha indica el índice: por ejemplo, `27 √ 3` representa la raíz cúbica de 27. Los resultados no se redondean: el generador solo elige operaciones cuyo resultado sea entero o tenga una parte decimal de `.25`, `.5` o `.75`; los resultados con otras fracciones se descartan. Se aplica el mismo filtro a las respuestas del jugador. Además, todos los resultados se limitan a cuatro dígitos numéricos (sin contar el signo ni el separador decimal) y a una magnitud máxima de 9.999.

Al cambiar de nivel se genera una cuenta nueva con los parámetros correspondientes. El temporizador y la racha de cuentas se aplican a todos los niveles.

## Controles y adaptación

- Las fichas se pueden arrastrar a las casillas.
- También se puede seleccionar una ficha con clic, toque, Enter o barra espaciadora, y luego activar una casilla.
- En dispositivos táctiles se usa selección por toque y no hace falta arrastrar fichas; el diseño móvil evita el desplazamiento horizontal.
- Para devolver una ficha al banco con toque o teclado, activa la casilla ocupada sin seleccionar antes otra ficha.
- El diseño reorganiza las casillas y los bancos en pantallas pequeñas, con áreas de toque amplias y estados de foco visibles.
- La selección y las acciones se anuncian mediante una región accesible para lectores de pantalla.

## Estética del tablero

La interfaz conserva la zona central para resolver la cadena y los bancos de números y operadores organizados como paneles. El panel lateral muestra el Top 10 local en lugar del recorrido. Se conserva la paleta existente: fondo azul oscuro, números verdes, operadores amarillos, resultados rosados y casillas de salida/meta azules y celestes.

## Temporizador

Cada cuenta tiene un límite de un minuto y medio. Si el tiempo se agota antes de resolverla, la racha se reinicia y se genera otra cuenta de la misma dificultad con el contador reiniciado. Al resolver la cuenta, la racha suma un punto, se carga automáticamente el siguiente desafío y comienza un nuevo minuto y medio.

## Racha de cuentas

El marcador muestra cuántas cuentas consecutivas se resolvieron. La racha vuelve a cero si se termina el tiempo, se pide una cuenta nueva manualmente o se cambia la dificultad. El panel lateral cambia al Top 10 de la dificultad seleccionada; cada nivel tiene una lista independiente y guarda únicamente puntajes que califican para esa lista. Al perder una racha elegible, aparece un cartel arcade para ingresar un nombre o continuar sin guardar. Los rankings se conservan localmente en ese navegador y dispositivo.
