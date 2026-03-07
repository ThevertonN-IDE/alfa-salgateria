// /src/components/ProductCard.js
import { ui } from '../services/ui.js';

export class ProductCard {
    constructor(product) {
        this.product = product;
    }

    // Renderiza e retorna um Elemento DOM (seguro contra XSS)
    render() {
        const card = document.createElement('div');
        card.className = "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-transform hover:-translate-y-1";

        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.product.preco);
        const imgUrl = this.product.imagem_url || '/assets/default-product.png';

        card.innerHTML = `
            <div class="relative h-48 bg-slate-100 dark:bg-slate-900">
                <img src="${imgUrl}" alt="Produto" class="w-full h-full object-cover">
                ${this.product.is_disponivel === false ? '<div class="absolute inset-0 bg-black/60 flex items-center justify-center"><span class="text-white font-bold px-3 py-1 bg-red-500 rounded-full text-xs">ESGOTADO</span></div>' : ''}
            </div>
            <div class="p-4 flex flex-col flex-1">
                <h3 class="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1 product-title"></h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-1 product-desc"></p>
                <div class="flex items-center justify-between mt-auto">
                    <span class="font-bold text-[rgb(var(--primary-rgb))] text-lg">${precoFormatado}</span>
                    <button class="add-to-cart-btn bg-[rgb(var(--primary-rgb))] text-white w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" ${this.product.is_disponivel === false ? 'disabled' : ''}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                    </button>
                </div>
            </div>
        `;

        // Proteção XSS via textContent
        card.querySelector('.product-title').textContent = this.product.nome;
        card.querySelector('.product-desc').textContent = this.product.descricao || '';

        // Bind do Evento (Sem "onclick" global)
        const btnAdd = card.querySelector('.add-to-cart-btn');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.handleAddToCart());
        }

        return card;
    }

    handleAddToCart() {
        // 1. Monta o DTO do Item
        const cartItem = {
            id: this.product.id,
            nome: this.product.nome,
            preco: this.product.preco,
            quantidade: 1
            // A lógica de variações (tamanhos) chamaria um Modal aqui antes de emitir o evento
        };

        // 2. Dispara o evento global. Quem gerencia o Carrinho (CartManager) que se vire para escutar.
        document.dispatchEvent(new CustomEvent('alfa:cartUpdated', {
            detail: { action: 'add', item: cartItem }
        }));

        // 3. Feedback Visual Centralizado
        ui.showToast(`${this.product.nome} adicionado!`, 'success');
    }
}