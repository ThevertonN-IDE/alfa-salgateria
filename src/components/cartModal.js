// /src/components/CartModal.js
import { CartManager } from '../services/cartManager.js';

export const CartModal = {
    init() {
        // Fica "escutando" o motor do carrinho. Sempre que o motor gritar, ele atualiza a tela automaticamente!
        document.addEventListener('alfa:cartUpdated', (e) => this.updateBadges(e.detail));
    },

    updateBadges(cartData) {
        // Calcula as quantidades totais de forma agnóstica
        const totalItems = Object.values(cartData).reduce((sum, qtd) => sum + qtd, 0);
        
        const badgeElement = document.getElementById('cart-badge');
        if (badgeElement) {
            badgeElement.textContent = totalItems;
            badgeElement.classList.toggle('hidden', totalItems === 0);
        }
    },

    renderList() {
        const cartData = CartManager.getCart();
        const listContainer = document.getElementById('lista-itens-resumo');
        if(!listContainer) return;
        
        listContainer.innerHTML = ''; // Limpa
        
        // Exemplo de Injeção Blindada (XSS Proof): 
        // Em vez de template strings para o NOME do produto, usamos textContent
        Object.entries(cartData).forEach(([key, qtd]) => {
            const div = document.createElement('div');
            // ... (estilização Tailwind)
            
            const nameEl = document.createElement('span');
            nameEl.textContent = "Nome Buscado do Banco"; // O textContent evita XSS
            
            const removeBtn = document.createElement('button');
            removeBtn.onclick = () => CartManager.removeItem(key); // Evento limpo, sem "window."
            
            div.appendChild(nameEl);
            div.appendChild(removeBtn);
            listContainer.appendChild(div);
        });
    }
};