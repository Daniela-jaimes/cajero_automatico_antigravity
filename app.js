// ==================== CONFIGURACIÓN DE CUENTAS INICIALES ====================
const DEFAULT_ACCOUNTS = [
    {
        username: "ana",
        pin: "1234",
        balance: 5000.00,
        cardNumber: "4000 1234 5678 9012",
        transactions: []
    },
    {
        username: "juan",
        pin: "4321",
        balance: 3000.00,
        cardNumber: "4000 4321 8765 4321",
        transactions: []
    },
    {
        username: "maria",
        pin: "1111",
        balance: 7000.00,
        cardNumber: "4000 1111 2222 3333",
        transactions: []
    }
];

// ==================== ESTADO GLOBAL DE LA APLICACIÓN ====================
let accounts = [];
let currentUser = null;
let isBalanceHidden = false;

// Elementos de la interfaz - Vistas
const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");

// Elementos del Login
const loginForm = document.getElementById("login-form");
const loginUsernameInput = document.getElementById("login-username");
const loginPinInput = document.getElementById("login-pin");
const togglePinBtn = document.getElementById("toggle-pin-btn");
const eyeIcon = document.getElementById("eye-icon");
const pinButtons = document.querySelectorAll(".pin-btn");
const pinClearBtn = document.getElementById("pin-clear");
const pinBackspaceBtn = document.getElementById("pin-backspace");

// Elementos del Dashboard
const userGreeting = document.getElementById("user-greeting");
const currentDateEl = document.getElementById("current-date");
const logoutBtn = document.getElementById("logout-btn");
const cardHolderName = document.getElementById("card-holder-name");
const balanceAmountEl = document.getElementById("balance-amount");
const toggleBalanceBtn = document.getElementById("toggle-balance-visibility");
const balanceEyeIcon = document.getElementById("balance-eye-icon");
const creditCardNumber = document.querySelector(".credit-card .card-number");

// Botones de acciones
const actionTransferBtn = document.getElementById("action-transfer-btn");
const actionDepositBtn = document.getElementById("action-deposit-btn");
const actionWithdrawBtn = document.getElementById("action-withdraw-btn");

// Modales y Formularios
const transferModal = document.getElementById("transfer-modal");
const transferForm = document.getElementById("transfer-form");
const transferRecipient = document.getElementById("transfer-recipient");
const transferRecipientStatus = document.getElementById("transfer-recipient-status");
const transferAmount = document.getElementById("transfer-amount");
const transferAvailableBalance = document.getElementById("transfer-available-balance");
const transferCancelBtn = document.getElementById("transfer-cancel-btn");
const transferCloseX = document.getElementById("transfer-close-x");

const depositModal = document.getElementById("deposit-modal");
const depositForm = document.getElementById("deposit-form");
const depositAmount = document.getElementById("deposit-amount");
const depositCancelBtn = document.getElementById("deposit-cancel-btn");
const depositCloseX = document.getElementById("deposit-close-x");

const withdrawModal = document.getElementById("withdraw-modal");
const withdrawForm = document.getElementById("withdraw-form");
const withdrawAmount = document.getElementById("withdraw-amount");
const withdrawAvailableBalance = document.getElementById("withdraw-available-balance");
const withdrawCancelBtn = document.getElementById("withdraw-cancel-btn");
const withdrawCloseX = document.getElementById("withdraw-close-x");

const receiptModal = document.getElementById("receipt-modal");
const receiptCloseBtn = document.getElementById("receipt-close-btn");
const receiptAmountVal = document.getElementById("receipt-amount-val");
const receiptOpType = document.getElementById("receipt-op-type");
const receiptDateTime = document.getElementById("receipt-datetime");
const receiptId = document.getElementById("receipt-id");
const receiptSenderName = document.getElementById("receipt-sender-name");
const receiptDestRow = document.getElementById("receipt-dest-row");
const receiptDestName = document.getElementById("receipt-dest-name");

// Historial
const historyList = document.getElementById("history-list");
const historyEmptyState = document.getElementById("history-empty-state");
const txCountBadge = document.getElementById("tx-count");

// Notificaciones
const toastContainer = document.getElementById("toast-container");

// ==================== INICIALIZACIÓN DE DATOS ====================
function initData() {
    const storedAccounts = localStorage.getItem("gigabank_accounts");
    if (!storedAccounts) {
        localStorage.setItem("gigabank_accounts", JSON.stringify(DEFAULT_ACCOUNTS));
        accounts = [...DEFAULT_ACCOUNTS];
    } else {
        accounts = JSON.parse(storedAccounts);
    }

    const storedVisibility = localStorage.getItem("gigabank_balance_hidden");
    isBalanceHidden = storedVisibility === "true";

    // Verificar si hay sesión activa
    const activeSession = localStorage.getItem("gigabank_active_session");
    if (activeSession) {
        const user = accounts.find(acc => acc.username.toLowerCase() === activeSession.toLowerCase());
        if (user) {
            currentUser = user;
            showDashboard();
        } else {
            showLogin();
        }
    } else {
        showLogin();
    }
}

