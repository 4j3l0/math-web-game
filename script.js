const boton = document.getElementById("generar");
const box_container = document.getElementById("box_container");
const num_box_container = document.getElementById("num_box_container");
const op_box_container = document.getElementById("op_box_container");

function aleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function limpiarNumero(numero) {
    return Number(Number(numero).toFixed(2));
}

function generarCuenta() {
    const cantidadCuentas = aleatorio(2, 5);
    const op_list = [];
    const num_list = [];
    const valores = [];
    let resultadoActual = aleatorio(1, 9);

    for (let i = 0; i < cantidadCuentas; i++) {
        const a = resultadoActual;
        const b = aleatorio(1, 9);
        const operadores = ["+", "-", "*", "/"];
        const operacion = operadores[aleatorio(0, operadores.length - 1)];
        let resultado;

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

        if (i === 0) {
            valores.push(a, operacion, b, "=", resultado);
        } else {
            valores.push(operacion, b, "=", resultado);
        }
        if (i === 0) {
            num_list.push(a, b);
        } else {
            num_list.push(b);
        }
        op_list.push(operacion);
        resultadoActual = resultado;
    }

    console.log(valores)

    return {
        num_list,
        op_list,
        valores,
        largo: valores.length
    };
}

function generarCasillas(datos) {
    const valores = datos.valores;
    box_container.innerHTML = "";
    let i;

    valores.forEach((valor, i) => {
        const box = document.createElement("div");
        box.classList.add("box");

        if(valor == "="){
            box.textContent = valor;
        }

        if(i == 0 || i == valores.length - 1){
            box.textContent = valor;
        }

        box_container.appendChild(box);
    });
}

function generarNumeros(datos) {
    const num_list = datos.num_list;
    num_box_container.innerHTML = "";

    num_list.forEach((valor) => {
        const num_box = document.createElement("div");
        num_box.classList.add("num_box");
        num_box.textContent = valor;
        num_box_container.appendChild(num_box);
    });
}

function generarOperadores(datos) {
    const op_list = datos.op_list;
    op_box_container.innerHTML = "";

    op_list.forEach((valor) => {
        const op_box = document.createElement("div");
        op_box.classList.add("op_box");
        op_box.textContent = valor;
        op_box_container.appendChild(op_box);
    });
}

function renderCuenta() {
    const datos = generarCuenta();
    generarCasillas(datos);
    generarNumeros(datos);
    generarOperadores(datos);
}

boton.addEventListener("click", renderCuenta);
renderCuenta();