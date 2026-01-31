// ============================================================================
// GLOBAL.JS - MOTOR VISUAL E LÓGICO DA ALFA SALGATERIA
// ============================================================================

// 1. CONFIGURAÇÕES DO DONO (Edite aqui)
const DEV_CONFIG = {
    nomeDesenvolvedor: "Theverton",
    instagramDesenvolvedor: "https://instagram.com/seu_instagram",
    // Link do logo tratado para evitar erros
    logoLoja: "https://zpdpscjjxqkbuhesdtyq.supabase.co/storage/v1/object/public/assets/WhatsApp%20Image%202026-01-31%20at%2011.18.35.jpeg",
    chavePix: "84987371966"
};

// 2. CONFIGURAÇÃO DE UX/UI (Tailwind Personalizado)
// Aqui definimos as sombras, animações e cores que dão o ar "Premium"
tailwind.config = {
    darkMode: 'class', // Ativa modo escuro via classe 'dark'
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    500: '#f97316', // Orange-500
                    600: '#ea580c', // Orange-600 (Cor Principal)
                    900: '#7c2d12',
                }
            },
            fontFamily: {
                sans: ['Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 10px 40px -10px rgba(0,0,0,0.08)', // Sombra suave dos cards
                'up': '0 -4px 20px -5px rgba(0,0,0,0.1)',     // Sombra da barra inferior
                'glow': '0 0 15px rgba(234, 88, 12, 0.3)'      // Brilho laranja
            },
            animation: {
                'up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'down': 'slideDown 0.3s ease-out',
                'fade': 'fadeIn 0.4s ease-out',
                'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Efeito elástico
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            },
            keyframes: {
                slideUp: { '0%': { transform: 'translateY(100%)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
                slideDown: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(0)' } },
                fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                pop: { '0%': { transform: 'scale(0.9)' }, '100%': { transform: 'scale(1)' } }
            }
        }
    }
};

// 3. INICIALIZAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://zpdpscjjxqkbuhesdtyq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3uaoU1fmUEKBrDmbhnk0qw_j3hsPk06';
if (typeof supabase !== 'undefined') {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error("ERRO: Adicione o script do Supabase no HTML antes do global.js");
}

// 4. SISTEMA DE PIX (CRC16)
class PixPayload {
    constructor(k, n, c, v, i = 'ALFAPEDIDO') {
        this.k = k; this.n = this.clean(n, 25); this.c = this.clean(c, 15); this.v = v.toFixed(2); this.i = i;
    }
    clean(t, m) { return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, m).toUpperCase(); }
    pad(id, v) { return id + v.toString().length.toString().padStart(2, '0') + v; }
    crc(s) {
        let c = 0xFFFF;
        for (let i = 0; i < s.length; i++) {
            c ^= s.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) c = (c & 0x8000) ? (c << 1) ^ 0x1021 : c << 1;
        }
        return (c & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }
    gen() {
        let p = this.pad('00', '01') + this.pad('26', this.pad('00', 'br.gov.bcb.pix') + this.pad('01', this.k)) + this.pad('52', '0000') + this.pad('53', '986') + this.pad('54', this.v) + this.pad('58', 'BR') + this.pad('59', this.n) + this.pad('60', this.c) + this.pad('62', this.pad('05', this.i));
        return p + '6304' + this.crc(p + '6304');
    }
}
window.gerarPix = (valor) => new PixPayload(DEV_CONFIG.pixKey, "ALFA SALGATERIA", "CURRAIS NOVOS", valor).gen();

// 5. INICIALIZADOR DE INTERFACE (Auto-Executável)
document.addEventListener("DOMContentLoaded", () => {
    
    // A. Carrega Logo com Fallback
    const logoEl = document.getElementById('logo-loja');
    if (logoEl) {
        logoEl.src = DEV_CONFIG.logoLoja;
        logoEl.onerror = () => { logoEl.src = "https://via.placeholder.com/150/ea580c/ffffff?text=ALFA"; };
    }

    // B. Injeta Notificações (Toasts)
    if (!document.getElementById('toast-container')) {
        const tc = document.createElement('div'); tc.id = 'toast-container'; 
        tc.className = 'fixed top-16 inset-x-4 z-[110] flex flex-col gap-2 pointer-events-none'; 
        document.body.appendChild(tc);
    }

    // C. Injeta Banner Offline
    if (!document.getElementById('offline-banner')) {
        const ban = document.createElement('div'); ban.id = 'offline-banner';
        ban.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold text-center py-1 z-[120] transition-transform duration-300 -translate-y-full shadow-md';
        ban.innerHTML = '<i class="fas fa-wifi-slash mr-1"></i> Você está offline.';
        document.body.appendChild(ban);
    }

    // D. Injeta Footer (Créditos)
    injectFooter();

    // E. Inicializa Lógica de Sistema
    initSystemLogic();
});

