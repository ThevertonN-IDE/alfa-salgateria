// /src/components/ProductCard.js
import { CartManager } from '../services/cartManager.js';

export class ProductCard {
    // Memória Cacheada da Estrutura DOM
    static template = null;

    constructor(product) {
        this.product = product;
    }

    _initTemplate() {
        if (ProductCard.template) return;
        ProductCard.template = document.createElement('template');
        // Estrutura 100% livre de interpolação de strings.
        ProductCard.template.innerHTML = `
            <div class="prod-card p-5 rounded-[2rem] bg-white dark:bg-gray-800 transition-transform hover:-translate-y-1 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <div class="flex gap-5 relative z-10 flex-grow">
                    <div class="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-2xl flex-shrink-0 overflow-hidden relative shadow-inner border border-gray-100 dark:border-gray-600">
                        <img class="prod-img w-full h-full object-cover transition duration-700 group-hover:scale-110" onerror="this.src='./assets/default-product.png'">
                        <span class="prod-badge hidden absolute top-0 left-0 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-br-xl shadow-sm uppercase tracking-wide">Oferta</span>
                    </div>
                    <div class="flex-grow flex flex-col justify-between">
                        <div>
                            <h3 class="font-black text-gray-800 dark:text-white text-base leading-tight mb-1 product-title"></h3>
                            <p class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium product-desc"></p>
                        </div>
                        <div class="flex justify-between items-end mt-3 product-actions"></div>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        this._initTemplate();

        // 🌟 CLONAGEM HIPER RÁPIDA DE NÓS
        const fragment = ProductCard.template.content.cloneNode(true);
        const card = fragment.firstElementChild; 
        
        const imgUrl = this.product.image_url || './assets/default-product.png';
        const hasVariants = Array.isArray(this.product.variants) && this.product.variants.length > 0;

        // 🛡️ INJEÇÃO SEGURA (TextContent e Propriedades nativas)
        card.querySelector('.prod-img').src = imgUrl;
        card.querySelector('.product-title').textContent = this.product.name;
        card.querySelector('.product-desc').textContent = this.product.description || '';

        if (this.product.on_sale && !hasVariants) {
            card.querySelector('.prod-badge').classList.remove('hidden');
        }

        // LÓGICA DE NEGÓCIO E BOTÕES
        const actionContainer = card.querySelector('.product-actions');

        if (hasVariants) {
            const minPrice = Math.min(...this.product.variants.map(v => v.promo_price || v.price));
            actionContainer.innerHTML = `
                <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wide">A partir de <br><span class="text-[rgb(var(--primary-rgb))] font-black text-base">R$ ${minPrice.toFixed(2).replace('.', ',')}</span></span>
                <button class="btn-variants bg-white dark:bg-gray-700 text-[rgb(var(--primary-rgb))] px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-sm border border-gray-200 dark:border-gray-600">Opções</button>
            `;
            
            // Decoplamento: Grita para o sistema abrir o modal de Variações
            actionContainer.querySelector('.btn-variants').addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('app:openVariants', { detail: this.product }));
            });
        } else {
            const price = this.product.on_sale ? this.product.sale_price : this.product.price;
            const oldPrice = this.product.on_sale ? `<span class="text-[10px] text-gray-400 line-through mr-1">R$${this.product.price.toFixed(2)}</span>` : '';
            
            actionContainer.innerHTML = `
                <div>${oldPrice}<span class="text-xl font-black text-[rgb(var(--primary-rgb))]">R$ ${Number(price).toFixed(2).replace('.', ',')}</span></div>
                <button class="btn-add w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-600 text-green-600 rounded-lg shadow-sm font-bold hover:bg-green-50 active:scale-90 transition border border-gray-200 dark:border-gray-600">
                    <i class="fas fa-plus pointer-events-none"></i>
                </button>
            `;
            
            // Ligação Direta: O botão se comunica com o Manager nativamente
            actionContainer.querySelector('.btn-add').addEventListener('click', () => {
                CartManager.addItem({ 
                    id: this.product.id, 
                    name: this.product.name, 
                    price: price, 
                    imageUrl: imgUrl 
                }, 1);
            });
        }

        return card;
    }
}