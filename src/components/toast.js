// /src/components/toast.js

export function mostrarToast(msg, tipo = 'success') {
    const container = document.getElementById('alfa-toast-container');
    if (!container) {
        console.warn('[UI] Contêiner de Toast não encontrado.');
        return;
    }

    const toast = document.createElement('div');
    
    // Mapeamento O(1) de Dicionário para classes Tailwind
    const styles = {
        'success': { bg: 'bg-green-500', icon: 'fa-check-circle' },
        'error': { bg: 'bg-red-500', icon: 'fa-exclamation-circle' },
        'warning': { bg: 'bg-orange-500', icon: 'fa-exclamation-triangle' },
        'info': { bg: 'bg-blue-500', icon: 'fa-info-circle' }
    };
    
    const config = styles[tipo] || styles['info'];

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-bold animate-up ${config.bg} mb-2 pointer-events-auto`;
    
    // 1. Injeção Estrutural Segura
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = `<i class="fas ${config.icon}"></i>`;
    
    // 2. 🛡️ BLINDAGEM XSS: A mensagem NUNCA é lida como HTML
    const textSpan = document.createElement('span');
    textSpan.textContent = msg;

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    
    container.appendChild(toast);

    // Gestão de Memória: Garbage Collection após 3 segundos
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}