// Guardar datos en local storage
function saveAccountsToStorage() {
    localStorage.setItem("gigabank_accounts", JSON.stringify(accounts));
}

// ==================== ENRUTADOR / VISTAS ====================
function showLogin() {
    dashboardScreen.classList.remove("active");
    loginScreen.classList.add("active");
    loginForm.reset();
    loginPinInput.value = "";
    currentUser = null;
    localStorage.removeItem("gigabank_active_session");
}

function showDashboard() {
    loginScreen.classList.remove("active");
    dashboardScreen.classList.add("active");
    
    // Configurar información de la cuenta
    cardHolderName.textContent = currentUser.username.toUpperCase();
    creditCardNumber.textContent = currentUser.cardNumber || "4000 **** **** 8824";
    
    updateGreeting();
    updateBalanceDisplay();
    renderTransactions();
    
    // Guardar sesión activa
    localStorage.setItem("gigabank_active_session", currentUser.username);
}

// ==================== CONTROLADOR DE AUTENTICACIÓN ====================
function handleLogin() {
    const username = loginUsernameInput.value.trim().toLowerCase();
    const pin = loginPinInput.value;

    const user = accounts.find(acc => acc.username.toLowerCase() === username);

    if (!user) {
        showToast("Error de Acceso", "El usuario ingresado no existe en nuestro sistema.", "error");
        shakeLoginCard();
        return;
    }

    if (user.pin !== pin) {
        showToast("PIN Incorrecto", "La contraseña o PIN de seguridad no coincide.", "error");
        shakeLoginCard();
        // Limpiar PIN para nuevo intento
        loginPinInput.value = "";
        return;
    }

    // Login Exitoso
    currentUser = user;
    showToast("Acceso Autorizado", `Bienvenido de nuevo a GigaBank, ${currentUser.username}.`, "success");
    showDashboard();
}

function handleLogout() {
    showToast("Sesión Finalizada", "Ha cerrado su sesión de forma segura. ¡Vuelva pronto!", "success");
    showLogin();
}

function shakeLoginCard() {
    const card = document.querySelector(".login-card");
    card.style.animation = "none";
    card.offsetHeight; // trigger reflow
    card.style.animation = "shake 0.4s ease";
}

// Helper para rellenar credenciales en el demo
window.fillDemoCredentials = function(username, pin) {
    loginUsernameInput.value = username;
    loginPinInput.value = pin;
    
    // Pequeño efecto visual en los inputs al auto-completar
    loginUsernameInput.style.borderColor = "var(--primary)";
    loginPinInput.style.borderColor = "var(--primary)";
    setTimeout(() => {
        loginUsernameInput.style.borderColor = "";
        loginPinInput.style.borderColor = "";
    }, 1000);

    showToast("Demo", `Credenciales de ${username} cargadas.`, "success");
};

// ==================== INTERFAZ DEL TECLADO PIN ====================
let pinIsVisible = false;

// Manejar clics del teclado numérico
pinButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-value");
        if (val && loginPinInput.value.length < 4) {
            loginPinInput.value += val;
            playClickSound();
        }
    });
});

pinClearBtn.addEventListener("click", () => {
    loginPinInput.value = "";
    playClickSound();
});

pinBackspaceBtn.addEventListener("click", () => {
    loginPinInput.value = loginPinInput.value.slice(0, -1);
    playClickSound();
});

// Soporte de Teclado Físico
document.addEventListener("keydown", (e) => {
    // Si la pantalla de login no está activa, ignorar
    if (!loginScreen.classList.contains("active")) return;

    // Si el input activo es el de usuario, dejar que escriba normal
    if (document.activeElement === loginUsernameInput) {
        if (e.key === "Enter") {
            loginPinInput.focus();
        }
        return;
    }

    // Si presionan números, backspace o escape
    if (e.key >= "0" && e.key <= "9") {
        if (loginPinInput.value.length < 4) {
            loginPinInput.value += e.key;
            playClickSound();
        }
    } else if (e.key === "Backspace") {
        loginPinInput.value = loginPinInput.value.slice(0, -1);
        playClickSound();
    } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        loginPinInput.value = "";
        playClickSound();
    } else if (e.key === "Enter") {
        if (loginUsernameInput.value && loginPinInput.value.length === 4) {
            handleLogin();
        }
    }
});

