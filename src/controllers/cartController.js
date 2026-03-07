// /src/controllers/cartController.js
import { CartManager } from '../services/cartManager.js';
import { ui } from '../services/ui.js';

export const CartController = {
    nodes: {},

    init() {
        this.cacheDOM();
        this.bindEvents();

        // Fica de escuta: Se o CartManager alterar o carrinho, ele repinta a tela sozinho!
        document.addEventListener('app:cartUpdated', (e) => this.render(e.detail));
    },

    cacheDOM() {
        this.nodes = {
            modal: document.getElementById('modal-resumo'),
            listContainer: document.getElementById('lista-itens-resumo'),
            totalText: document.getElementById('total-resumo'),
            bottomBar: document.getElementById('barra-pedido'),
            totalBar: document.getElementById('total-barra'),
            badgeBar: document.getElementById('qtd-badge'),
            badgeHeader: document.getElementById('cart-badge') // Badge lá no header do site
        };
    },

    bindEvents() {
        // Event Delegation Global para cliques do Carrinho
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-action]');
            if (!trigger) return;

            const action = trigger.getAttribute('data-action');
            const itemKey = trigger.getAttribute('data-key');

            if (action === 'open-cart') this.openModal();
            if (action === 'close-cart') this.closeModal(e);
            if (action === 'clear-cart') this.handleClearCart();

            // 🌟 NOVOS CONTROLADORES DE QUANTIDADE
            if (action === 'remove-item' && itemKey) CartManager.removeItem(itemKey);
            if (action === 'increase-item' && itemKey) CartManager.updateQuantity(itemKey, 1);
            if (action === 'decrease-item' && itemKey) CartManager.updateQuantity(itemKey, -1);
        });
    },

    openModal() {
        const { modal } = this.nodes;
        if (!modal) return;

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Força Reflow para a transição CSS funcionar (Performance)
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
    },

    closeModal(event) {
        const { modal } = this.nodes;
        if (!modal) return;

        // Se houver um evento, verifica se o clique foi fora da janela branca
        if (event && event.target.id !== 'modal-resumo' && event.currentTarget.getAttribute('data-action') !== 'close-cart') return;

        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    },

    handleClearCart() {
        // Fallback Seguro: Se o SweetAlert falhar (Rede/AdBlock), usa o confirm nativo do navegador.
        if (window.Swal) {
            Swal.fire({
                title: 'Esvaziar carrinho?',
                text: "Todos os itens serão removidos.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ea580c',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sim'
            }).then((result) => {
                if (result.isConfirmed) CartManager.clearCart();
            });
        } else {
            // O Plano B que salva a venda!
            if (confirm("Deseja realmente esvaziar o carrinho?")) {
                CartManager.clearCart();
            }
        }
    },

    // 🛡️ INJEÇÃO BLINDADA: Renderiza os Nodos sem innerHTML com variáveis soltas
    render({ cart, totals }) {
        const { listContainer, totalText, bottomBar, totalBar, badgeBar, badgeHeader } = this.nodes;
        const currencyFormater = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

        // 1. Atualiza as Badges e Barras (O(1) perfomance)
        const hasItems = totals.itemsCount > 0;

        if (badgeHeader) {
            badgeHeader.textContent = totals.itemsCount;
            hasItems ? badgeHeader.classList.remove('hidden') : badgeHeader.classList.add('hidden');
        }

        if (bottomBar && totalBar && badgeBar) {
            if (hasItems) {
                bottomBar.classList.remove('hidden');
                setTimeout(() => bottomBar.classList.remove('translate-y-32'), 10);
                totalBar.textContent = currencyFormater.format(totals.totalValue);
                badgeBar.textContent = totals.itemsCount;
            } else {
                bottomBar.classList.add('translate-y-32');
                setTimeout(() => bottomBar.classList.add('hidden'), 300);
                this.closeModal(); // Se o carrinho zerou, fecha a janela
            }
        }

        if (totalText) totalText.textContent = currencyFormater.format(totals.totalValue);

        // 2. Renderiza a Lista de Itens Segura
        // 2. Renderização da Lista de Itens
        if (!listContainer) return;

        // Esvazia a div de forma segura (não há variáveis soltas aqui)
        listContainer.innerHTML = '';

        if (!hasItems) {
            listContainer.innerHTML = '<p class="text-center text-gray-400 py-6 font-medium">Seu carrinho está vazio.</p>';
            return;
        }

        // 3. INJEÇÃO SEGURA DOS DADOS E UI RESPONSIVA
        Object.entries(cart).forEach(([key, item]) => {
            const row = document.createElement('div');
            row.className = "flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 animate-up mb-3 gap-3";

            const subtotal = currencyFormater.format(item.price * item.qtd);

            // A estrutura base (esqueleto) é injetada via innerHTML (HTML estático = 100% seguro)
            row.innerHTML = `
                <div class="flex items-center gap-3 flex-1 overflow-hidden">
                    <img src="${item.imageUrl || '/assets/default-product.png'}" class="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0" onerror="this.src='/assets/default-product.png'">
                    <div class="flex flex-col flex-1 min-w-0">
                        <p class="font-bold text-sm text-gray-800 dark:text-white truncate item-nome"></p>
                        <span class="text-[10px] text-orange-500 font-black truncate item-variacao"></span>
                    </div>
                </div>
                
                <div class="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div class="flex items-center bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                        <button data-action="decrease-item" data-key="${key}" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-orange-500 transition"><i class="fas fa-minus text-xs pointer-events-none"></i></button>
                        <span class="w-6 text-center text-xs font-bold dark:text-white item-qtd"></span>
                        <button data-action="increase-item" data-key="${key}" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-green-500 transition"><i class="fas fa-plus text-xs pointer-events-none"></i></button>
                    </div>
                    
                    <p class="font-black text-sm text-gray-800 dark:text-white min-w-[70px] text-right item-subtotal"></p>
                    
                    <button data-action="remove-item" data-key="${key}" class="w-8 h-8 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition shadow-sm flex-shrink-0">
                        <i class="fas fa-trash-alt text-xs pointer-events-none"></i>
                    </button>
                </div>
            `;

            // 🛡️ AQUI OCORRE A BLINDAGEM VERDADEIRA:
            // NUNCA concatenamos strings do banco no innerHTML. Usamos textContent.
            // Se 'item.name' for `<script>alert('Hack')</script>`, o navegador vai imprimir isso na tela como texto, sem executar o código!
            row.querySelector('.item-nome').textContent = item.name || 'Produto Indisponível';

            if (item.variantText) {
                row.querySelector('.item-variacao').textContent = item.variantText;
            }

            row.querySelector('.item-qtd').textContent = item.qtd;
            row.querySelector('.item-subtotal').textContent = subtotal;

            listContainer.appendChild(row);
        });
    }
};