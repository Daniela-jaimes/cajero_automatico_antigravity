/**
 * ==========================================================================
 * JAVASCRIPT LOGIC - ATM SIMULATOR PREMIUM
 * Lógica pura sin dependencias para el manejo del estado del cajero automático.
 * ==========================================================================
 */

// 1. DATOS DEL USUARIO (EN MEMORIA)
const userSession = {
    cuenta: "123456789",
    pin: "1234",
    saldo: 2500000, // $2.500.000 COP
    nombre: "Juan Pérez",
    isLoggedIn: false
};

// Historial de últimas transferencias (Máximo 5)
let transferHistory = [];

// Objeto temporal para almacenar datos de transferencia antes de confirmar
let tempTransferData = null;

// Formateador de moneda (Pesos Colombianos - COP)
const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

// ==========================================================================
// 2. INICIALIZACIÓN Y EVENTOS DEL DOM
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Inicializar elementos dinámicos
    initEventListeners();
});

function initEventListeners() {
    // --- Login Event ---
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            iniciarSesion();
        });
    }

    // --- Logout Event ---
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", cerrarSesion);
    }

    // --- Dashboard Navigation Events ---
    document.getElementById("opt-balance").addEventListener("click", () => {
        consultarSaldo();
    });

    document.getElementById("opt-transfer").addEventListener("click", () => {
        abrirPantallaTransferencia();
    });

    document.getElementById("opt-history").addEventListener("click", () => {
        abrirPantallaHistorial();
    });

    // --- Back Buttons Events ---
    const btnBacks = document.querySelectorAll(".btn-back, .btn-back-menu");
    btnBacks.forEach(btn => {
        btn.addEventListener("click", () => {
            mostrarPantalla("screen-dashboard");
        });
    });

    // --- Transfer Form Submit ---
    const transferForm = document.getElementById("transfer-form");
    if (transferForm) {
        transferForm.addEventListener("submit", (e) => {
            e.preventDefault();
            solicitarConfirmacionTransferencia();
        });
    }

    // --- Modal Confirmation Events ---
    document.getElementById("btn-confirm-cancel").addEventListener("click", cerrarModalConfirmacion);
    document.getElementById("btn-confirm-approve").addEventListener("click", realizarTransferencia);
}

// ==========================================================================
// 3. FUNCIONES DE NAVEGACIÓN Y PANTALLAS
// ==========================================================================

/**
 * Cambia la pantalla activa ocultando las demás y aplicando efectos de transición.
 * @param {string} pantallaId - ID de la sección HTML a mostrar.
 */
