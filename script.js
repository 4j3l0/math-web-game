// =========================
// 1) ELEMENTOS DEL DOM
// =========================
const boton = document.getElementById("generar");
const box_container = document.getElementById("box_container");
const num_box_container = document.getElementById("num_box_container");
const op_box_container = document.getElementById("op_box_container");
const selectorDificultad = document.getElementById("dificultad");
const estadoJuego = document.getElementById("estado_juego");
const progreso = document.getElementById("progreso");
const resultadoPanel = document.getElementById("resultado_panel");
const resultadoEtiqueta = document.getElementById("resultado_etiqueta");
const resultadoValor = document.getElementById("resultado_valor");
const botonComprobar = document.getElementById("comprobar");
const timerTexto = document.getElementById("timer");
const timerBarra = document.getElementById("timer_bar");
const scoreTexto = document.getElementById("score");
const scoreboard = document.getElementById("scoreboard");
const scoreboardCategory = document.getElementById("scoreboard_category");
const scoreboardStatus = document.getElementById("scoreboard_status");
const scoreModal = document.getElementById("score_modal");
const scoreForm = document.getElementById("score_form");
const scoreName = document.getElementById("score_name");
const scoreModalMessage = document.getElementById("score_modal_message");
const scoreCancel = document.getElementById("score_cancel");
const SCOREBOARD_KEY = "math-web-game.top10.v1";
const SUPABASE_CONFIG = window.MATH_GAME_SUPABASE || {};
const SUPABASE_URL = (SUPABASE_CONFIG.url || "").replace(/\/$/, "");
const SUPABASE_PUBLISHABLE_KEY = SUPABASE_CONFIG.publishableKey || "";
const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const esDispositivoTactil = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
const DURACION_CUENTA = { facil: 90, medio: 120, dificil: 150, extremo: 180 };
const MAX_RESULTADO = 9999;
let idCounter = 0;
let fichaSeleccionada = null;
let casillaSeleccionada = null;
let pasoActual = 0;
let cantidadOperaciones = 0;
let cuentaComprobada = false;
let tiempoRestante = DURACION_CUENTA[selectorDificultad.value];
let intervaloTimer = null;
let cuentasSeguidas = 0;
let cuentaCompletada = false;
let avanceCuentaTimeout = null;
let scorePendiente = 0;
let categoriaScorePendiente = "";
let alCerrarModalScore = null;
let categoriaRacha = selectorDificultad.value;
const dificultades = {
    facil: { nombre: "Fácil", operaciones: [3, 3], minimo: 1, maximo: 9, operadores: ["+", "-", "*"] },
    medio: { nombre: "Media", operaciones: [4, 4], minimo: 1, maximo: 9, operadores: ["+", "-", "*", "/"] },
    dificil: { nombre: "Difícil", operaciones: [5, 5], minimo: 1, maximo: 9, operadores: ["+", "-", "*", "/", "^"] },
    extremo: { nombre: "Extremo", operaciones: [6, 6], minimo: 1, maximo: 9, operadores: ["+", "-", "*", "/", "^", "√"] }
};

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
// Conserva solo enteros o múltiplos exactos de un cuarto; tolera errores binarios mínimos.
function validarFraccionPermitida(numero) {
    const valor = Number(numero);
    const cuartoPermitido = Math.round(valor * 4) / 4;
    return Math.abs(valor - cuartoPermitido) <= 1e-10 ? cuartoPermitido : null;
}

