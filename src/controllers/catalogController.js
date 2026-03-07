// /src/controllers/catalogController.js
import { api } from '../services/api.js';
import { ProductCard } from '../components/ProductCard.js';

export const CatalogController = {
    _allProducts: [],
    _debounceTimer: null,

    async load() {
        if (this._allProducts.length > 0) return;

        const root = document.getElementById('catalog-root');
        if (root) root.innerHTML = '<p class="text-center text-slate-400 py-10">Montando vitrine...</p>';

        this._allProducts = await api.getProducts() || [];
        
        this.renderCatalog(this._allProducts);
        this.bindEvents(); // Conecta a barra de pesquisa após carregar os produtos
    },

    // 🌟 DEBOUNCE PATTERN: Otimização Extrema de Performance
    // Só pesquisa 300ms APÓS o usuário PARAR de digitar.
    _handleInput(event) {
        clearTimeout(this._debounceTimer);
        const term = event.target.value;
        
        this._debounceTimer = setTimeout(() => {
            this.search(term);
        }, 300);
    },

    bindEvents() {
        const inputBusca = document.getElementById('input-busca');
        if (inputBusca) {
            // Remove o listener antigo para evitar duplicação em caso de recarregamento
            inputBusca.removeEventListener('input', this._handleInput.bind(this));
            inputBusca.addEventListener('input', this._handleInput.bind(this));
        }

        // Escutador global para os botões de "Limpar Busca" (usando o Event Delegation que já conhecemos)
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-action="clear-search"]');
            if (trigger) this.clearSearch();
        });
    },

    search(searchTerm) {
        const term = String(searchTerm).toLowerCase().trim();
        const btnLimpar = document.getElementById('btn-limpar-busca');
        
        // Controle visual do botão "X" na barra de busca
        if (btnLimpar) {
            term.length > 0 ? btnLimpar.classList.remove('hidden') : btnLimpar.classList.add('hidden');
        }

        if (!term) {
            this.renderCatalog(this._allProducts);
            return;
        }

        // Filtro ultra-rápido na memória RAM
        const filtered = this._allProducts.filter(p => 
            p.name.toLowerCase().includes(term) || 
            (p.description && p.description.toLowerCase().includes(term))
        );

        this.renderCatalog(filtered, term);
    },

    clearSearch() {
        const inputBusca = document.getElementById('input-busca');
        if (inputBusca) inputBusca.value = '';
        this.search('');
    },

    renderCatalog(productsArray, searchTerm = '') {
        const root = document.getElementById('catalog-root');
        const emptyState = document.getElementById('vazio');
        if (!root) return;

        root.innerHTML = ''; // Limpa a grade antiga
        
        if (productsArray.length === 0) {
            // 🛡️ BLINDAGEM XSS: Usamos textContent para exibir o que o usuário digitou
            // Se ele digitar <script>alert(1)</script>, será impresso apenas como texto
            if (emptyState) {
                const termoNode = document.getElementById('termo-buscado');
                if (termoNode) termoNode.textContent = `"${searchTerm}"`;
                
                emptyState.classList.remove('hidden');
                emptyState.classList.add('flex');
                
                // Ocultamos as categorias quando está vazio (se existirem na UI)
                document.querySelectorAll('.group-cat').forEach(c => c.style.display = 'none');
            }
            return;
        }

        // Se encontrou produtos, esconde a tela de vazio
        if (emptyState) {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";

        productsArray.forEach(prod => {
            const card = new ProductCard(prod); 
            grid.appendChild(card.render()); 
        });

        root.appendChild(grid);
    }
};