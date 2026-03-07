// /src/app.js
import { themeEngine } from './services/themeEngine.js';
import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { CartManager } from './services/cartManager.js';
import { NotificationService } from './services/notificationService.js';
import { CatalogController } from './controllers/catalogController.js';
import { UIController } from './controllers/uiController.js';
import { CartController } from './controllers/cartController.js';

// 🛡️ GUARDIÃO DE ASSETS (Global Image Fallback CSP-Safe)
document.addEventListener('error', function(event) {
    const alvo = event.target;
    if (alvo.tagName && alvo.tagName.toLowerCase() === 'img') {
        if (!alvo.src.includes('default-')) {
            console.warn('[Asset Fallback] Imagem não encontrada:', alvo.src);
            if (alvo.classList.contains('logo-loja-dinamica')) {
                alvo.src = '/assets/default-logo.png';
            } else {
                alvo.src = '/assets/default-product.png';
            }
        }
    }
}, true);

class AppMaestro {
    static async boot() {
        console.log("🚀 [Bootloader] Iniciando Alfa App...");

        // 🌟 1. A CORREÇÃO DO ERRO DO TAILWIND
        // Configura o Tailwind de forma dinâmica garantindo que a CDN já foi carregada
        if (window.tailwind) {
            window.tailwind.config = {
                darkMode: 'class',
                theme: { extend: { colors: { primary: 'rgb(var(--primary-rgb) / <alpha-value>)' } } }
            };
        } else {
            console.error("🚨 [Bootloader] Tailwind CDN falhou ou não carregou a tempo!");
        }

        try {
            // 2. FOUC Prevention Imediata
            themeEngine.applyFromCache();
            UIController.init();

            // 3. Data Fetching
            const storeConfig = await api.getStoreConfig();

            if (!storeConfig) {
                this.renderCriticalError("Loja não encontrada ou link inválido.");
                return;
            }

            // 4. SaaS Block (Validação de Mensalidade Estrita)
            if (!this.isSubscriptionValid(storeConfig)) {
                this.renderSaaSBlock(storeConfig.nome_loja);
                return;
            }

            // 5. Injeção do Tema Completo (Corrigido: Chamado apenas 1 vez)
            themeEngine.applyFullTheme(storeConfig);

            // 6. Inicialização Resiliente de Serviços
            try {
                // 🌟 A ORDEM AQUI É CRÍTICA PARA A ARQUITETURA DE EVENTOS!
                // 1º: A Interface "liga os ouvidos".
                CartController.init(); 
                
                // 2º: O Cérebro processa o banco de dados e "grita" os resultados.
                CartManager.init(); 

                // Verifica a Sessão e Inicia o Radar PWA (Assíncrono, não bloqueia a UI)
                auth.getSession().then(session => {
                    if (session && storeConfig) {
                        NotificationService.initRealtime(session.user.id, storeConfig.logo_url);
                    }
                });

                // Se houver uma vitrine na página, o Maestro manda o Controlador carregar
                if (document.getElementById('catalog-root')) {
                    CatalogController.load();
                }
            } catch (serviceError) {
                console.error("⚠️ [AppMaestro] Erro não-fatal ao carregar serviços:", serviceError);
            }

            // 7. Finaliza o Boot
            document.dispatchEvent(new CustomEvent('alfa:appReady', { detail: { config: storeConfig } }));

        } catch (error) {
            console.error("💥 [Bootloader Fatal Error]:", error);
            this.renderCriticalError("Falha crítica ao iniciar o sistema.");
        }
    }

    static isSubscriptionValid(config) {
        if (config.status_assinatura !== 'ativa') return false;
        const vencimento = new Date(config.vencimento);
        const hoje = new Date();
        vencimento.setHours(0, 0, 0, 0);
        hoje.setHours(0, 0, 0, 0);
        return hoje <= vencimento;
    }

    static renderSaaSBlock(nomeLoja) {
        const mainContent = document.body.firstElementChild;
        if (mainContent) mainContent.style.display = 'none';

        const blockNode = document.createElement('div');
        blockNode.className = "fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 text-center z-[9999]";
        
        blockNode.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-6"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <h1 class="text-2xl font-bold mb-2">Sistema Suspenso</h1>
            <p class="text-slate-400 max-w-sm">O acesso à loja <b id="saas-nome-loja"></b> está bloqueado no momento. Contate o suporte da plataforma.</p>
        `;

        document.body.appendChild(blockNode);
        // Injeção limpa e segura do texto (Anti-XSS)
        document.getElementById('saas-nome-loja').textContent = nomeLoja || 'selecionada';
    }

    static renderCriticalError(msg) {
        document.body.innerHTML = `
            <div class="fixed inset-0 flex items-center justify-center bg-slate-950 text-red-500 font-bold p-6 text-center z-[9999]">
                <h1>⚠️ ${msg}</h1>
            </div>
        `;
    }
}

// Inicia automaticamente
AppMaestro.boot();