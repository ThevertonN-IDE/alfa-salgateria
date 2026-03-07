// /src/components/modalChat.js

export const ModalChat = {
    _closeHandler: null,
    
    render(data = {}) {
        this.destroy(); // Garante limpeza prévia

        const container = document.createElement('div');
        container.id = 'alfa-chat-modal';
        
        // Estrutura Base (Sem variáveis dinâmicas no innerHTML)
        container.innerHTML = `
            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 transition-opacity duration-300" id="chat-overlay">
                <div class="bg-white dark:bg-slate-800 w-11/12 max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden transform scale-95 transition-transform duration-300 ease-out" id="chat-content">
                    
                    <div class="p-4 bg-[rgb(var(--primary-rgb))] text-white flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <img id="chat-logo" src="/assets/default-logo.png" alt="Logo" class="w-8 h-8 rounded-full bg-white/20 object-cover">
                            <h3 id="chat-title" class="font-bold text-lg">Chat do Pedido</h3>
                        </div>
                        <button id="chat-close" class="text-white hover:text-white/70">X</button>
                    </div>
                    
                    <div class="p-4 h-72 bg-slate-50 dark:bg-slate-900"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // 1. INJEÇÃO SEGURA DOS DADOS (XSS Proof)
        // Se a logoUrl vier de um atacante, não vai executar script, apenas quebrar a imagem.
        if (data.logoUrl) {
            document.getElementById('chat-logo').setAttribute('src', data.logoUrl);
        }
        if (data.title) {
            document.getElementById('chat-title').textContent = data.title;
        }

        // 2. PERFORMANCE DE ANIMAÇÃO (Forçando o Reflow)
        const overlay = document.getElementById('chat-overlay');
        const content = document.getElementById('chat-content');
        
        // Lê uma propriedade para forçar o navegador a desenhar os elementos no DOM (Reflow síncrono)
        void overlay.offsetWidth; 

        // Agora aplica as classes de transição (Animação suave a 60fps)
        overlay.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');

        // 3. EVENT DELEGATION (Limpo e escalável)
        this._closeHandler = (e) => {
            if (e.target.id === 'chat-close' || e.target.id === 'chat-overlay') {
                this.close();
            }
        };
        overlay.addEventListener('click', this._closeHandler);
    },

    close() {
        const overlay = document.getElementById('chat-overlay');
        const content = document.getElementById('chat-content');
        
        if (overlay && content) {
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            overlay.classList.add('opacity-0');
            
            // Aguarda o fim exato da transição nativa do CSS
            overlay.addEventListener('transitionend', () => this.destroy(), { once: true });
        } else {
            this.destroy();
        }
    },

    destroy() {
        const container = document.getElementById('alfa-chat-modal');
        if (container) {
            // Remove o listener para não vazar memória
            const overlay = document.getElementById('chat-overlay');
            if (overlay && this._closeHandler) {
                overlay.removeEventListener('click', this._closeHandler);
            }
            container.remove();
        }
    }
};