function mezclarArray(array) {
    const copia = [...array];

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}
// =========================
// 3) GENERACIÓN DE LA CUENTA
// =========================
// Genera una cuenta matemática aleatoria en cadena.
function generarCuenta() {
    const dificultad = dificultades[selectorDificultad.value];
    // Elige cuántas operaciones va a tener la cuenta.
    const cantidadCuentas = aleatorio(...dificultad.operaciones);

    // Incluye todos los operadores del nivel y sortea los adicionales.
    const op_list = mezclarArray([...dificultad.operadores]);
    while (op_list.length < cantidadCuentas) {
        op_list.push(dificultad.operadores[aleatorio(0, dificultad.operadores.length - 1)]);
    }
    for (let intento = 0; intento < 1000; intento += 1) {
        const operadoresCuenta = mezclarArray(op_list);
        const num_list = [];
        const valores = [];
        let resultadoActual = aleatorio(dificultad.minimo, dificultad.maximo);
        let cuentaValida = true;

        for (let i = 0; i < cantidadCuentas; i += 1) {
            const a = resultadoActual;
            const operacion = operadoresCuenta[i];
            const candidatos = operacion === "^"
                ? [2, 3]
                : operacion === "√"
                    ? (a < 0 ? [3] : [2, 3])
                    : Array.from({ length: dificultad.maximo - dificultad.minimo + 1 }, (_, index) => dificultad.minimo + index);
            const opcionesValidas = mezclarArray(candidatos).filter((b) => calcularOperacion(a, operacion, b) !== null);

            if (opcionesValidas.length === 0) {
                cuentaValida = false;
                break;
            }

            const b = opcionesValidas[0];
            const resultado = calcularOperacion(a, operacion, b);
            if (i === 0) {
                valores.push(a, operacion, b, "=", resultado);
                num_list.push(a, b);
            } else {
                valores.push(operacion, b, "=", resultado);
                num_list.push(b);
            }
            resultadoActual = resultado;
        }

        if (cuentaValida) return { num_list, op_list, valores };
    }

    // Fallback seguro: valores unitarios mantienen todos los resultados dentro del límite.
    const operadoresCuenta = mezclarArray(op_list);
    const num_list = [];
    const valores = [];
    let resultadoActual = 1;
    operadoresCuenta.forEach((operacion, i) => {
        const a = resultadoActual;
        const b = operacion === "^" ? 2 : operacion === "√" && a < 0 ? 3 : 1;
        const resultado = calcularOperacion(a, operacion, b);
        if (i === 0) {
            valores.push(a, operacion, b, "=", resultado);
            num_list.push(a, b);
        } else {
            valores.push(operacion, b, "=", resultado);
            num_list.push(b);
        }
        resultadoActual = resultado;
    });
    return { num_list, op_list, valores };
}