// Cambiar visibilidad del PIN
togglePinBtn.addEventListener("click", () => {
    pinIsVisible = !pinIsVisible;
    if (pinIsVisible) {
        loginPinInput.type = "text";
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        loginPinInput.type = "password";
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
});

function playClickSound() {
    // Generar un micro pitido por software (Web Audio API)
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Hz
        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime); // volumen bajo
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05); // 50ms de sonido
    } catch (e) {
        // Ignorar si el navegador bloquea audio antes de interacción
    }
}

// ==================== EVENTOS Y ESTÉTICA DASHBOARD ====================
function updateGreeting() {
    const hours = new Date().getHours();
    let greet = "";
    
    if (hours >= 6 && hours < 12) {
        greet = "Buenos días";
    } else if (hours >= 12 && hours < 19) {
        greet = "Buenas tardes";
    } else {
        greet = "Buenas noches";
    }
    
    userGreeting.innerHTML = `${greet}, <span>${currentUser.username}</span>`;
    
    // Fecha local formateada
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('es-ES', options);
}

// Ocultar y mostrar saldo
toggleBalanceBtn.addEventListener("click", () => {
    isBalanceHidden = !isBalanceHidden;
    localStorage.setItem("gigabank_balance_hidden", isBalanceHidden);
    updateBalanceDisplay();
});

function updateBalanceDisplay() {
    if (isBalanceHidden) {
        balanceAmountEl.textContent = "••••••";
        balanceEyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        balanceAmountEl.textContent = formatCurrency(currentUser.balance);
        balanceEyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 2
    }).format(amount);
}

