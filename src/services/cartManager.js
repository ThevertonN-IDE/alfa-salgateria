// /src/services/cartManager.js

import { ui } from './ui.js'; // Importa para dar feedback visual

export const CartManager = {
    _cart: {},

    // 🌟 Isolamento por Loja: Garante que os carrinhos das lojas não se misturem
    _getStorageKey: () => `alfa_cart_${localStorage.getItem('loja_atual_id') || 'default'}`,

    init() {
        try {
            const saved = localStorage.getItem(this._KEY);
            this._cart = saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error("Cart Cache Corrupted", e);
            this._cart = {};
        }
        this._notifyUI(); // Avisa a interface que o carrinho carregou
    },

    // Blindado contra valores negativos ou strings maliciosas
    // 🛡️ DTO PATTERN: Salva uma "fotografia" do produto na memória do celular
    addItem(productDTO, quantity = 1) {
        const safeQtd = Math.max(1, parseInt(quantity) || 1);

        // Chave composta para suportar variações (ex: 123__tamanho-G)
        const key = productDTO.variantIndex !== undefined && productDTO.variantIndex !== null
            ? `${productDTO.id}__${productDTO.variantIndex}`
            : String(productDTO.id);

        if (this._cart[key]) {
            this._cart[key].qtd += safeQtd;
        } else {
            // Guarda na RAM: Evita requisições extras ao banco na tela de Checkout
            this._cart[key] = {
                id: productDTO.id,
                name: String(productDTO.name).replace(/<[^>]*>?/gm, ''), // Anti-XSS nativo
                price: Number(productDTO.price) || 0,
                variantText: productDTO.variantText || null,
                imageUrl: productDTO.imageUrl || '/assets/default-product.png',
                qtd: safeQtd
            };
        }

        this._save();
        ui.showToast(`${this._cart[key].name} adicionado!`, 'success'); // Feedback tátil e visual
    },
    updateQuantity(key, delta) {
        if (!this._cart[key]) return;
        
        const newQtd = this._cart[key].qtd + parseInt(delta);
        if (newQtd <= 0) {
            delete this._cart[key];
        } else {
            this._cart[key].qtd = newQtd;
        }
        this._save();
    },
    removeItem(key) {
        delete this._cart[key];
        this._save();
    },

    clearCart() {
        this._cart = {};
        localStorage.removeItem(this._KEY);
        this._notifyUI();
    },

    getCart() {
        // Retorna uma cópia profunda para evitar mutação direta pela UI
        return JSON.parse(JSON.stringify(this._cart));
    },
    getTotals() {
        let itemsCount = 0;
        let totalValue = 0;
        
        Object.values(this._cart).forEach(item => {
            itemsCount += item.qtd;
            totalValue += (item.price * item.qtd);
        });
        
        return { itemsCount, totalValue };
    },
    _save() {
        localStorage.setItem(this._KEY, JSON.stringify(this._cart));
        this._notifyUI();
    },

    _notifyUI() {
        // Sai o 'alfa:', entra o 'app:'
        document.dispatchEvent(new CustomEvent('app:cartUpdated', { 
            detail: { cart: this.getCart(), totals: this.getTotals() }
        }));
    }
};