function calcularOperacion(a, operacion, b) {
    let resultado;
    switch (operacion) {
        case "+": resultado = a + b; break;
        case "-": resultado = a - b; break;
        case "*": resultado = a * b; break;
        case "/": resultado = b === 0 ? NaN : a / b; break;
        case "^": resultado = Math.pow(a, b); break;
        case "√":
            resultado = a < 0
                ? (b % 2 === 1 ? -Math.pow(-a, 1 / b) : NaN)
                : Math.pow(a, 1 / b);
            break;
        default: return null;
    }
    if (!Number.isFinite(resultado)) return null;
    const resultadoLimpio = validarFraccionPermitida(resultado);
    if (resultadoLimpio === null) return null;
    const cantidadDigitos = String(Math.abs(resultadoLimpio)).replace(/\D/g, "").length;
    if (Math.abs(resultadoLimpio) > MAX_RESULTADO || cantidadDigitos > 4) return null;
    return resultadoLimpio;
}
// =========================
// 4) VALIDACIÓN DE RESULTADOS
// =========================
// Revisa la operación que el usuario está armando y marca si está correcta.
function actualizarResultados() {
    const dificultad = selectorDificultad.value;
    const entradasOperador = [...box_container.querySelectorAll(".operador[data-paso]")];
    const entradasNumero = [...box_container.querySelectorAll(".numero[data-paso]")];

    if (dificultad === "dificil" || dificultad === "extremo") {
        let resultadoAnterior = Number(box_container.querySelector(".inicio").textContent);
        let pasosCalculados = 0;
        let cadenaContinua = true;
        let resultadoInvalido = false;

        for (let paso = 0; paso < cantidadOperaciones; paso += 1) {
            const salida = obtenerSalida(paso);
            const operador = entradasOperador[paso];
            const numero = entradasNumero[paso];
            const calculado = cadenaContinua ? calcularPaso(paso, resultadoAnterior) : null;
            if (calculado === null || !salida) {
                const completo = operador && numero && operador.value !== "" && numero.value !== "";
                if (cadenaContinua && completo) {
                    resultadoInvalido = true;
                    salida.classList.add("incorrecto");
                } else {
                    salida?.classList.remove("incorrecto");
                }
                if (salida && !salida.classList.contains("final")) salida.textContent = "";
                if (salida) delete salida.dataset.resultadoCalculado;
                cadenaContinua = false;
                continue;
            }

            pasosCalculados += 1;
            resultadoAnterior = calculado;
            salida.dataset.resultadoCalculado = calculado;
            salida.classList.remove("correcto", "incorrecto");
            if (!salida.classList.contains("final")) salida.textContent = calculado;
        }

        const todasLasCasillasLlenas = entradasOperador.every((entrada, i) => entrada.value !== "" && entradasNumero[i].value !== "");
        botonComprobar.hidden = true;
        actualizarPanelResultado(pasosCalculados > 0 ? resultadoAnterior : null, pasosCalculados === cantidadOperaciones);
        if (!cuentaComprobada) {
            estadoJuego.textContent = resultadoInvalido
                ? "El resultado debe tener 4 dígitos o menos y ser entero o terminar en .25, .5 o .75."
                : "";
        }
        actualizarProgreso();
        if (todasLasCasillasLlenas && !resultadoInvalido && !cuentaComprobada) {
            comprobarCuentaCompleta();
        }
        return;
    }

    botonComprobar.hidden = true;
    const esMedio = dificultad === "medio";
    let resultadoAnterior = Number(box_container.querySelector(".inicio").textContent);
    let cadenaContinua = true;
    let pasosCalculados = 0;
    let pasosCorrectos = 0;
    let resultadoFinal = null;
    let resultadoInvalido = false;

    for (let paso = 0; paso < cantidadOperaciones; paso += 1) {
        const salida = obtenerSalida(paso);
        const operador = entradasOperador[paso];
        const numero = entradasNumero[paso];
        const calculado = cadenaContinua ? calcularPaso(paso, resultadoAnterior) : null;
        if (calculado === null || !salida) {
            const hayOperandos = operador && numero && operador.value !== "" && numero.value !== "";
            let excedeEnEstePaso = false;
            if (cadenaContinua && hayOperandos && salida) {
                resultadoInvalido = true;
                excedeEnEstePaso = true;
                salida.classList.add("incorrecto");
                salida.classList.remove("correcto");
            }
            cadenaContinua = false;
            if (salida) {
                if (!salida.classList.contains("final")) salida.textContent = "";
                delete salida.dataset.resultadoCalculado;
                if (!excedeEnEstePaso) salida.classList.remove("correcto", "incorrecto");
            }
            continue;
        }

        pasosCalculados += 1;
        resultadoAnterior = calculado;
        salida.dataset.resultadoCalculado = calculado;
        const correcto = calculado === Number(salida.dataset.resultadoEsperado);
        if (correcto) pasosCorrectos += 1;
        if (salida.classList.contains("final")) {
            resultadoFinal = calculado;
        } else {
            salida.textContent = calculado;
        }
        salida.classList.toggle("correcto", !esMedio && correcto);
        salida.classList.toggle("incorrecto", !esMedio && !correcto);
    }

    pasoActual = pasosCalculados;
    actualizarPanelResultado(pasosCalculados > 0 ? resultadoAnterior : null, pasosCalculados === cantidadOperaciones);
    if (resultadoInvalido) {
        estadoJuego.textContent = "El resultado debe tener 4 dígitos o menos y ser entero o terminar en .25, .5 o .75.";
    } else if (esMedio) {
        const salidaFinal = obtenerSalida(cantidadOperaciones - 1);
        if (pasosCalculados === cantidadOperaciones) {
            const correcto = resultadoFinal === Number(salidaFinal.dataset.resultadoEsperado);
            salidaFinal.classList.toggle("correcto", correcto);
            salidaFinal.classList.toggle("incorrecto", !correcto);
            estadoJuego.textContent = correcto
                ? "El resultado final es correcto. ¡Cuenta resuelta! Puedes seguir modificándola."
                : "El resultado final es incorrecto. Puedes modificar cualquier ficha de la cuenta.";
        } else {
            salidaFinal.classList.remove("correcto", "incorrecto");
            estadoJuego.textContent = "";
        }
    } else if (pasosCalculados === cantidadOperaciones && pasosCorrectos === cantidadOperaciones) {
        estadoJuego.textContent = "¡Todas las operaciones son correctas! Puedes seguir modificando la cuenta.";
    } else if (pasosCalculados < cantidadOperaciones) {
        estadoJuego.textContent = "";
    } else {
        estadoJuego.textContent = "Hay resultados incorrectos. Modifica las fichas marcadas para corregir la cuenta.";
    }
    actualizarProgreso();
    if (cuentaResuelta()) completarCuenta();
}

function obtenerSalida(paso) {
    return box_container.querySelector(`[data-salida-paso="${paso}"]`);
}

function calcularPaso(paso, resultadoAnterior) {
    const operador = box_container.querySelector(`.operador[data-paso="${paso}"]`);
    const numero = box_container.querySelector(`.numero[data-paso="${paso}"]`);
    if (!operador || !numero || operador.value === "" || numero.value === "") return null;
    return calcularOperacion(resultadoAnterior, operador.value, Number(numero.value));
}

function actualizarPanelResultado(valor, completo) {
    if (valor === null || valor === undefined) {
        resultadoPanel.hidden = true;
        resultadoValor.textContent = "";
        return;
    }
    resultadoPanel.hidden = false;
    resultadoEtiqueta.textContent = completo ? "Resultado calculado" : "Resultado parcial";
    resultadoValor.textContent = valor;
}

function dificultadActual() {
    return selectorDificultad.value;
}