// ==================== RENDERS DE TRANSACCIONES ====================
function renderTransactions() {
    const txs = currentUser.transactions || [];
    txCountBadge.textContent = `${txs.length} mov`;

    if (txs.length === 0) {
        historyList.style.display = "none";
        historyEmptyState.style.display = "flex";
        return;
    }

    historyEmptyState.style.display = "none";
    historyList.style.display = "flex";
    historyList.innerHTML = "";

    // Renderizar ordenadas de más reciente a más antigua
    const sortedTxs = [...txs].reverse();

    sortedTxs.forEach(tx => {
        const li = document.createElement("li");
        li.className = "history-item";

        // Elegir clase e icono según operación
        let iconClass = "tx-icon-deposit";
        let iconSVG = `
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;
        let valSign = "+";
        let amountClass = "amount-positive";

        if (tx.type === "transferencia_enviada") {
            iconClass = "tx-icon-sent";
            iconSVG = `
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            `;
            valSign = "-";
            amountClass = "amount-negative";
        } else if (tx.type === "transferencia_recibida") {
            iconClass = "tx-icon-received";
            iconSVG = `
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="2" y1="22" x2="13" y2="11"></line>
                    <polygon points="2 22 9 2 13 11 22 15 2 22"></polygon>
                </svg>
            `;
            valSign = "+";
            amountClass = "amount-positive";
        } else if (tx.type === "retiro") {
            iconClass = "tx-icon-withdraw";
            iconSVG = `
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            `;
            valSign = "-";
            amountClass = "amount-negative";
        }

        // Formatear texto descriptivo
        let title = "Operación Bancaria";
        if (tx.type === "transferencia_enviada") {
            title = `Transferencia a ${tx.recipient}`;
        } else if (tx.type === "transferencia_recibida") {
            title = `De ${tx.sender}`;
        } else if (tx.type === "deposito") {
            title = "Depósito de Fondos";
        } else if (tx.type === "retiro") {
            title = "Retiro de Efectivo";
        }

        li.innerHTML = `
            <div class="tx-meta">
                <div class="tx-icon ${iconClass}">
                    ${iconSVG}
                </div>
                <div class="tx-details">
                    <h6>${title}</h6>
                    <p>${tx.date}</p>
                </div>
            </div>
            <div class="tx-amount ${amountClass}">
                ${valSign}${formatCurrency(tx.amount)}
            </div>
        `;
        historyList.appendChild(li);
    });
}

// ==================== APERTURA / CIERRE DE MODALES ====================
function openModal(modal) {
    modal.classList.add("active");
    
    // Configurar saldos dinámicos
    if (modal === transferModal) {
        transferAvailableBalance.textContent = formatCurrency(currentUser.balance);
        transferForm.reset();
        transferRecipientStatus.style.display = "none";
        transferRecipient.classList.remove("input-error", "input-success");
        setTimeout(() => transferRecipient.focus(), 150);
    } else if (modal === depositModal) {
        depositForm.reset();
        setTimeout(() => depositAmount.focus(), 150);
    } else if (modal === withdrawModal) {
        withdrawAvailableBalance.textContent = formatCurrency(currentUser.balance);
        withdrawForm.reset();
        setTimeout(() => withdrawAmount.focus(), 150);
    }
}

function closeModal(modal) {
    modal.classList.remove("active");
}

// Event Listeners Modales
actionTransferBtn.addEventListener("click", () => openModal(transferModal));
actionDepositBtn.addEventListener("click", () => openModal(depositModal));
actionWithdrawBtn.addEventListener("click", () => openModal(withdrawModal));

transferCancelBtn.addEventListener("click", () => closeModal(transferModal));
transferCloseX.addEventListener("click", () => closeModal(transferModal));

depositCancelBtn.addEventListener("click", () => closeModal(depositModal));
depositCloseX.addEventListener("click", () => closeModal(depositModal));

withdrawCancelBtn.addEventListener("click", () => closeModal(withdrawModal));
withdrawCloseX.addEventListener("click", () => closeModal(withdrawModal));

receiptCloseBtn.addEventListener("click", () => closeModal(receiptModal));

// Cerrar modales clickeando afuera del contenedor glass
window.addEventListener("click", (e) => {
    if (e.target === transferModal) closeModal(transferModal);
    if (e.target === depositModal) closeModal(depositModal);
    if (e.target === withdrawModal) closeModal(withdrawModal);
    if (e.target === receiptModal) closeModal(receiptModal);
});

// ==================== TRANSFERENCIAS ENTRE CUENTAS ====================
// Validación en tiempo real del destinatario
transferRecipient.addEventListener("input", () => {
    const val = transferRecipient.value.trim().toLowerCase();
    
    if (val === "") {
        transferRecipientStatus.style.display = "none";
        transferRecipient.className = "";
        return;
    }

    if (val === currentUser.username.toLowerCase()) {
        transferRecipientStatus.style.display = "flex";
        transferRecipientStatus.className = "recipient-validation-badge badge-invalid";
        transferRecipientStatus.textContent = "Eres tú";
        transferRecipient.className = "input-error";
        return;
    }

    const targetUser = accounts.find(acc => acc.username.toLowerCase() === val);
    
    if (targetUser) {
        transferRecipientStatus.style.display = "flex";
        transferRecipientStatus.className = "recipient-validation-badge badge-valid";
        transferRecipientStatus.textContent = "✓ Válido";
        transferRecipient.className = "input-success";
    } else {
        transferRecipientStatus.style.display = "flex";
        transferRecipientStatus.className = "recipient-validation-badge badge-invalid";
        transferRecipientStatus.textContent = "✕ Inexistente";
        transferRecipient.className = "input-error";
    }
});

// Submit de Transferencia
transferForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const recipientName = transferRecipient.value.trim().toLowerCase();
    const amount = parseFloat(transferAmount.value);
    
    // Validar destinatario
    if (recipientName === currentUser.username.toLowerCase()) {
        showToast("Error de Operación", "No puedes realizar transferencias a tu propia cuenta.", "error");
        return;
    }
    
    // Obtener cuenta destino
    const targetIndex = accounts.findIndex(acc => acc.username.toLowerCase() === recipientName);
    if (targetIndex === -1) {
        showToast("Destinatario Inválido", "La cuenta de destino ingresada no existe.", "error");
        return;
    }
    
    const targetUser = accounts[targetIndex];
    
    // Validar monto
    if (isNaN(amount) || amount <= 0) {
        showToast("Monto Incorrecto", "Por favor, ingrese un monto válido mayor a cero.", "error");
        return;
    }
    
    if (amount > currentUser.balance) {
        showToast("Saldo Insuficiente", "No dispone de fondos suficientes para completar esta transferencia.", "error");
        return;
    }
    
    // Ejecutar Transacción
    const dateStr = getFormattedDate();
    const transactionId = "TX-" + Math.floor(10000000 + Math.random() * 90000000);
    
    // Registrar en cuenta origen
    currentUser.transactions.push({
        id: transactionId,
        type: "transferencia_enviada",
        amount: amount,
        recipient: targetUser.username,
        date: dateStr
    });
    currentUser.balance -= amount;
    
    // Registrar en cuenta destino
    targetUser.transactions.push({
        id: transactionId,
        type: "transferencia_recibida",
        amount: amount,
        sender: currentUser.username,
        date: dateStr
    });
    targetUser.balance += amount;
    
    // Actualizar base de datos local y guardar
    const currentUserIndex = accounts.findIndex(acc => acc.username.toLowerCase() === currentUser.username.toLowerCase());
    accounts[currentUserIndex] = currentUser;
    accounts[targetIndex] = targetUser;
    
    saveAccountsToStorage();
    
    // Actualizar UI
    updateBalanceDisplay();
    renderTransactions();
    closeModal(transferModal);
    
    // Mostrar Recibo
    showReceipt({
        amount: amount,
        type: "Transferencia",
        date: dateStr,
        id: transactionId,
        sender: currentUser.username,
        recipient: targetUser.username
    });
    
    showToast("Operación Exitosa", `Se transfirieron ${formatCurrency(amount)} a la cuenta de ${targetUser.username}.`, "success");
});

// ==================== INGRESOS DE DINERO (DEPOSITOS) ====================
depositForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const amount = parseFloat(depositAmount.value);
    
    if (isNaN(amount) || amount <= 0) {
        showToast("Monto Incorrecto", "Por favor, ingrese un monto válido mayor a cero.", "error");
        return;
    }
    
    // Ejecutar Depósito
    const dateStr = getFormattedDate();
    const transactionId = "TX-" + Math.floor(10000000 + Math.random() * 90000000);
    
    currentUser.transactions.push({
        id: transactionId,
        type: "deposito",
        amount: amount,
        date: dateStr
    });
    currentUser.balance += amount;
    
    const currentUserIndex = accounts.findIndex(acc => acc.username.toLowerCase() === currentUser.username.toLowerCase());
    accounts[currentUserIndex] = currentUser;
    
    saveAccountsToStorage();
    
    updateBalanceDisplay();
    renderTransactions();
    closeModal(depositModal);
    
    showReceipt({
        amount: amount,
        type: "Depósito de Fondos",
        date: dateStr,
        id: transactionId,
        sender: currentUser.username,
        recipient: null
    });
    
    showToast("Depósito Exitoso", `Se han ingresado ${formatCurrency(amount)} a su cuenta de ahorros.`, "success");
});

// ==================== RETIRO DE EFECTIVO (WITHDRAWS) ====================
withdrawForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount.value);
    
    if (isNaN(amount) || amount <= 0) {
        showToast("Monto Incorrecto", "Por favor, ingrese un monto válido mayor a cero.", "error");
        return;
    }
    
    if (amount > currentUser.balance) {
        showToast("Saldo Insuficiente", "Su cuenta no posee los fondos solicitados para el retiro.", "error");
        return;
    }
    
    // Ejecutar Retiro
    const dateStr = getFormattedDate();
    const transactionId = "TX-" + Math.floor(10000000 + Math.random() * 90000000);
    
    currentUser.transactions.push({
        id: transactionId,
        type: "retiro",
        amount: amount,
        date: dateStr
    });
    currentUser.balance -= amount;
    
    const currentUserIndex = accounts.findIndex(acc => acc.username.toLowerCase() === currentUser.username.toLowerCase());
    accounts[currentUserIndex] = currentUser;
    
    saveAccountsToStorage();
    
    updateBalanceDisplay();
    renderTransactions();
    closeModal(withdrawModal);
    
    showReceipt({
        amount: amount,
        type: "Retiro de Efectivo",
        date: dateStr,
        id: transactionId,
        sender: currentUser.username,
        recipient: null
    });
    
    showToast("Retiro Exitoso", `Retiro procesado. Por favor, retire su efectivo de la bandeja.`, "success");
});

// ==================== GENERADOR DE COMPROBANTES ====================
function showReceipt(data) {
    receiptAmountVal.textContent = data.amount.toFixed(2);
    receiptOpType.textContent = data.type;
    receiptDateTime.textContent = data.date;
    receiptId.textContent = data.id;
    receiptSenderName.textContent = data.sender;
    
    if (data.recipient) {
        receiptDestRow.style.display = "flex";
        receiptDestName.textContent = data.recipient;
    } else {
        receiptDestRow.style.display = "none";
    }
    
    openModal(receiptModal);
}

// ==================== SISTEMA GLOBAL DE NOTIFICACIONES ====================
function showToast(title, message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    const icon = type === "success" 
        ? `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        
    toast.innerHTML = `
        <div class="toast-icon">
            ${icon}
        </div>
        <div class="toast-content">
            <h5 class="toast-title">${title}</h5>
            <p class="toast-msg">${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remover después de 4.5 segundos
    setTimeout(() => {
        toast.classList.add("toast-exit");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 4500);
}

// ==================== UTILERIAS ====================
function getFormattedDate() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Event Listeners Globales Iniciales
loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);

// Arrancar App
document.addEventListener("DOMContentLoaded", initData);