function mostrarPantalla(pantallaId) {
    // Cerrar modal de confirmación por seguridad si estuviese abierto
    cerrarModalConfirmacion();

    // Obtener todas las pantallas
    const screens = document.querySelectorAll(".screen");
    screens.forEach(screen => {
        screen.classList.remove("active");
    });

    // Mostrar layout principal o login según corresponda
    const mainLayout = document.getElementById("main-layout");
    const loginScreen = document.getElementById("screen-login");

    if (pantallaId === "screen-login") {
        mainLayout.classList.add("d-none");
        loginScreen.classList.add("active");
    } else {
        loginScreen.classList.remove("active");
        mainLayout.classList.remove("d-none");
        
        // Activar la pantalla específica dentro del main layout
        const targetScreen = document.getElementById(pantallaId);
        if (targetScreen) {
            targetScreen.classList.add("active");
        }
    }

    // Llevar el scroll arriba en dispositivos móviles
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// 4. FUNCIONALIDADES PRINCIPALES (REQUISITOS)
// ==========================================================================

/**
 * Realiza el inicio de sesión del usuario validando la cuenta y el PIN.
 */
function iniciarSesion() {
    const inputAccount = document.getElementById("login-account").value.trim();
    const inputPin = document.getElementById("login-pin").value.trim();
    const errorMsg = document.getElementById("login-error-msg");
    const loginCard = document.querySelector(".login-card");

    // Ocultar banner de error previo
    errorMsg.classList.add("d-none");
    loginCard.classList.remove("shake");

    // Validación de credenciales
    if (inputAccount === userSession.cuenta && inputPin === userSession.pin) {
        // Credenciales correctas
        userSession.isLoggedIn = true;

        // Actualizar datos del encabezado
        document.getElementById("display-user-name").textContent = `Hola, ${userSession.nombre}`;
        document.getElementById("display-account-num").textContent = `Cuenta: ${formatAccountNumber(userSession.cuenta)}`;

        // Limpiar inputs del Login
        document.getElementById("login-account").value = "";
        document.getElementById("login-pin").value = "";

        // Redirigir al menú principal
        mostrarPantalla("screen-dashboard");
        showToast("¡Bienvenido!", "Has ingresado al sistema de manera segura.", "success");
    } else {
        // Credenciales incorrectas
        // Efecto visual de sacudida (shake) en la tarjeta de login
        setTimeout(() => {
            loginCard.classList.add("shake");
        }, 10);
        
        // Mostrar mensaje de error
        errorMsg.classList.remove("d-none");
        
        // Limpiar PIN por seguridad
        document.getElementById("login-pin").value = "";
        showToast("Error de acceso", "Cuenta o contraseña incorrectas.", "error");
    }
}

/**
 * Consulta el saldo actual de la cuenta, lo formatea y actualiza la UI.
 */
function consultarSaldo() {
    const balanceDisplay = document.getElementById("balance-display");
    // Formatear saldo a moneda de Colombia COP
    balanceDisplay.textContent = currencyFormatter.format(userSession.saldo);
    
    // Ir a pantalla de saldo
    mostrarPantalla("screen-balance");
}

/**
 * Prepara la pantalla de transferencias cargando los valores dinámicos como el saldo.
 */
function abrirPantallaTransferencia() {
    // Actualizar indicador de saldo disponible en el formulario
    const avBalance = document.getElementById("transfer-available-balance");
    avBalance.textContent = currencyFormatter.format(userSession.saldo);
    
    // Limpiar campos del formulario
    document.getElementById("transfer-account").value = "";
    document.getElementById("transfer-name").value = "";
    document.getElementById("transfer-amount").value = "";

    // Navegar a la pantalla
    mostrarPantalla("screen-transfer");
}

/**
 * Realiza las validaciones de negocio previas a la transferencia y solicita confirmación.
 */
function solicitarConfirmacionTransferencia() {
    const destAccount = document.getElementById("transfer-account").value.trim();
    const destName = document.getElementById("transfer-name").value.trim();
    const rawAmount = document.getElementById("transfer-amount").value;
    const amount = parseFloat(rawAmount);

    // 1. Validaciones básicas obligatorias (campos vacíos)
    if (!destAccount || !destName || !rawAmount) {
        showToast("Campos obligatorios", "Por favor completa todos los campos del formulario.", "error");
        return;
    }

    // 2. Validación de cuenta destino formato
    if (destAccount.length < 5) {
        showToast("Cuenta inválida", "El número de cuenta destino debe tener al menos 5 dígitos.", "error");
        return;
    }

    // 3. Validar montos inválidos (negativos o cero)
    if (amount <= 0 || isNaN(amount)) {
        showToast("Monto inválido", "El valor a transferir debe ser mayor a $0 y no puede ser negativo.", "error");
        return;
    }

    // 4. Validar saldo disponible suficiente
    if (amount > userSession.saldo) {
        showToast("Fondos insuficientes", "El valor ingresado supera tu saldo disponible actual.", "error");
        return;
    }

    // Almacenar datos temporales de la transacción
    tempTransferData = {
        cuenta: destAccount,
        nombre: destName,
        monto: amount
    };

    // Rellenar información en el Modal de Confirmación
    document.getElementById("confirm-dest-name").textContent = destName;
    document.getElementById("confirm-dest-account").textContent = formatAccountNumber(destAccount);
    document.getElementById("confirm-dest-amount").textContent = `- ${currencyFormatter.format(amount)}`;

    // Mostrar el modal
    const modal = document.getElementById("confirm-modal");
    modal.classList.remove("d-none");
}

/**
 * Ejecuta la transacción descontando el saldo y guardando la actividad en el historial.
 */
function realizarTransferencia() {
    if (!tempTransferData) {
        cerrarModalConfirmacion();
        return;
    }

    const { cuenta, nombre, monto } = tempTransferData;

    // Validar por segunda vez (doble check de seguridad) en caso de manipulación de estado
    if (monto > userSession.saldo) {
        showToast("Error", "Fondos insuficientes para completar la transacción.", "error");
        cerrarModalConfirmacion();
        return;
    }

    // Descontar saldo del usuario
    userSession.saldo -= monto;

    // Obtener fecha y hora actual
    const fechaActual = new Date();
    const timestampStr = formatTimestamp(fechaActual);

    // Crear objeto de transacción
    const transaccion = {
        id: Math.floor(100000 + Math.random() * 900000), // ID único aleatorio
        destinatario: nombre,
        cuenta: cuenta,
        monto: monto,
        fechaHora: timestampStr
    };

    // Agregar transacción al inicio de la lista
    transferHistory.unshift(transaccion);

    // Limitar el historial a las últimas 5 transferencias
    if (transferHistory.length > 5) {
        transferHistory.pop();
    }

    // Actualizar Panel de Última Transferencia en Dashboard
    actualizarPanelUltimaTransferencia(transaccion);

    // Cerrar modal y limpiar formulario
    cerrarModalConfirmacion();
    document.getElementById("transfer-form").reset();

    // Actualizar datos del formulario si volviera a transferir
    document.getElementById("transfer-available-balance").textContent = currencyFormatter.format(userSession.saldo);

    // Regresar al dashboard principal
    mostrarPantalla("screen-dashboard");

    // Enviar notificación de éxito
    showToast(
        "Transferencia exitosa", 
        `Se han enviado ${currencyFormatter.format(monto)} a ${nombre}. Nuevo saldo: ${currencyFormatter.format(userSession.saldo)}`, 
        "success"
    );

    // Limpiar datos temporales
    tempTransferData = null;
}

/**
 * Cierra el modal de confirmación de transferencia.
 */
function cerrarModalConfirmacion() {
    const modal = document.getElementById("confirm-modal");
    if (modal) {
        modal.classList.add("d-none");
    }
}

/**
 * Actualiza el panel informativo de la última transferencia realizada en la pantalla principal.
 */
function actualizarPanelUltimaTransferencia(transaccion) {
    const panel = document.getElementById("last-transfer-panel");
    const summaryText = document.getElementById("last-transfer-summary-text");

    if (transaccion) {
        summaryText.innerHTML = `Transferencia de <strong>${currencyFormatter.format(transaccion.monto)}</strong> enviada a <strong>${transaccion.destinatario}</strong> (Cuenta: ${formatAccountNumber(transaccion.cuenta)}) el día <strong>${transaccion.fechaHora}</strong>.`;
        panel.classList.remove("d-none");
    } else {
        panel.classList.add("d-none");
    }
}

/**
 * Genera la vista dinámica de historial con las transferencias almacenadas.
 */
function abrirPantallaHistorial() {
    const historyListContainer = document.getElementById("history-items-list");
    const historyCount = document.getElementById("history-count");

    // Actualizar indicador de cantidad
    historyCount.textContent = `${transferHistory.length} transaccion${transferHistory.length === 1 ? '' : 'es'}`;

    if (transferHistory.length === 0) {
        // Mostrar vista vacía
        historyListContainer.innerHTML = `
            <div class="empty-history">
                <i class="fa-solid fa-receipt"></i>
                <p>No se registran transferencias en el historial de esta cuenta.</p>
            </div>
        `;
    } else {
        // Renderizar elementos dinámicos
        let listHtml = "";
        transferHistory.forEach(item => {
            listHtml += `
                <div class="history-item">
                    <div class="item-left">
                        <div class="icon-transfer-indicator">
                            <i class="fa-solid fa-paper-plane"></i>
                        </div>
                        <div class="item-details">
                            <h4>Enviado a: ${item.destinatario}</h4>
                            <p>Cuenta: ${formatAccountNumber(item.cuenta)} | Ref: #${item.id}</p>
                            <p class="text-secondary"><i class="fa-regular fa-clock"></i> ${item.fechaHora}</p>
                        </div>
                    </div>
                    <div class="item-right">
                        <span class="item-amount">- ${currencyFormatter.format(item.monto)}</span>
                        <span class="item-status">Completado</span>
                    </div>
                </div>
            `;
        });
        historyListContainer.innerHTML = listHtml;
    }

    mostrarPantalla("screen-history");
}

/**
 * Cierra la sesión activa del usuario y limpia los campos de seguridad.
 */
function cerrarSesion() {
    userSession.isLoggedIn = false;
    
    // Ocultar panel de última transferencia para la próxima sesión
    actualizarPanelUltimaTransferencia(null);

    // Resetear formulario de login y errores
    document.getElementById("login-form").reset();
    document.getElementById("login-error-msg").classList.add("d-none");

    // Limpiar historial de sesión (opcional - en este caso vaciamos para simular salida de tarjeta física)
    transferHistory = [];
    
    // Volver a pantalla de inicio
    mostrarPantalla("screen-login");
    showToast("Sesión Cerrada", "Tu sesión ha finalizado. Por favor retira tu tarjeta de seguridad.", "info");
}

// ==========================================================================
// 5. MÉTODOS COMPLEMENTARIOS Y UTILERÍAS
// ==========================================================================

/**
 * Formatea una fecha en formato legible DD/MM/AAAA HH:MM:SS
 * @param {Date} date - Objeto de tipo fecha a formatear.
 * @returns {string} Fecha formateada.
 */
function formatTimestamp(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Oculta parcialmente un número de cuenta para mayor privacidad (Ej: ****-56789)
 * @param {string} account - Número de cuenta original.
 * @returns {string} Cuenta formateada.
 */
function formatAccountNumber(account) {
    if (account.length <= 4) return account;
    const visibleLength = 4;
    const hiddenPart = "*".repeat(account.length - visibleLength);
    const visiblePart = account.slice(-visibleLength);
    return `${hiddenPart}-${visiblePart}`;
}

/**
 * Crea e inyecta dinámicamente notificaciones toast en la esquina de la interfaz.
 * @param {string} title - Título principal de la alerta.
 * @param {string} message - Descripción de la notificación.
 * @param {string} type - Tipo de notificación ('success', 'error', 'info').
 */
function showToast(title, message, type = "info") {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;

    // Crear el elemento del toast
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // Determinar icono según tipo
    let iconClass = "fa-circle-info";
    if (type === "success") iconClass = "fa-circle-check";
    else if (type === "error") iconClass = "fa-circle-xmark";

    // Contenido del toast
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <div class="toast-content">
            <h5>${title}</h5>
            <p>${message}</p>
        </div>
    `;

    // Agregar al contenedor
    toastContainer.appendChild(toast);

    // Remover automáticamente después de 4 segundos
    setTimeout(() => {
        toast.classList.add("toast-out");
        // Esperar a que la animación de salida termine
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 4000);
}