function bloquearPaso(paso, bloqueado) {
    box_container.querySelectorAll(`[data-paso="${paso}"]`).forEach((entrada) => {
        entrada.dataset.bloqueado = String(bloqueado);
        entrada.setAttribute("aria-disabled", String(bloqueado));
        entrada.classList.toggle("casilla-bloqueada", bloqueado);
    });
}

function bloquearTodosLosPasos(bloqueado) {
    for (let paso = 0; paso < cantidadOperaciones; paso += 1) bloquearPaso(paso, bloqueado);
}

function actualizarProgreso() {
    if (dificultadActual() === "dificil" || dificultadActual() === "extremo") {
        progreso.hidden = true;
        return;
    }
    progreso.hidden = false;
    progreso.textContent = `Operaciones calculadas: ${pasoActual} de ${cantidadOperaciones}`;
}

function comprobarCuentaCompleta() {
    let resultado = Number(box_container.querySelector(".inicio").textContent);
    let completa = true;
    let cadenaContinua = true;
    let resultadoInvalido = false;
    let pasosCalculados = 0;
    for (let paso = 0; paso < cantidadOperaciones; paso += 1) {
        const salida = obtenerSalida(paso);
        const calculado = cadenaContinua ? calcularPaso(paso, resultado) : null;
        if (calculado === null || !salida) {
            completa = false;
            const operador = box_container.querySelector(`.operador[data-paso="${paso}"]`);
            const numero = box_container.querySelector(`.numero[data-paso="${paso}"]`);
            if (cadenaContinua && operador?.value !== "" && numero?.value !== "") {
                resultadoInvalido = true;
                salida?.classList.add("incorrecto");
            }
            cadenaContinua = false;
            continue;
        }
        const correcto = calculado === Number(salida.dataset.resultadoEsperado);
        pasosCalculados += 1;
        if (!salida.classList.contains("final")) salida.textContent = calculado;
        salida.dataset.resultadoCalculado = calculado;
        salida.classList.toggle("correcto", correcto);
        salida.classList.toggle("incorrecto", !correcto);
        resultado = calculado;
        if (!correcto) completa = false;
    }
    cuentaComprobada = !resultadoInvalido;
    actualizarPanelResultado(pasosCalculados > 0 ? resultado : null, pasosCalculados === cantidadOperaciones);
    for (let paso = 0; paso < cantidadOperaciones; paso += 1) bloquearPaso(paso, !resultadoInvalido);
    const dificultadRequiereComprobacionAutomatica = selectorDificultad.value === "dificil" || selectorDificultad.value === "extremo";
    botonComprobar.hidden = dificultadRequiereComprobacionAutomatica || !resultadoInvalido;
    estadoJuego.textContent = resultadoInvalido
        ? "El resultado debe tener 4 dígitos o menos y ser entero o terminar en .25, .5 o .75; modifica las fichas marcadas para continuar."
        : completa ? "¡Toda la cadena es correcta! Llegaste al resultado final." : "Hay operaciones incorrectas. Genera otra cuenta para volver a intentarlo.";
    if (completa) completarCuenta();
}

function cuentaResuelta() {
    if (cuentaCompletada) return true;
    if (selectorDificultad.value === "facil") {
        return box_container.querySelectorAll(".resultado.correcto, .final.correcto").length === cantidadOperaciones;
    }
    if (selectorDificultad.value === "medio") {
        return Boolean(box_container.querySelector(".final.correcto"));
    }
    return cuentaComprobada && box_container.querySelectorAll(".correcto").length === cantidadOperaciones;
}

function actualizarTimer() {
    const duracionTotal = DURACION_CUENTA[selectorDificultad.value];
    const minutos = Math.floor(tiempoRestante / 60).toString().padStart(2, "0");
    const segundos = (tiempoRestante % 60).toString().padStart(2, "0");
    timerTexto.textContent = `${minutos}:${segundos}`;
    timerBarra.style.width = `${(tiempoRestante / duracionTotal) * 100}%`;
    timerTexto.classList.toggle("poco-tiempo", tiempoRestante <= 30);
}

function detenerTimer() {
    if (intervaloTimer !== null) {
        clearInterval(intervaloTimer);
        intervaloTimer = null;
    }
}

function actualizarScore() {
    scoreTexto.textContent = cuentasSeguidas;
}

function leerTop10(categoria = selectorDificultad.value) {
    try {
        const guardado = JSON.parse(localStorage.getItem(`${SCOREBOARD_KEY}.${categoria}`) || "[]");
        if (!Array.isArray(guardado)) return [];
        return guardado
            .filter((registro) => registro && typeof registro.nombre === "string" && Number.isInteger(registro.puntaje) && registro.puntaje > 0)
            .sort((a, b) => b.puntaje - a.puntaje || (b.fecha || 0) - (a.fecha || 0))
            .slice(0, 10);
    } catch {
        return [];
    }
}

