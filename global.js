// global.js - O Cérebro Central da Alfa Salgateria

// 1. CONFIGURAÇÃO DO TAILWIND (Visual e Animações)
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0,0,0,0.05)',
                'up': '0 -4px 20px -2px rgba(0,0,0,0.05)'
            },
            animation: {
                'up': 'slideUp 0.3s ease-out',
                'fade': 'fadeIn 0.3s ease-out',
                'pop': 'pop 0.3s ease-out',
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            },
            keyframes: {
                slideUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
                fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                pop: { '0%': { transform: 'scale(0.95)' }, '100%': { transform: 'scale(1)' } }
            }
        }
    }
};

// 2. INICIALIZAÇÃO DO SUPABASE (Banco de Dados)
const SUPABASE_URL = 'https://zpdpscjjxqkbuhesdtyq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3uaoU1fmUEKBrDmbhnk0qw_j3hsPk06';
// Disponibiliza o cliente globalmente
window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. AUTO-INJEÇÃO DE ELEMENTOS DE UI (Toasts e Banner Offline)
document.addEventListener("DOMContentLoaded", () => {
    // Injeta o container de notificações
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 inset-x-4 z-[99] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(toastContainer);
    }

    // Injeta o Banner Offline
    if (!document.getElementById('offline-banner')) {
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-2 z-[100] shadow-md transition-transform duration-300 -translate-y-full';
        banner.innerHTML = '<i class="fas fa-wifi-slash mr-2"></i> Sem conexão com a internet.';
        document.body.appendChild(banner);
    }

    // Inicia verificações automáticas
    initSystem();
});

// 4. FUNÇÕES GLOBAIS DE SISTEMA
function initSystem() {
    // Carrega Tema (Dark/Light)
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        atualizarIconeTema(true);
    } else {
        document.documentElement.classList.remove('dark');
        atualizarIconeTema(false);
    }

    // Monitoramento de Rede
    window.addEventListener('online', atualizarStatusRede);
    window.addEventListener('offline', atualizarStatusRede);
    atualizarStatusRede();

    // Listener para Tecla ENTER (Acessibilidade e Rapidez)
    // Procura qualquer input e se der Enter, clica no botão principal da tela
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                // Tenta achar botões comuns de ação
                const btn = document.getElementById('btn-login') || 
                            document.getElementById('btn-cadastro') || 
                            document.getElementById('btn-salvar') ||
                            document.getElementById('btn-salvar-cat');
                if (btn && !btn.disabled && !btn.classList.contains('hidden')) btn.click();
            }
        });
    });
}

function atualizarIconeTema(isDark) {
    const icon = document.getElementById('icone-tema');
    if (icon) icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

function alternarTema() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    atualizarIconeTema(isDark);
}

function atualizarStatusRede() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
        if (navigator.onLine) banner.classList.remove('translate-y-0');
        else banner.classList.add('translate-y-0');
    }
}

// 5. FUNÇÕES DE UX (Feedback e Segurança)
function checkOnline() {
    if (!navigator.onLine) {
        mostrarToast("Sem conexão com a internet!", "erro");
        return false;
    }
    return true;
}

function vibrar(tipo = 'leve') {
    if (navigator.vibrate) {
        tipo === 'erro' ? navigator.vibrate([50, 50, 50]) : navigator.vibrate(15);
    }
}

function mostrarToast(msg, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const cor = tipo === 'erro' ? 'bg-red-600' : 'bg-green-600';
    
    toast.className = `${cor} text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 w-full max-w-md mx-auto pointer-events-auto animate-up`;
    toast.innerHTML = `
        <i class="fas ${tipo === 'erro' ? 'fa-exclamation-circle' : 'fa-check-circle'} text-lg"></i> 
        <span class="text-sm font-bold flex-grow">${msg}</span>
    `;
    
    container.appendChild(toast);
    vibrar(tipo === 'erro' ? 'erro' : 'leve');

    // Remove após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 6. FUNÇÃO DE MODAL GLOBAL (Usada no admin e index)
window.abrirModalConfirmacao = function(msg, callbackConfirmar) {
    // Cria o modal dinamicamente se não existir
    let modal = document.getElementById('modal-global');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-global';
        modal.className = 'fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-6 backdrop-blur-sm animate-fade';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
                <div class="bg-red-50 dark:bg-red-900/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500 text-xl"><i class="fas fa-exclamation-triangle"></i></div>
                <h3 class="text-xl font-black text-gray-800 dark:text-white text-center mb-2">Tem certeza?</h3>
                <p id="modal-global-msg" class="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">Essa ação é irreversível.</p>
                <div class="flex gap-3">
                    <button id="btn-modal-cancel" class="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 transition">CANCELAR</button>
                    <button id="btn-modal-confirm" class="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg active:scale-95 transition">CONFIRMAR</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }

    const txt = document.getElementById('modal-global-msg');
    const btnConfirm = document.getElementById('btn-modal-confirm');
    const btnCancel = document.getElementById('btn-modal-cancel');

    txt.innerText = msg;
    modal.classList.remove('hidden');

    // Clone para limpar eventos antigos
    const novoBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(novoBtn, btnConfirm);

    novoBtn.onclick = async () => {
        if(!checkOnline()) return;
        novoBtn.innerText = "...";
        novoBtn.disabled = true;
        await callbackConfirmar();
        modal.classList.add('hidden');
        novoBtn.innerText = "CONFIRMAR";
        novoBtn.disabled = false;
    };

    btnCancel.onclick = () => modal.classList.add('hidden');
    vibrar('erro');
};