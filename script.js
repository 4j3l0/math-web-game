// =========================
// 1) ELEMENTOS DEL DOM
// =========================
const boton = document.getElementById("generar");
const box_container = document.getElementById("box_container");
const num_box_container = document.getElementById("num_box_container");
const op_box_container = document.getElementById("op_box_container");
let idCounter = 0;

function crearId(prefijo) {
    idCounter += 1;
    return `${prefijo}-${Date.now()}-${idCounter}`;
}
// =========================
// 2) FUNCIONES AUXILIARES
// =========================
// Genera un número aleatorio dentro de un rango dado.
function aleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Redondea un número a 2 decimales para evitar errores de precisión.
function limpiarNumero(numero) {
    return Number(Number(numero).toFixed(2));
}
// =========================
// 3) GENERACIÓN DE LA CUENTA
// =========================
// Genera una cuenta matemática aleatoria en cadena.
function generarCuenta() {
    // Elige cuántas operaciones va a tener la cuenta.
    const cantidadCuentas = aleatorio(2, 5);

    // Arreglos para guardar operadores, números y la secuencia completa.
    const op_list = [];
    const num_list = [];
    const valores = [];

    // El primer valor base de la cuenta.
    let resultadoActual = aleatorio(1, 9);

    // Recorre la cantidad de operaciones que vamos a crear.
    for (let i = 0; i < cantidadCuentas; i++) {
        // a = valor actual, b = próximo número aleatorio.
        const a = resultadoActual;
        const b = aleatorio(1, 9);
        const operadores = ["+", "-", "*", "/"];

        // Elije un operador al azar.
        const operacion = operadores[aleatorio(0, operadores.length - 1)];
        let resultado;

        // Ejecuta la operación según el operador elegido.
        switch (operacion) {
            case "+":
                resultado = limpiarNumero(a + b);
                break;
            case "-":
                resultado = limpiarNumero(a - b);
                break;
            case "*":
                resultado = limpiarNumero(a * b);
                break;
            case "/":
                const division = a / b;
                resultado = limpiarNumero(division);
                break;
            default:
                resultado = 0;
        }

        // Guarda la secuencia completa de la operación.
        if (i === 0) {
            valores.push(a, operacion, b, "=", resultado);
            num_list.push(a, b);
        } else {
            valores.push(operacion, b, "=", resultado);
            num_list.push(b);
        }

        // Guarda los operadores usados.
        op_list.push(operacion);

        // El resultado actual pasa a ser el siguiente valor base para la siguiente operación.
        resultadoActual = resultado;
    }

    // Muestra la cuenta generada en la consola.
    console.log(valores);

    // Devuelve la estructura con toda la información necesaria.
    return {
        num_list,
        op_list,
        valores
    };
}
// =========================
// 4) VALIDACIÓN DE RESULTADOS
// =========================
// Revisa la operación que el usuario está armando y marca si está correcta.
function actualizarResultados() {
    // Toma todos los elementos hijos dentro del contenedor de la cuenta.
    const elementos = box_container.children;

    // El número inicial de la operación.
    let resultadoActual = Number(elementos[0].textContent);

    // Recorre toda la operación elemento por elemento.
    for (let i = 1; i < elementos.length; i++) {

        // Si el elemento no es un operador, no hace nada.
        if (!elementos[i].classList.contains("operador")) {
            continue;
        }

        // Obtiene el operador que está en la casilla y el número que va después.
        const operador = elementos[i].value;
        const numero = elementos[i + 1].value;

        // La casilla que contiene el resultado esperado para esa parte.
        const salida = elementos[i + 3];

        // Si faltan datos, limpia esa salida y corta la cadena.
        if (operador === "" || numero === "") {

            if (salida.classList.contains("resultado")) {
                salida.textContent = "";
            }

            salida.classList.remove("correcto", "incorrecto");
            resultadoActual = null;
            continue;
        }

        // Si el cálculo anterior no está listo, no puede continuar.
        if (resultadoActual === null) {
            if (salida.classList.contains("resultado")) {
                salida.textContent = "";
            }

            salida.classList.remove("correcto", "incorrecto");
            continue;
        }

        // Convierte el número ingresado a valor numérico.
        const b = Number(numero);
        let resultado;

        // Calcula el resultado según el operador actual.
        switch (operador) {
            case "+":
                resultado = resultadoActual + b;
                break;

            case "-":
                resultado = resultadoActual - b;
                break;

            case "*":
                resultado = resultadoActual * b;
                break;

            case "/":
                if (b === 0) {
                    resultado = NaN;
                } else {
                    resultado = resultadoActual / b;
                }
                break;
        }

        // Si el resultado no es válido, limpia la salida.
        if (!Number.isFinite(resultado)) {
            if (salida.classList.contains("resultado")) {
                salida.textContent = "";
            }

            salida.classList.remove("correcto", "incorrecto");
            resultadoActual = null;
            continue;
        }

        // Redondea el resultado para mantener valores consistentes.
        resultado = limpiarNumero(resultado);

        // Si la salida es una caja intermedia, muestra el resultado y sigue con la cadena.
        if (salida.classList.contains("resultado")) {
            salida.textContent = resultado;
            resultadoActual = resultado;
        }
        // Si la salida es la final, compara con el valor esperado y marca si es correcto o no.
        else if (salida.classList.contains("final")) {
            if (resultado === Number(salida.textContent)) {
                salida.classList.add("correcto");
                salida.classList.remove("incorrecto");
            } else {
                salida.classList.add("incorrecto");
                salida.classList.remove("correcto");
            }

            resultadoActual = resultado;
        }
    }
}
// =========================
// 5) DRAG AND DROP
// =========================
// Configura la lógica de arrastre para cada casilla del juego.
function configurarCasilla(casilla, tipo) {

    // Permite soltar un elemento sobre la casilla.
    casilla.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    // Cuando se suelta un elemento en la casilla, lo guarda si coincide el tipo y está vacía.
    casilla.addEventListener("drop", (e) => {
        e.preventDefault();
        const tipoArrastrado = e.dataTransfer.getData("tipo");
        const valor = e.dataTransfer.getData("valor");
        const id = e.dataTransfer.getData("id");

        if (tipoArrastrado === tipo && casilla.value === "") {
            const origenCasilla = document.getElementById(e.dataTransfer.getData("casilla"));
            if (origenCasilla && origenCasilla !== casilla) {
                origenCasilla.value = "";
            }
            casilla.value = valor;

            // Elimina solo la ficha original que realmente estaba en el banco.
            const elementoOriginal = id ? document.getElementById(id) : null;
            if (elementoOriginal && (
                elementoOriginal.parentElement === num_box_container || 
                elementoOriginal.parentElement === op_box_container ||
                elementoOriginal.parentElement === box_container
            )
        ) {
                elementoOriginal.remove();
            }

            // Vuelve a validar la operación con el nuevo valor.
            actualizarResultados();
        }
    });

    // Cuando empieza el arrastre, guarda los datos del valor que se mueve.
    casilla.addEventListener("dragstart", (e) => {

        if (casilla.value === "") {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData("tipo", tipo);
        e.dataTransfer.setData("valor", casilla.value);
        e.dataTransfer.setData("origen", "casilla");

        // Si la casilla no tiene id, se genera uno único.
        casilla.id = casilla.id || crearId("casilla");
        e.dataTransfer.setData("casilla", casilla.id);

        e.dataTransfer.effectAllowed = "move";
    });

    // Si el usuario borra el valor manualmente, limpia el resultado relacionado.
    casilla.addEventListener("input", () => {
        actualizarResultados();
    });

    // Hace que la casilla pueda ser arrastrada.
    casilla.draggable = true;
}
// =========================
// 6) RENDER DE LA CUENTA
// =========================
// Crea la estructura visual de la cuenta en el contenedor principal.
function generarCasillas(datos) {
    const valores = datos.valores;
    box_container.innerHTML = "";
    let nxt_result = false;

    // Recorre cada valor para crear el diseño de la operación.
    valores.forEach((valor, i) => {
        const static_box = document.createElement("div");
        const character_box = document.createElement("input");

        // Dependiendo del valor, agrega un símbolo o una caja distinta.
        if (valor == "=") {
            static_box.classList.add("igual");
            static_box.textContent = valor;
            box_container.appendChild(static_box);
            nxt_result = true;
        } else if (i === 0) {
            static_box.classList.add("inicio");
            static_box.textContent = valor;
            box_container.appendChild(static_box);
        } else if (i == valores.length - 1) {
            static_box.classList.add("final");
            static_box.textContent = valor;
            box_container.appendChild(static_box);
        } else if (!isNaN(Number(valor))) {

            if (nxt_result == true) {
                static_box.classList.add("resultado");
                box_container.appendChild(static_box);
                nxt_result = false;
            } else {
                character_box.type = "number";
                character_box.classList.add("numero");
                configurarCasilla(character_box, "numero");
                character_box.classList.add("numero");
                box_container.appendChild(character_box);
            }
        } else {
            character_box.type = "text";
            character_box.classList.add("operador");
            configurarCasilla(character_box, "operador");
            character_box.classList.add("operador");
            box_container.appendChild(character_box);
        }
    });
}
// =========================
// 7) BANCO DE NÚMEROS Y OPERADORES
// =========================
// Crea los números disponibles para arrastrar al contenedor lateral.
function actualizarEstadoBanco() {
    const tieneNumeros = num_box_container.querySelectorAll(".numero").length > 0;

    if (!tieneNumeros) {
        let placeholder = num_box_container.querySelector(".bank-empty");

        if (!placeholder) {
            placeholder = document.createElement("div");
            placeholder.classList.add("bank-empty");
            num_box_container.appendChild(placeholder);
        }
    } else {
        const placeholder = num_box_container.querySelector(".bank-empty");
        if (placeholder) {
            placeholder.remove();
        }
    }
}

function generarNumeros(datos) {
    const num_list = datos.num_list;
    num_box_container.innerHTML = "";
    num_list.forEach((valor, i) => {
        const num_box = document.createElement("div");

        // El primer número no se muestra en el banco porque es el valor inicial.
        if (i !== 0) {
            num_box.classList.add("numero");
            num_box.textContent = valor;
            num_box.draggable = true;
            num_box.id = crearId("numero");

            // Guarda la información al iniciar el arrastre.
            num_box.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("tipo", "numero");
                e.dataTransfer.setData("valor", valor);
                e.dataTransfer.setData("id", num_box.id);
                e.dataTransfer.setData("origen", "banco");
                e.dataTransfer.effectAllowed = "move";
            });

            num_box_container.appendChild(num_box);
        }
    });

    actualizarEstadoBanco();
}
// Crea los operadores disponibles para arrastrar al contenedor lateral.
function generarOperadores(datos, i) {
    const op_list = datos.op_list;
    op_box_container.innerHTML = "";

    op_list.forEach((valor) => {
        const op_box = document.createElement("div");
        op_box.classList.add("operador");
        op_box.textContent = valor;
        op_box.draggable = true;
        op_box.id = crearId("operador");

        // Guarda los datos del operador cuando se arrastra.
        op_box.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("tipo", "operador");
            e.dataTransfer.setData("valor", valor);
            e.dataTransfer.setData("id", op_box.id);
            e.dataTransfer.setData("origen", "banco");
            e.dataTransfer.effectAllowed = "move";
        });

        op_box_container.appendChild(op_box);
    });
}
// =========================
// 8) DEVOLVER AL BANCO
// =========================
num_box_container.addEventListener("dragover", (e) => {
    e.preventDefault();
});
// Cuando se suelta un número de vuelta en el banco, lo vuelve a agregar.
num_box_container.addEventListener("drop", (e) => {
    e.preventDefault();

    const tipo = e.dataTransfer.getData("tipo");
    const valor = e.dataTransfer.getData("valor");
    const origen = e.dataTransfer.getData("origen");

    // Solo permite devolver un número que venga de una casilla.
    if (tipo !== "numero" || origen !== "casilla") {
        return;
    }

    const num_box = document.createElement("div");
    num_box.classList.add("numero");
    num_box.textContent = valor;
    num_box.draggable = true;
    num_box.id = crearId("numero");

    num_box.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("tipo", "numero");
        e.dataTransfer.setData("valor", valor);
        e.dataTransfer.setData("id", num_box.id);
        e.dataTransfer.setData("origen", "banco");
        e.dataTransfer.effectAllowed = "move";
    });

    num_box_container.appendChild(num_box);
    actualizarEstadoBanco();

    // Vacía la casilla original donde estaba el número.
    const idCasilla = e.dataTransfer.getData("casilla");
    const casilla = document.getElementById(idCasilla);

    if (casilla) {
        casilla.value = "";
        actualizarResultados();
    }
});