// 6. LÓGICA DO SISTEMA
function initSystemLogic() {
    // Tema (Dark/Light) com Persistência
    const savedTheme = localStorage.theme;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon(false);
    }

    // Monitor de Rede
    window.addEventListener('online', () => updateNetStatus(true));
    window.addEventListener('offline', () => updateNetStatus(false));
    if (!navigator.onLine) updateNetStatus(false);

    // Tecla Enter Global (Acessibilidade)
    document.querySelectorAll('input').forEach(i => i.addEventListener('keyup', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Procura botões comuns de ação
            const btn = document.getElementById('btn-login') || 
                        document.getElementById('btn-cadastro') || 
                        document.getElementById('btn-salvar') || 
                        document.getElementById('btn-salvar-cat');
            if (btn && !btn.disabled && !btn.classList.contains('hidden')) btn.click();
        }
    }));
}

// 7. FUNÇÕES AUXILIARES DE UI
function updateThemeIcon(isDark) {
    const icon = document.getElementById('icone-tema');
    if (icon) icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

function updateNetStatus(online) {
    const b = document.getElementById('offline-banner');
    if (b) online ? b.classList.remove('translate-y-0') : b.classList.add('translate-y-0');
}

function injectFooter() {
    if (document.getElementById('app-footer')) return;
    const f = document.createElement('footer');
    f.id = 'app-footer';
    // Estilo "Cápsula Flutuante" no rodapé
    f.className = "fixed bottom-2 w-full z-[50] flex justify-center pointer-events-none";
    f.innerHTML = `
        <div class="pointer-events-auto bg-white/80 dark:bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full shadow-soft border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-opacity hover:opacity-100 opacity-70">
            <span class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Dev</span>
            <a href="${DEV_CONFIG.instagramDesenvolvedor}" target="_blank" class="flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:scale-105 transition font-bold text-[10px]">
                <i class="fab fa-instagram"></i> ${DEV_CONFIG.nomeDesenvolvedor}
            </a>
            <span class="text-gray-300 dark:text-gray-700 text-[10px]">|</span>
            <a href="login.html" class="text-gray-400 hover:text-orange-500 dark:hover:text-white transition" title="Admin">
                <i class="fas fa-lock text-[10px]"></i>
            </a>
        </div>`;
    document.body.appendChild(f);
}

// 8. API PÚBLICA (Funções usadas nos HTMLs)

// Alternar Tema
window.alternarTema = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    updateThemeIcon(isDark);
    window.vibrar();
};

// Checar Online (Não bloqueia, apenas avisa)
window.checkOnline = () => {
    if (!navigator.onLine) {
        window.mostrarToast("Sem internet! Verifique sua conexão.", "erro");
        return false;
    }
    return true;
};

// Vibração Tátil
window.vibrar = (tipo = 'leve') => {
    if (navigator.vibrate) tipo === 'erro' ? navigator.vibrate([50, 50, 50]) : navigator.vibrate(15);
};

// Notificações (Toast)
window.mostrarToast = (msg, tipo = 'sucesso') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    // Cores mais vivas para UX
    const bg = tipo === 'erro' ? 'bg-red-500' : 'bg-green-600';
    const icon = tipo === 'erro' ? 'fa-exclamation-circle' : 'fa-check-circle';

    toast.className = `${bg} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 w-full max-w-xs mx-auto pointer-events-auto animate-up backdrop-blur-sm`;
    toast.innerHTML = `<i class="fas ${icon} text-lg"></i> <span class="text-sm font-bold leading-tight flex-grow">${msg}</span>`;
    
    container.appendChild(toast);
    window.vibrar(tipo === 'erro' ? 'erro' : 'leve');

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Modal de Confirmação (Nativo para máxima compatibilidade)
window.abrirModalConfirmacao = (msg, callback) => {
    if (confirm(msg)) {
        if(window.checkOnline()) callback();
    }
};

// Formata Moeda (R$)
window.formatMoney = (value) => {
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};