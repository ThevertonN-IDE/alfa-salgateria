// --- FUNÇÃO DE SEGURANÇA GLOBAL (Anti-XSS) ---
// Protege contra injeção de código em qualquer lugar do sistema
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- UTILITÁRIOS DE FORMATAÇÃO ---

function formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// --- SISTEMA DE NOTIFICAÇÃO (TOAST) SEGURO ---

function mostrarToast(mensagem, tipo = 'sucesso') {
    // Remove toast antigo se existir
    const existente = document.getElementById('toast-notification');
    if (existente) existente.remove();

    // Cria o elemento
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    
    // Define cores baseadas no tipo
    let cores = 'bg-gray-800 text-white'; // Padrão
    let icone = '<i class="fas fa-info-circle"></i>';

    if (tipo === 'sucesso') {
        cores = 'bg-green-600 text-white';
        icone = '<i class="fas fa-check-circle"></i>';
    } else if (tipo === 'erro') {
        cores = 'bg-red-600 text-white';
        icone = '<i class="fas fa-exclamation-circle"></i>';
    } else if (tipo === 'info') {
        cores = 'bg-blue-600 text-white';
        icone = '<i class="fas fa-info-circle"></i>';
    }

    // Estilização (Tailwind)
    toast.className = `fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold transition-all duration-500 translate-y-[-150%] ${cores}`;
    
    // INSERÇÃO SEGURA: Usamos innerHTML apenas para o ícone fixo,
    // mas a mensagem do usuário é inserida como TEXTO puro (innerText).
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = icone;
    
    const msgSpan = document.createElement('span');
    msgSpan.innerText = mensagem; // <--- AQUI ESTÁ A SEGURANÇA (Não executa HTML)

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);

    document.body.appendChild(toast);

    // Animação de Entrada
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-150%]');
    });

    // Som de notificação (sutil)
    if (navigator.vibrate) navigator.vibrate(50);

    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.add('translate-y-[-150%]', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// --- VERIFICAÇÃO DE CONEXÃO ---

function checkOnline() {
    if (!navigator.onLine) {
        mostrarToast("Sem conexão com a internet!", "erro");
        return false;
    }
    return true;
}

// --- TIMER PIX (Opcional, se usado no carrinho) ---
let pixInterval;
function iniciarTimerPix(elementId, durationInMinutes) {
    const display = document.getElementById(elementId);
    if (!display) return;
    
    let timer = durationInMinutes * 60;
    clearInterval(pixInterval);
    
    pixInterval = setInterval(function () {
        const minutes = parseInt(timer / 60, 10);
        const seconds = parseInt(timer % 60, 10);

        display.textContent = (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);

        if (--timer < 0) {
            clearInterval(pixInterval);
            display.textContent = "EXPIRADO";
            display.classList.add('text-red-500');
        }
    }, 1000);
}