op_box_container.addEventListener("dragover", (e) => {
    e.preventDefault();
});

op_box_container.addEventListener("drop", (e) => {
    e.preventDefault();

    const tipo = e.dataTransfer.getData("tipo");
    const valor = e.dataTransfer.getData("valor");
    const origen = e.dataTransfer.getData("origen");

    // Solo permite devolver un número que venga de una casilla.
    if (tipo !== "operador" || origen !== "casilla") {
        return;
    }

    const op_box = document.createElement("div");
    op_box.classList.add("operador");
    op_box.textContent = valor;
    op_box.draggable = true;
    op_box.id = crearId("operador");

    op_box.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("tipo", "operador");
        e.dataTransfer.setData("valor", valor);
        e.dataTransfer.setData("id", op_box.id);
        e.dataTransfer.setData("origen", "banco");
        e.dataTransfer.effectAllowed = "move";
    });

    op_box_container.appendChild(op_box);
    actualizarEstadoBanco();

    // Vacía la casilla original donde estaba el operador.
    const idCasilla = e.dataTransfer.getData("casilla");
    const casilla = document.getElementById(idCasilla);

    if (casilla) {
        casilla.value = "";
        actualizarResultados();
    }
});

// =========================
// 9) INICIALIZACIÓN
// =========================
// Genera una nueva cuenta y la renderiza en pantalla.
function renderCuenta() {
    const datos = generarCuenta();
    generarCasillas(datos);
    generarNumeros(datos);
    generarOperadores(datos);
}

// Al hacer click en el botón, se genera otra cuenta.
boton.addEventListener("click", renderCuenta);

// Primera carga inicial del juego.
renderCuenta();