async function obtenerTop10Compartido(categoria) {
    const parametros = new URLSearchParams({
        select: "player_name,score,created_at",
        category: `eq.${categoria}`,
        order: "score.desc,created_at.asc,id.asc",
        limit: "10"
    });
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/math_game_scores?${parametros}`, {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
        cache: "no-store"
    });
    if (!respuesta.ok) throw new Error("No se pudo consultar el ranking compartido.");
    const filas = await respuesta.json();
    return filas.map((fila) => ({
        nombre: fila.player_name,
        puntaje: Number(fila.score),
        fecha: Date.parse(fila.created_at) || 0
    }));
}

function mostrarTop10(records, categoria) {
    const nombreCategoria = dificultades[categoria]?.nombre || categoria;
    scoreboardCategory.textContent = nombreCategoria;
    scoreboard.closest(".leaderboard-panel").setAttribute("aria-label", `Top 10 de ${nombreCategoria}`);
    scoreboard.replaceChildren();
    if (records.length === 0) {
        const vacio = document.createElement("li");
        vacio.className = "scoreboard-empty";
        vacio.textContent = "Todavía no hay récords. ¡Sé el primero!";
        scoreboard.appendChild(vacio);
        return;
    }

    records.forEach((record) => {
        const fila = document.createElement("li");
        const nombre = document.createElement("span");
        const puntaje = document.createElement("span");
        nombre.className = "scoreboard-name";
        nombre.textContent = record.nombre;
        puntaje.className = "scoreboard-points";
        puntaje.textContent = record.puntaje;
        fila.append(nombre, puntaje);
        scoreboard.appendChild(fila);
    });
}

async function dibujarTop10(categoria = selectorDificultad.value) {
    let records;
    let conectado = false;
    if (SUPABASE_CONFIGURED) {
        try {
            records = await obtenerTop10Compartido(categoria);
            conectado = true;
        } catch {
            records = leerTop10(categoria);
        }
    } else {
        records = leerTop10(categoria);
    }

    if (categoria !== selectorDificultad.value) return records;
    mostrarTop10(records, categoria);
    scoreboardStatus.textContent = conectado
        ? ""
        : SUPABASE_CONFIGURED
            ? records.length ? "Sin conexión: mostrando récords guardados en este dispositivo." : "No se pudo conectar al ranking compartido."
            : "El ranking está guardado solo en este dispositivo.";
    return records;
}

function calificaTop10(puntaje, categoria = selectorDificultad.value, records = leerTop10(categoria)) {
    return puntaje > 0 && (records.length < 10 || puntaje >= records[9].puntaje);
}

async function guardarEnTop10(nombre, puntaje, categoria) {
    if (SUPABASE_CONFIGURED) {
        const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_math_game_score`, {
            method: "POST",
            headers: {
                apikey: SUPABASE_PUBLISHABLE_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ p_category: categoria, p_name: nombre, p_score: puntaje })
        });
        if (!respuesta.ok) throw new Error("No se pudo guardar en el ranking compartido.");
        const guardado = await respuesta.json();
        if (guardado) await dibujarTop10(categoria);
        return guardado;
    }

    const records = leerTop10(categoria);
    if (!calificaTop10(puntaje, categoria, records)) return false;
    records.push({ nombre, puntaje, fecha: Date.now() });
    records.sort((a, b) => b.puntaje - a.puntaje || (b.fecha || 0) - (a.fecha || 0));
    try {
        localStorage.setItem(`${SCOREBOARD_KEY}.${categoria}`, JSON.stringify(records.slice(0, 10)));
        dibujarTop10(categoria);
        return true;
    } catch {
        return false;
    }
}

function pedirNombreParaTop10(puntaje, categoria, alCerrar) {
    scorePendiente = puntaje;
    categoriaScorePendiente = categoria;
    alCerrarModalScore = alCerrar;
    scoreName.value = "";
    scoreModalMessage.textContent = `Resolviste ${puntaje} cuentas seguidas en ${dificultades[categoria].nombre}. Ingresa tu nombre para guardar la racha.`;
    scoreModal.showModal();
    scoreName.focus();
}

scoreForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nombre = scoreName.value.trim().slice(0, 16);
    if (!nombre) {
        scoreName.focus();
        return;
    }
    const botonGuardar = scoreForm.querySelector('[type="submit"]');
    botonGuardar.disabled = true;
    try {
        const guardado = await guardarEnTop10(nombre, scorePendiente, categoriaScorePendiente);
        if (guardado) {
            scoreModal.close();
        } else {
            scoreModalMessage.textContent = "Ese puntaje ya no alcanza el Top 10. No se guardó.";
            scoreModal.close();
        }
    } catch {
        scoreModalMessage.textContent = "No se pudo conectar con el ranking compartido. Revisa tu conexión e inténtalo de nuevo.";
    } finally {
        botonGuardar.disabled = false;
    }
});

