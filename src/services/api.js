// /src/services/api.js
import { mostrarToast } from '../components/toast.js';

const CONFIG = {
    SUPABASE_URL: "https://zpdpscjjxqkbuhesdtyq.supabase.co",
    SUPABASE_KEY: "sb_publishable_3uaoU1fmUEKBrDmbhnk0qw_j3hsPk06"
};

export const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// Interceptor de Identidade
export const getLojaId = () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('loja') || localStorage.getItem('loja_atual_id') || 'alfa';
    if (id !== localStorage.getItem('loja_atual_id')) {
        localStorage.setItem('loja_atual_id', id);
    }
    return id;
};

// 🌟 INTERCEPTOR V2: Com Auto-Retry e Toast Modular
const withErrorBoundary = async (queryBuilder, customErrorMsg, retries = 1) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const { data, error } = await queryBuilder;
            if (error) throw error;
            return data;
        } catch (err) {
            if (attempt < retries) {
                console.warn(`[Rede] Falha na tentativa ${attempt + 1}. Tentando novamente...`);
                // Espera 500ms antes de tentar de novo (Micro-delay)
                await new Promise(res => setTimeout(res, 500));
                continue;
            }

            console.error("🛡️ [API Fatal Error]:", err.message || err);

            // CORREÇÃO: Chama a função diretamente da importação, sem o "window."
            if (typeof mostrarToast === 'function') {
                mostrarToast(customErrorMsg || "Falha na comunicação com o servidor.", "error");
            }

            return null;
        }
    }
};

export const api = {
    // 🌟 NOVA FUNÇÃO: O Maestro precisa disso para pintar a tela!
    // 🌟 NOVA FUNÇÃO (Corrigida com o nome real da tabela)
    async getStoreConfig() {
        // Trocamos 'lojas' por 'store_config'
        const query = supabase.from('store_config').select('*').eq('loja_id', getLojaId()).single();
        return withErrorBoundary(query, "Não foi possível carregar as configurações da loja.", 2);
    },

    async getProducts() {
        // Substituímos 'created_at' por 'order_index' para respeitar a ordem que você definiu no banco
        const query = supabase
            .from('products')
            .select('*')
            .eq('loja_id', getLojaId())
            .order('order_index', { ascending: true }); // Ordena pela coluna correta que existe!

        return withErrorBoundary(query, "Não foi possível carregar o cardápio no momento.", 1);
    },

    async createOrder(rawPayload) {
        // PROTEÇÃO CONTRA MASS ASSIGNMENT (DTO Pattern)
        const safeDTO = {
            loja_id: getLojaId(),
            cliente_nome: String(rawPayload.cliente_nome || '').trim(),
            cliente_telefone: String(rawPayload.cliente_telefone || '').trim(),
            itens: Array.isArray(rawPayload.itens) ? rawPayload.itens : [],
            valor_total: Number(rawPayload.valor_total) || 0,
            forma_pagamento: String(rawPayload.forma_pagamento || 'nao_informado')
        };

        const query = supabase.from('orders').insert([safeDTO]).select();
        return withErrorBoundary(query, "Erro ao processar seu pedido. Verifique a conexão e tente novamente.", 0);
    }
};
