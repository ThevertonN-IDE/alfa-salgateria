// ============================================================================
// GLOBAL.JS - O CÉREBRO DA ALFA SALGATERIA
// Responsável por: Banco de Dados, UI, Pix, Segurança e Formatações
// ============================================================================

// 1. CONFIGURAÇÃO VISUAL (TAILWIND EXTENDIDO)
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            boxShadow: { 'soft': '0 4px 20px -2px rgba(0,0,0,0.05)' },
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

// 2. INICIALIZAÇÃO DO BANCO DE DADOS (SUPABASE)
const SUPABASE_URL = 'https://zpdpscjjxqkbuhesdtyq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3uaoU1fmUEKBrDmbhnk0qw_j3hsPk06';
window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// 3. MÓDULO PIX (GERADOR DE PAYLOAD CRC16)
// ============================================================================
class PixPayload {
    constructor(chave, nome, cidade, valor, txtId = 'ALFAPEDIDO') {
        this.chave = chave;
        this.nome = this.limparTexto(nome, 25);
        this.cidade = this.limparTexto(cidade, 15);
        this.valor = valor.toFixed(2);
        this.txtId = txtId;
    }

    // Remove acentos e caracteres especiais para o padrão bancário
    limparTexto(txt, max) {
        return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, max).toUpperCase();
    }

    // Formata os campos no padrão ID + Tamanho + Valor
    formatar(id, valor) {
        const valStr = valor.toString();
        return id + valStr.length.toString().padStart(2, '0') + valStr;
    }

    // Algoritmo CRC16-CCITT (Obrigatório pelo Banco Central)
    crc16(str) {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
                else crc = crc << 1;
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }

    // Monta o "Embrulho" final do código
    gerarPayload() {
        let payload = 
            this.formatar('00', '01') + // Versão do Payload
            this.formatar('26', // Dados da Conta
                this.formatar('00', 'br.gov.bcb.pix') +
                this.formatar('01', this.chave)
            ) +
            this.formatar('52', '0000') + // Categoria (Merchant)
            this.formatar('53', '986') +  // Moeda (Real)
            this.formatar('54', this.valor) + // Valor
            this.formatar('58', 'BR') + // País
            this.formatar('59', this.nome) + // Nome do Recebedor
            this.formatar('60', this.cidade) + // Cidade
            this.formatar('62', this.formatar('05', this.txtId)); // ID da Transação

        payload += '6304'; // Adiciona o ID do CRC
        payload += this.crc16(payload); // Calcula e anexa o código verificador
        return payload;
    }
}

// Função pública para usar no HTML
window.gerarPixCopiaCola = (chave, nome, cidade, valor) => {
    try {
        const pix = new PixPayload(chave, nome, cidade, valor);
        return pix.gerarPayload();
    } catch (e) {
        console.error("Erro ao gerar Pix:", e);
        return "Erro ao gerar código Pix. Use a chave manual.";
    }
};

// ============================================================================
// 4. UTILITÁRIOS GLOBAIS (Formatação e Lógica)
// ============================================================================

// Formata dinheiro (Ex: 10.5 -> R$ 10,50)
window.formatMoney = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Formata Data (Ex: 2026-01-31T10:00 -> 31/01/2026 10:00)
window.formatDate = (dataISO) => {
    if (!dataISO) return '--/--/----';
    const d = new Date(dataISO);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
};

// Vibração Tátil (Feedback para celular)
window.vibrar = (tipo = 'leve') => {
    if (navigator.vibrate) {
        tipo === 'erro' ? navigator.vibrate([50, 50, 50]) : navigator.vibrate(15);
    }
};

// Verifica Conexão
window.checkOnline = () => {
    if (!navigator.onLine) {
        window.mostrarToast("Sem conexão com a internet!", "erro");
        return false;
    }
    return true;
};