scoreCancel.addEventListener("click", () => scoreModal.close());
scoreModal.addEventListener("close", () => {
    const alCerrar = alCerrarModalScore;
    alCerrarModalScore = null;
    scorePendiente = 0;
    categoriaScorePendiente = "";
    if (alCerrar) alCerrar();
});

function completarCuenta() {
    if (cuentaCompletada) return;
    cuentaCompletada = true;
    cuentasSeguidas += 1;
    actualizarScore();
    detenerTimer();
    estadoJuego.textContent = `¡Cuenta resuelta! Racha: ${cuentasSeguidas}. Cargando el siguiente desafío...`;
    avanceCuentaTimeout = setTimeout(() => {
        avanceCuentaTimeout = null;
        renderCuenta();
    }, 1100);
}

async function terminarRacha(alTerminar) {
    detenerTimer();
    if (avanceCuentaTimeout !== null) {
        clearTimeout(avanceCuentaTimeout);
        avanceCuentaTimeout = null;
    }
    const puntajeFinal = cuentasSeguidas;
    const categoriaFinal = categoriaRacha;
    const continuar = () => {
        cuentasSeguidas = 0;
        categoriaRacha = selectorDificultad.value;
        actualizarScore();
        alTerminar();
    };

    if (puntajeFinal <= 0) {
        continuar();
        return;
    }

    let records;
    try {
        records = SUPABASE_CONFIGURED
            ? await obtenerTop10Compartido(categoriaFinal)
            : leerTop10(categoriaFinal);
    } catch {
        records = leerTop10(categoriaFinal);
    }

    if (calificaTop10(puntajeFinal, categoriaFinal, records)) {
        pedirNombreParaTop10(puntajeFinal, categoriaFinal, continuar);
    } else {
        continuar();
    }
}

function reiniciarTimer() {
    detenerTimer();
    tiempoRestante = DURACION_CUENTA[selectorDificultad.value];
    actualizarTimer();
    intervaloTimer = setInterval(() => {
        tiempoRestante -= 1;
        actualizarTimer();
        if (tiempoRestante <= 0) {
            detenerTimer();
            if (cuentaResuelta()) return;
            terminarRacha(() => renderCuenta("Se acabó el tiempo. Se generó una cuenta nueva."));
        }
    }, 1000);
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
        colocarFicha(casilla, {
            tipo: e.dataTransfer.getData("tipo"),
            valor: e.dataTransfer.getData("valor"),
            id: e.dataTransfer.getData("id"),
            casillaOrigen: e.dataTransfer.getData("casilla")
        });
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

    casilla.addEventListener("click", () => activarCasilla(casilla));
    casilla.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activarCasilla(casilla);
        }
    });

    // Hace que la casilla pueda ser arrastrada.
    casilla.type = "button";
    casilla.setAttribute("aria-label", tipo === "numero" ? "Casilla para un número" : "Casilla para un operador");
    casilla.title = "Selecciona una ficha y activa esta casilla";
}

function tipoDeCasilla(casilla) {
    return casilla.classList.contains("numero") ? "numero" : "operador";
}

function limpiarSeleccionCasilla() {
    casillaSeleccionada?.classList.remove("casilla-seleccionada");
    casillaSeleccionada = null;
}

function devolverSeleccionAlBanco(tipo) {
    if (casillaSeleccionada && tipoDeCasilla(casillaSeleccionada) === tipo) {
        devolverFichaCasilla(casillaSeleccionada);
    } else if (!casillaSeleccionada) {
        fichaSeleccionada = null;
        document.querySelectorAll(".ficha.seleccionada").forEach((elemento) => elemento.classList.remove("seleccionada"));
        estadoJuego.textContent = "";
    }
    actualizarEstadoBanco();
}

function activarCasilla(casilla) {
    if (casilla.dataset.bloqueado === "true") return;

    if (fichaSeleccionada) {
        if (fichaSeleccionada.tipo !== tipoDeCasilla(casilla)) return;
        if (casilla.value !== "") devolverFichaCasilla(casilla);
        colocarFicha(casilla, fichaSeleccionada);
        limpiarSeleccionCasilla();
        return;
    }

    if (casillaSeleccionada) {
        if (casillaSeleccionada === casilla) {
            if (casilla.value !== "") devolverFichaCasilla(casilla);
            return;
        }

        if (tipoDeCasilla(casillaSeleccionada) !== tipoDeCasilla(casilla)) {
            limpiarSeleccionCasilla();
        } else {
            const valorOrigen = casillaSeleccionada.value;
            const valorDestino = casilla.value;
            casillaSeleccionada.value = valorDestino;
            casillaSeleccionada.textContent = valorDestino;
            casilla.value = valorOrigen;
            casilla.textContent = valorOrigen;
            limpiarSeleccionCasilla();
            estadoJuego.textContent = valorDestino === ""
                ? "Ficha movida a la otra casilla."
                : "Fichas intercambiadas.";
            actualizarResultados();
            return;
        }
    }

    if (casilla.value === "") return;
    casillaSeleccionada = casilla;
    casilla.classList.add("casilla-seleccionada");
}

