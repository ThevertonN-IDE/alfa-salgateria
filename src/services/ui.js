// /src/services/ui.js

export const ui = {
    // --- Estado do Toast ---
    _toastQueue: [],
    _isToastActive: false,
    
    // --- Estado do Loader ---
    _loaderCount: 0,
    _loaderNode: null, // Singleton de memória para alta performance

    // ==========================================
    // 1. GERENCIADOR DE TOASTS (Fila Assíncrona)
    // ==========================================
    showToast(message, type = 'info') {
        this._toastQueue.push({ message, type });
        if (!this._isToastActive) {
            this._processToastQueue();
        }

        // Feedback Tátil (Apenas em dispositivos móveis compatíveis)
        if (type === 'error' && typeof navigator.vibrate === 'function') {
            navigator.vibrate([50, 50, 50]); // Padrão de erro: 3 vibrações curtas
        } else if (type === 'success' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(50); // Padrão sucesso: 1 vibração curta
        }
    },

    async _processToastQueue() {
        if (this._toastQueue.length === 0) {
            this._isToastActive = false;
            return;
        }

        this._isToastActive = true;
        const { message, type } = this._toastQueue.shift();

        await this._renderToast(message, type);
        this._processToastQueue(); // Processa recursivamente o próximo da fila
    },

    _renderToast(message, type) {
        return new Promise((resolve) => {
            // Garante que o container "pai" dos toasts existe
            let container = document.getElementById('alfa-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'alfa-toast-container';
                container.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            const bgColors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                info: 'bg-slate-800 dark:bg-slate-700'
            };

            toast.className = `${bgColors[type] || bgColors.info} text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300 ease-out text-sm font-medium`;
            toast.innerHTML = `<span>${message}</span>`;

            container.appendChild(toast);

            // Animação de Entrada (Forçando o reflow com requestAnimationFrame)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    toast.classList.remove('translate-y-10', 'opacity-0');
                });
            });

            // Animação de Saída e destruição do nó específico
            setTimeout(() => {
                toast.classList.add('translate-y-10', 'opacity-0');
                toast.addEventListener('transitionend', () => {
                    toast.remove();
                    resolve(); // Libera a Promise para processar o próximo toast da fila
                }, { once: true });
            }, 3000); // Fica na tela por 3 segundos
        });
    },

    // ==========================================
    // 2. GERENCIADOR DE CARREGAMENTO GLOBAL
    // ==========================================
    showLoader() {
        this._loaderCount++;
        
        if (!this._loaderNode) {
            // 🌟 DOM SINGLETON: Cria apenas na primeira vez que for chamado
            this._loaderNode = document.createElement('div');
            this._loaderNode.className = 'fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-[9998] flex items-center justify-center transition-opacity duration-300 opacity-0 pointer-events-none';
            
            this._loaderNode.innerHTML = `
                <div class="relative flex items-center justify-center">
                    <div class="absolute w-16 h-16 border-4 border-[rgb(var(--primary-rgb))] border-t-transparent rounded-full animate-spin"></div>
                    <img src="/assets/default-logo.png" id="singleton-loader-img" class="w-10 h-10 rounded-full object-cover">
                </div>
            `;
            document.body.appendChild(this._loaderNode);
        }

        // Atualiza a logo dinamicamente sempre que abrir, buscando do cache do motor camaleão
        const cachedLogo = localStorage.getItem(`tema_logo_${localStorage.getItem('loja_atual_id')}`);
        if(cachedLogo) {
            const imgElement = document.getElementById('singleton-loader-img');
            if(imgElement) imgElement.src = cachedLogo;
        }

        // Mostra o loader
        this._loaderNode.classList.remove('pointer-events-none');
        requestAnimationFrame(() => this._loaderNode.classList.remove('opacity-0'));
    },

    hideLoader() {
        this._loaderCount = Math.max(0, this._loaderCount - 1);
        
        // Só esconde de fato se for a última requisição pendente a ser finalizada
        if (this._loaderCount === 0 && this._loaderNode) {
            this._loaderNode.classList.add('opacity-0');
            this._loaderNode.classList.add('pointer-events-none');
            // NÃO removemos do DOM (Evita acionar o Garbage Collector e causamentos engasgos de FPS)
        }
    }
};