// ============================================================================
// 5. UI & SISTEMA (Inicialização Automática)
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Injeta Container de Toasts (Notificações)
    if (!document.getElementById('toast-container')) {
        const tc = document.createElement('div'); 
        tc.id = 'toast-container'; 
        tc.className = 'fixed top-4 inset-x-4 z-[99] flex flex-col gap-2 pointer-events-none'; 
        document.body.appendChild(tc);
    }

    // 2. Injeta Faixa Vermelha Offline
    if (!document.getElementById('offline-banner')) {
        const b = document.createElement('div'); 
        b.id = 'offline-banner'; 
        b.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-2 z-[100] shadow-md transition-transform duration-300 -translate-y-full'; 
        b.innerHTML = '<i class="fas fa-wifi-slash mr-2"></i> Você está offline. Alguns recursos podem não funcionar.'; 
        document.body.appendChild(b);
    }

    initSystem();
});

function initSystem() {
    // Carrega Tema Salvo
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark'); attIcon(true);
    } else { 
        document.documentElement.classList.remove('dark'); attIcon(false); 
    }
    
    // Listeners de Rede
    window.addEventListener('online', ()=>updNet(true)); 
    window.addEventListener('offline', ()=>updNet(false)); 
    updNet(navigator.onLine);
    
    // Listener Global de Tecla ENTER (Acessibilidade)
    document.querySelectorAll('input').forEach(i => i.addEventListener('keyup', e => {
        if (e.key === 'Enter') {
            const btn = document.getElementById('btn-login') || document.getElementById('btn-cadastro') || document.getElementById('btn-salvar');
            if(btn && !btn.disabled) btn.click();
        }
    }));
}

// Helpers internos de UI
function updNet(online){ 
    const b=document.getElementById('offline-banner'); 
    if(b) online ? b.classList.remove('translate-y-0') : b.classList.add('translate-y-0'); 
}

function attIcon(isDark){
    const i=document.getElementById('icone-tema'); 
    if(i) i.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

window.alternarTema = () => {
    document.documentElement.classList.toggle('dark'); 
    const d = document.documentElement.classList.contains('dark'); 
    localStorage.theme = d ? 'dark' : 'light'; 
    attIcon(d);
};

// Sistema de Notificação (Toast)
window.mostrarToast = (msg, tipo='sucesso') => {
    const c=document.getElementById('toast-container'); if(!c)return;
    const t=document.createElement('div'); 
    const cor=tipo==='erro'?'bg-red-600':'bg-green-600';
    
    t.className=`${cor} text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 w-full max-w-md mx-auto pointer-events-auto animate-up`;
    t.innerHTML=`<i class="fas ${tipo==='erro'?'fa-times-circle':'fa-check-circle'} text-lg"></i><span class="text-sm font-bold flex-grow">${msg}</span>`;
    
    c.appendChild(t); 
    vibrar(tipo==='erro'?'erro':'leve');
    
    setTimeout(()=>{
        t.style.opacity='0'; 
        t.style.transform='translateY(-20px)'; 
        setTimeout(()=>t.remove(),300);
    }, 3000);
};

// Sistema de Modal Global (Confirmação)
window.abrirModalConfirmacao = function(msg, cb) {
    let m = document.getElementById('modal-global');
    // Cria se não existir
    if (!m) {
        m = document.createElement('div'); m.id = 'modal-global';
        m.className = 'fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-6 backdrop-blur-sm animate-fade';
        m.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
                <div class="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl"><i class="fas fa-question"></i></div>
                <h3 class="text-xl font-black text-gray-800 dark:text-white text-center mb-2">Confirmação</h3>
                <p id="mod-msg" class="text-gray-500 dark:text-gray-400 text-center text-sm mb-6 leading-relaxed"></p>
                <div class="flex gap-3">
                    <button id="mod-c" class="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 transition">NÃO</button>
                    <button id="mod-y" class="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-600 shadow-lg hover:bg-red-700 transition">SIM</button>
                </div>
            </div>`;
        document.body.appendChild(m);
    }
    
    document.getElementById('mod-msg').innerText = msg;
    m.classList.remove('hidden');
    
    const by = document.getElementById('mod-y'), bc = document.getElementById('mod-c');
    // Clona para limpar eventos anteriores
    const ny = by.cloneNode(true); by.parentNode.replaceChild(ny, by);
    
    ny.onclick = async () => { 
        if(!window.checkOnline()) return; 
        ny.innerText="AGUARDE..."; ny.disabled=true; 
        await cb(); 
        m.classList.add('hidden'); 
        ny.innerText="SIM"; ny.disabled=false; 
    };
    
    bc.onclick = () => m.classList.add('hidden');
    window.vibrar('erro');
};