function devolverFichaCasilla(casilla) {
    const tipoFicha = casilla.classList.contains("numero") ? "numero" : "operador";
    if (casillaSeleccionada === casilla) limpiarSeleccionCasilla();
    crearFicha(casilla.value, tipoFicha, tipoFicha === "numero" ? num_box_container : op_box_container);
    casilla.value = "";
    casilla.textContent = "";
    estadoJuego.textContent = "Ficha devuelta al banco.";
    actualizarEstadoBanco();
    actualizarResultados();
}

function colocarFicha(casilla, ficha) {
    if (!ficha || casilla.dataset.bloqueado === "true" || ficha.tipo !== (casilla.classList.contains("numero") ? "numero" : "operador") || casilla.value !== "") return;

    const origen = ficha.casillaOrigen ? document.getElementById(ficha.casillaOrigen) : null;
    if (origen && origen !== casilla) {
        origen.value = "";
        origen.textContent = "";
    }
    casilla.value = ficha.valor;
    casilla.textContent = ficha.valor;

    const original = ficha.id ? document.getElementById(ficha.id) : null;
    if (original && (original.parentElement === num_box_container || original.parentElement === op_box_container)) original.remove();
    fichaSeleccionada = null;
    limpiarSeleccionCasilla();
    document.querySelectorAll(".ficha.seleccionada").forEach((elemento) => elemento.classList.remove("seleccionada"));
    estadoJuego.textContent = `${ficha.tipo === "numero" ? "Número" : "Operador"} ${ficha.valor} colocado.`;
    actualizarEstadoBanco();
    actualizarResultados();
}

