// ============================================================================
// GLOBAL.JS - VERSÃO FINAL SEGURA
// ============================================================================

const DEV_CONFIG = {
    nome: "Theverton",
    insta: "https://instagram.com/seu_instagram",
    // Link corrigido manualmente (Espaços viraram %20)
    logo: "https://zpdpscjjxqkbuhesdtyq.supabase.co/storage/v1/object/public/assets/WhatsApp%20Image%202026-01-31%20at%2011.18.35.jpeg",
    pixKey: "84987371966"
};

// Configuração Visual
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            boxShadow: { 'soft': '0 4px 20px -2px rgba(0,0,0,0.05)' },
            animation: { 'fade': 'fadeIn 0.3s ease-out', 'up': 'slideUp 0.3s ease-out' },
            keyframes: {
                fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                slideUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } }
            }
        }
    }
};

// Banco de Dados
const SUPABASE_URL = 'https://zpdpscjjxqkbuhesdtyq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3uaoU1fmUEKBrDmbhnk0qw_j3hsPk06';
if(typeof supabase !== 'undefined') window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Pix CRC16
class PixPayload {
    constructor(k,n,c,v,i='ALFA'){this.k=k;this.n=this.cl(n,25);this.c=this.cl(c,15);this.v=v.toFixed(2);this.i=i;}
    cl(t,m){return t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").substring(0,m).toUpperCase();}
    pad(id,v){return id+v.toString().length.toString().padStart(2,'0')+v;}
    crc(s){let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++)c=(c&0x8000)?(c<<1)^0x1021:c<<1;}return(c&0xFFFF).toString(16).toUpperCase().padStart(4,'0');}
    gen(){let p=this.pad('00','01')+this.pad('26',this.pad('00','br.gov.bcb.pix')+this.pad('01',this.k))+this.pad('52','0000')+this.pad('53','986')+this.pad('54',this.v)+this.pad('58','BR')+this.pad('59',this.n)+this.pad('60',this.c)+this.pad('62',this.pad('05',this.i));return p+'6304'+this.crc(p+'6304');}
}
window.gerarPix=(v)=>new PixPayload(DEV_CONFIG.pixKey,"ALFA SALGATERIA","CURRAIS NOVOS",v).gen();

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    // 1. Logo
    const img = document.getElementById('logo-loja');
    if(img) {
        img.src = DEV_CONFIG.logo;
        img.onerror = () => { img.src = "https://via.placeholder.com/150/ea580c/ffffff?text=ALFA"; };
    }

    // 2. Elementos UI
    if(!document.getElementById('toast-container')) {
        const tc=document.createElement('div'); tc.id='toast-container'; tc.className='fixed top-4 inset-x-4 z-[110] flex flex-col gap-2 pointer-events-none'; document.body.appendChild(tc);
    }
    
    // 3. Footer
    if(!document.getElementById('app-footer')) {
        const f=document.createElement('footer');
        f.id='app-footer';
        // Z-Index alto, fixado embaixo, não bloqueia cliques
        f.className="fixed bottom-2 w-full z-[100] flex justify-center pointer-events-none";
        f.innerHTML=`<div class="pointer-events-auto bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-3"><span class="text-[8px] text-gray-400 font-bold uppercase">Dev</span><a href="${DEV_CONFIG.insta}" target="_blank" class="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold text-[10px]"><i class="fab fa-instagram"></i> ${DEV_CONFIG.nome}</a><span class="text-gray-300">|</span><a href="login.html" class="text-gray-400 hover:text-orange-500 transition"><i class="fas fa-lock text-[10px]"></i></a></div>`;
        document.body.appendChild(f);
    }

    // 4. Tema
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark'); attIcon(true);
    }

    // 5. Enter Global
    document.querySelectorAll('input').forEach(i => i.addEventListener('keyup', e => {
        if (e.key === 'Enter') {
            const btn = document.getElementById('btn-login')||document.getElementById('btn-cadastro')||document.getElementById('btn-salvar')||document.getElementById('btn-salvar-cat');
            if(btn && !btn.disabled && !btn.classList.contains('hidden')) btn.click();
        }
    }));
});

// Helpers
function attIcon(d){const i=document.getElementById('icone-tema'); if(i) i.className=d?"fas fa-sun":"fas fa-moon";}
window.alternarTema=()=>{document.documentElement.classList.toggle('dark'); const d=document.documentElement.classList.contains('dark'); localStorage.theme=d?'dark':'light'; attIcon(d);}

// Segurança de Rede (Não bloqueia mais navegação, só ações)
window.checkOnline=()=>{
    if(!navigator.onLine){ window.mostrarToast("Sem internet!","erro"); return false; }
    return true;
}

window.mostrarToast=(m,t='sucesso')=>{
    const c=document.getElementById('toast-container'); if(!c)return;
    const d=document.createElement('div'); 
    d.className=`${t==='erro'?'bg-red-600':'bg-green-600'} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 w-full max-w-xs mx-auto pointer-events-auto animate-fade`;
    d.innerHTML=`<i class="fas ${t==='erro'?'fa-exclamation':'fa-check'}"></i> <span class="text-sm font-bold">${m}</span>`;
    c.appendChild(d); setTimeout(()=>{d.remove()},3000);
}

window.abrirModalConfirmacao=(m,cb)=>{
    if(confirm(m)) cb(); // Voltamos ao nativo para garantir 100% de funcionamento sem bugar CSS
};