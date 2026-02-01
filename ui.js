// ui.js - Interface do Usuário

// Configuração Tailwind (Cores e Animações)
tailwind.config = {
    darkMode: 'class',
    theme: { extend: {
        boxShadow: { 'soft': '0 10px 40px -10px rgba(0,0,0,0.08)' },
        animation: { 'up': 'slideUp 0.3s ease-out', 'fade': 'fadeIn 0.3s ease-out', 'pop': 'pop 0.3s' },
        keyframes: {
            slideUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
            fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
            pop: { '0%': { transform: 'scale(0.9)' }, '100%': { transform: 'scale(1)' } }
        }
    }}
};

document.addEventListener("DOMContentLoaded", () => {
    // Carrega Logo
    const img = document.getElementById('logo-loja');
    if(img && typeof CONFIG !== 'undefined') {
        img.src = CONFIG.logo;
        img.onerror = () => img.src = "https://via.placeholder.com/150";
    }
    
    // Injeta Elementos Globais
    if(!document.getElementById('toast-container')) {
        const tc=document.createElement('div'); tc.id='toast-container'; 
        tc.className='fixed top-16 inset-x-4 z-[110] flex flex-col gap-2 pointer-events-none'; 
        document.body.appendChild(tc);
    }
    
    // Footer
    if(!document.getElementById('app-footer') && typeof CONFIG !== 'undefined') {
        const f=document.createElement('footer');
        f.className="fixed bottom-2 w-full z-[50] flex justify-center pointer-events-none";
        f.innerHTML=`<div class="pointer-events-auto bg-white/90 dark:bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3"><span class="text-[8px] text-gray-400 font-bold uppercase">Dev</span><a href="${CONFIG.insta}" target="_blank" class="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold text-[10px]"><i class="fab fa-instagram"></i> ${CONFIG.dono}</a></div>`;
        document.body.appendChild(f);
    }

    initSystem();
});

function initSystem() {
    // Tema
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    
    // Enter Global
    document.querySelectorAll('input').forEach(i => i.addEventListener('keyup', e => {
        if(e.key === 'Enter') {
            e.preventDefault();
            const btn = document.getElementById('btn-login')||document.getElementById('btn-cadastro')||document.getElementById('btn-salvar');
            if(btn && !btn.disabled) btn.click();
        }
    }));
}

// Funções UI
window.alternarTema = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

window.mostrarToast = (msg, tipo='sucesso') => {
    const c=document.getElementById('toast-container'); if(!c)return;
    const d=document.createElement('div');
    const cor=tipo==='erro'?'bg-red-600':'bg-green-600';
    d.className=`${cor} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 w-full max-w-xs mx-auto pointer-events-auto animate-up`;
    d.innerHTML=`<span class="text-sm font-bold">${msg}</span>`;
    c.appendChild(d);
    if(navigator.vibrate) navigator.vibrate(tipo==='erro'?[50,50]:10);
    setTimeout(()=>d.remove(),3000);
};

window.abrirModalConfirmacao = (msg, cb) => { if(confirm(msg)) cb(); };