function crearFicha(valor, tipo, contenedor) {
    const ficha = document.createElement("div");
    ficha.classList.add("ficha", tipo);
    ficha.textContent = valor;
    ficha.draggable = !esDispositivoTactil;
    ficha.tabIndex = 0;
    ficha.setAttribute("role", "button");
    ficha.setAttribute("aria-label", `${tipo === "numero" ? "Número" : "Operador"} ${valor}. Seleccionar para colocar`);
    ficha.id = crearId(tipo);
    ficha.addEventListener("click", () => {
        if (fichaSeleccionada?.id === ficha.id) {
            const primerCasilleroVacio = [...box_container.querySelectorAll(`.${tipo}[data-paso]`)]
                .find((casillero) => casillero.value === "");
            if (primerCasilleroVacio) {
                colocarFicha(primerCasilleroVacio, fichaSeleccionada);
            } else {
                estadoJuego.textContent = `No hay casilleros vacíos para ${tipo === "numero" ? "números" : "operadores"}.`;
            }
            return;
        }

        if (casillaSeleccionada && tipoDeCasilla(casillaSeleccionada) === tipo) {
            devolverFichaCasilla(casillaSeleccionada);
            return;
        }
        limpiarSeleccionCasilla();
        document.querySelectorAll(".ficha.seleccionada").forEach((elemento) => elemento.classList.remove("seleccionada"));
        fichaSeleccionada = { tipo, valor, id: ficha.id };
        ficha.classList.add("seleccionada");
        estadoJuego.textContent = "";
    });
    ficha.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            ficha.click();
        }
    });
    ficha.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("tipo", tipo);
        e.dataTransfer.setData("valor", valor);
        e.dataTransfer.setData("id", ficha.id);
        e.dataTransfer.setData("origen", "banco");
        e.dataTransfer.effectAllowed = "move";
    });
    contenedor.appendChild(ficha);
}
// =========================
// 6) RENDER DE LA CUENTA
// =========================
// Crea la estructura visual de la cuenta en el contenedor principal.
function generarCasillas(datos) {
    const valores = datos.valores;
    box_container.innerHTML = "";
    let nxt_result = false;
    let paso = 0;
    cantidadOperaciones = datos.op_list.length;

    // Recorre cada valor para crear el diseño de la operación.
    valores.forEach((valor, i) => {
        const static_box = document.createElement("div");
        const character_box = document.createElement("button");
        character_box.type = "button";
        character_box.classList.add("casilla-slot");

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
            static_box.dataset.salidaPaso = paso;
            static_box.dataset.resultadoEsperado = valor;
            static_box.textContent = valor;
            box_container.appendChild(static_box);
        } else if (!isNaN(Number(valor))) {

            if (nxt_result == true) {
                static_box.classList.add("resultado");
                static_box.dataset.salidaPaso = paso;
                static_box.dataset.resultadoEsperado = valor;
                box_container.appendChild(static_box);
                nxt_result = false;
                paso += 1;
            } else {
                character_box.classList.add("numero");
                character_box.dataset.paso = paso;
                configurarCasilla(character_box, "numero", paso);
                character_box.classList.add("numero");
                box_container.appendChild(character_box);
            }
        } else {
            character_box.classList.add("operador");
            character_box.dataset.paso = paso;
            configurarCasilla(character_box, "operador", paso);
            character_box.classList.add("operador");
            box_container.appendChild(character_box);
        }
    });
    pasoActual = 0;
    cuentaComprobada = false;
    box_container.querySelectorAll("button[data-paso]").forEach((entrada) => {
        const bloqueado = false;
        entrada.dataset.bloqueado = String(bloqueado);
        entrada.setAttribute("aria-disabled", String(bloqueado));
        entrada.classList.toggle("casilla-bloqueada", bloqueado);
    });
    actualizarProgreso();
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
    const numerosDesordenados = mezclarArray(num_list.filter((_, i) => i !== 0));

    numerosDesordenados.forEach((valor) => {
        crearFicha(valor, "numero", num_box_container);
    });

    actualizarEstadoBanco();
}
// Crea los operadores disponibles para arrastrar al contenedor lateral.
function generarOperadores(datos) {
    const op_list = datos.op_list;
    op_box_container.innerHTML = "";
    const operadoresDesordenados = mezclarArray(op_list);

    operadoresDesordenados.forEach((valor) => {
        crearFicha(valor, "operador", op_box_container);
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

    crearFicha(valor, "numero", num_box_container);
    actualizarEstadoBanco();

    // Vacía la casilla original donde estaba el número.
    const idCasilla = e.dataTransfer.getData("casilla");
    const casilla = document.getElementById(idCasilla);

    if (casilla) {
        casilla.value = "";
        casilla.textContent = "";
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

    crearFicha(valor, "operador", op_box_container);
    actualizarEstadoBanco();

    // Vacía la casilla original donde estaba el operador.
    const idCasilla = e.dataTransfer.getData("casilla");
    const casilla = document.getElementById(idCasilla);

    if (casilla) {
        casilla.value = "";
        casilla.textContent = "";
        actualizarResultados();
    }
});

num_box_container.addEventListener("click", (e) => {
    if (casillaSeleccionada && tipoDeCasilla(casillaSeleccionada) === "numero") {
        devolverFichaCasilla(casillaSeleccionada);
    } else if (e.target === num_box_container || e.target.classList.contains("bank-empty")) {
        devolverSeleccionAlBanco("numero");
    }
});

op_box_container.addEventListener("click", (e) => {
    if (casillaSeleccionada && tipoDeCasilla(casillaSeleccionada) === "operador") {
        devolverFichaCasilla(casillaSeleccionada);
    } else if (e.target === op_box_container || e.target.classList.contains("bank-empty")) {
        devolverSeleccionAlBanco("operador");
    }
});

// =========================
// 9) INICIALIZACIÓN
// =========================
// Genera una nueva cuenta y la renderiza en pantalla.
function renderCuenta(mensajeInicial = "") {
    if (avanceCuentaTimeout !== null) {
        clearTimeout(avanceCuentaTimeout);
        avanceCuentaTimeout = null;
    }
    fichaSeleccionada = null;
    limpiarSeleccionCasilla();
    cuentaCompletada = false;
    actualizarPanelResultado(null, false);
    dibujarTop10();
    botonComprobar.hidden = true;
    estadoJuego.textContent = selectorDificultad.value === "dificil" || selectorDificultad.value === "extremo"
        ? "Completa toda la cadena; se comprobará automáticamente al final."
        : "Completa las casillas en el orden que prefieras; la cadena se recalcula al cambiar fichas.";
    const datos = generarCuenta();
    generarCasillas(datos);
    generarNumeros(datos);
    generarOperadores(datos);
    reiniciarTimer();
    if (mensajeInicial) estadoJuego.textContent = mensajeInicial;
}

// Al hacer click en el botón, se genera otra cuenta.
boton.addEventListener("click", () => {
    terminarRacha(() => renderCuenta());
});
selectorDificultad.addEventListener("change", () => {
    dibujarTop10();
    terminarRacha(() => renderCuenta());
});
botonComprobar.addEventListener("click", comprobarCuentaCompleta);

// Primera carga inicial del juego.
dibujarTop10();
actualizarScore();
renderCuenta();
