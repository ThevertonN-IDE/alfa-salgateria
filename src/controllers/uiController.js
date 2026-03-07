// /src/controllers/uiController.js
import { auth } from '../services/auth.js';

export const UIController = {
    // 1. DOM CACHE: Guarda as referências na memória para alta performance (O(1))
    nodes: {},

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkInitialTheme();
    },

    cacheDOM() {
        this.nodes = {
            sidebar: document.getElementById('sidebar'),
            overlay: document.getElementById('sidebar-overlay'),
            themeIcon: document.getElementById('icon-tema'),
            htmlNode: document.documentElement,
            ordersModal: document.getElementById('modal-meus-pedidos')
        };
    },

    bindEvents() {
        // 🌟 EVENT DELEGATION: Único escutador global (Escalabilidade extrema de Memória)
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-action]');
            if (!trigger) return;

            const action = trigger.getAttribute('data-action');

            // --------------------------------------------------------
            // PADRÃO 1: ROTEAMENTO BASEADO EM DICIONÁRIO (O(1))
            // Se precisar adicionar 50 páginas amanhã, basta adicionar 1 linha aqui.
            // --------------------------------------------------------
            const routes = {
                'login-redirect': 'cliente-login.html',
                'admin-redirect': 'admin.html',
                'profile-redirect': 'perfil.html',
                'orders-redirect': 'encomendas.html',
                'checkout-redirect': 'checkout.html'
            };

            if (routes[action]) {
                window.location.href = routes[action];
                return; // Para a execução aqui
            }

            // --------------------------------------------------------
            // PADRÃO 2: CONTROLE DE INTERFACE GLOBAL
            // --------------------------------------------------------
            switch (action) {
                case 'toggle-sidebar':
                    this.toggleSidebar();
                    break;
                case 'toggle-theme':
                    this.toggleTheme();
                    break;
                case 'open-orders':
                    this.openOrdersModal();
                    break;
                case 'close-orders':
                    this.closeOrdersModal();
                    break;
                case 'whatsapp-redirect':
                    // 🛡️ BLINDAGEM DE VULNERABILIDADE (Tabnabbing):
                    // O 'noopener,noreferrer' impede que a aba do WhatsApp injete scripts na aba do seu app.
                    window.open('https://wa.me/5584987371966', '_blank', 'noopener,noreferrer');
                    break;
                case 'reload-page':
                    window.location.reload();
                    break;
                case 'logout':
                    // Desacoplamento: Chama o serviço de Auth externo para cuidar da lógica complexa
                    if (auth && auth.signOut) auth.signOut();
                    break;
            }
        });
    },

    // --- MÉTODOS DE UI VISUAL ---

    toggleSidebar() {
        const { sidebar, overlay } = this.nodes;
        if (!sidebar || !overlay) return;

        const isClosed = sidebar.classList.contains('-translate-x-full');

        if (isClosed) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            // Força o repaint do navegador para a transição CSS não engasgar
            requestAnimationFrame(() => overlay.classList.remove('opacity-0'));
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    },

    openOrdersModal() {
        const { ordersModal, sidebar, overlay } = this.nodes;
        
        // Se a pessoa clicou via menu lateral, fecha o menu primeiro para não encavalar UI
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
            this.toggleSidebar();
        }

        if (!ordersModal) return;
        ordersModal.classList.remove('hidden');
        ordersModal.classList.add('flex');
        void ordersModal.offsetWidth; // Força Reflow (Performance)
        ordersModal.classList.remove('opacity-0');

        // 🌟 ARQUITETURA ORIENTADA A EVENTOS (EDA): 
        // A UI não faz chamadas ao banco de dados. Ela grita para o sistema: "Preciso dos pedidos!"
        // Outro arquivo (ex: orderController.js) vai escutar isso e buscar os dados.
        document.dispatchEvent(new CustomEvent('app:loadOrders'));
    },

    closeOrdersModal() {
        const { ordersModal } = this.nodes;
        if (!ordersModal) return;

        ordersModal.classList.add('opacity-0');
        setTimeout(() => {
            ordersModal.classList.add('hidden');
            ordersModal.classList.remove('flex');
        }, 300);
    },

    toggleTheme() {
        const { htmlNode, themeIcon } = this.nodes;
        htmlNode.classList.toggle('dark');
        const isDark = htmlNode.classList.contains('dark');

        localStorage.setItem('tema', isDark ? 'dark' : 'light');

        if (themeIcon) {
            themeIcon.className = isDark ? 'fas fa-sun text-yellow-400' : 'fas fa-moon text-purple-500';
        }

        this.updateThemeColorMeta(isDark);
    },

    updateThemeColorMeta(isDark) {
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            const primaryColor = getComputedStyle(this.nodes.htmlNode).getPropertyValue('--primary-hex').trim() || '#ea580c';
            metaTheme.setAttribute('content', isDark ? '#111827' : primaryColor);
        }
    },

    checkInitialTheme() {
        if (localStorage.getItem('tema') === 'dark') {
            this.nodes.htmlNode.classList.add('dark');
            if (this.nodes.themeIcon) this.nodes.themeIcon.className = 'fas fa-sun text-yellow-400';
            this.updateThemeColorMeta(true);
        }
    }
};