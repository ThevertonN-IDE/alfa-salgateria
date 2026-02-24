// data.js
const SUPABASE_URL = "https://zpdpscjjxqkbuhesdtyq.supabase.co"; // Começa com https://...
const SUPABASE_ANON_KEY = "sb_publishable_3uaoU1fmUEKBrDmbhnk0qw_j3hsPk06"; // Começa com eyJ...

// Inicializa o cliente
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuração extra
const CONFIG = {
    loja: {
        nome: "Alfa Salgateria",
        telefone: "84987371966" // Seu número sem formatacao
    },
    pagamento: {
        pixKey: "84987371966",
        pixNome: "Tereza Ceciliana Guaraci Gomes da Costa Rodrigues"
    }
};
// --- CONFIGURAÇÃO DO PIX ---
// Coloque sua chave aqui dentro das aspas (CPF, CNPJ, Email ou Aleatória)
const CHAVE_PIX_LOJA = "(84) 987371966";
// =====================================================================
// MOTOR CAMALEÃO & SAAS (Multi-Lojas e Trava de Mensalidade)
// =====================================================================

// 1. Descobre de qual loja o cliente está comprando (Pela URL ou Memória)
const urlParams = new URLSearchParams(window.location.search);
let urlLojaId = urlParams.get('loja');

// Se tiver o ID na URL, salva no LocalStorage para não perder ao trocar de tela
if (urlLojaId) {
    localStorage.setItem('loja_atual_id', urlLojaId);
}

// Define a loja atual (se não tiver nada, tenta carregar a 'alfa' por padrão para não quebrar)
window.LOJA_ID = localStorage.getItem('loja_atual_id') || 'alfa';
window.LOJA_CONFIG = null; // Vai guardar nome, logo e cores

// 2. A Mágica do Tailwind (Prepara a cor Dinâmica)
// Dizemos ao Tailwind para criar uma cor nova chamada "primary", que vai ler uma variável CSS
if (window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                colors: { primary: 'var(--cor-primaria)' }
            }
        }
    };
}

// 3. Função Principal: Busca a loja e bloqueia se não pagou a mensalidade
window.iniciarCamaleao = async function () {
    try {
        const { data: config, error } = await _supabase
            .from('store_config')
            .select('*')
            .eq('loja_id', window.LOJA_ID)
            .single();

        if (error || !config) {
            document.body.innerHTML = `
                <div style="display:flex; height:100vh; background:#020617; color:#f8fafc; align-items:center; justify-content:center; flex-direction:column; text-align:center; padding: 20px; font-family:sans-serif;">
                    <h1 style="font-size: 2rem; color:#ef4444; margin-bottom: 10px;">⚠️ Loja Não Encontrada</h1>
                    <p style="color:#94a3b8;">Verifique se o link de acesso está correto.</p>
                </div>`;
            return false;
        }

        window.LOJA_CONFIG = config;

        // --- SISTEMA DE BLOQUEIO SAAS (MENSALIDADE) ---
        const dataVencimento = new Date(config.vencimento);
        const hoje = new Date();

        // Zera as horas para comparar apenas os dias
        hoje.setHours(0, 0, 0, 0);
        dataVencimento.setHours(0, 0, 0, 0);

        if (config.status_assinatura !== 'ativa' || hoje > dataVencimento) {
            document.body.innerHTML = `
                <div style="display:flex; height:100vh; background:#020617; color:#f8fafc; align-items:center; justify-content:center; flex-direction:column; text-align:center; padding: 20px; font-family:sans-serif;">
                    <i class="fas fa-lock" style="font-size: 4rem; color:#ef4444; margin-bottom: 20px;"></i>
                    <h1 style="font-size: 1.5rem; font-weight:bold; margin-bottom: 10px;">Sistema Temporariamente Suspenso</h1>
                    <p style="color:#94a3b8; max-width: 400px; font-size: 14px;">O acesso ao sistema da loja <b>${config.nome_loja}</b> está bloqueado. Por favor, entre em contato com o suporte da plataforma para regularizar a assinatura.</p>
                </div>`;
            return false;
        }

        // --- INJETANDO A COR E NOME NO SITE ---
        // Muda a variável CSS no documento
        document.documentElement.style.setProperty('--cor-primaria', config.cor_primaria);
        // Pega a cor de onde ela estiver disponível no seu script
        const corParaBarra = (typeof loja !== 'undefined' ? loja.cor_primaria :
            typeof config !== 'undefined' ? config.cor_primaria :
                typeof lojaConfig !== 'undefined' ? lojaConfig.cor_primaria : '#ea580c');

        // --- PINTAR A BARRA DE STATUS DO CELULAR ---
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = "theme-color";
            document.head.appendChild(metaTheme);
        }
        metaTheme.setAttribute('content', corParaBarra);
        // Atualiza título da aba do navegador
        document.title = `${config.nome_loja} - Cardápio`;

        // Troca textos genéricos pelo nome da loja (em elementos com a classe 'nome-loja-dinamico')
        document.querySelectorAll('.nome-loja-dinamico').forEach(el => {
            el.innerText = config.nome_loja;
        });

        // Troca as imagens genéricas pela Logo da loja (em elementos com a classe 'logo-loja-dinamica')
        if (config.logo_url) {
            document.querySelectorAll('.logo-loja-dinamica').forEach(img => {
                img.src = config.logo_url;
            });
            // Troca o ícone do navegador
            let linkFavicon = document.querySelector("link[rel~='icon']");
            if (!linkFavicon) {
                linkFavicon = document.createElement('link');
                linkFavicon.rel = 'icon';
                document.head.appendChild(linkFavicon);
            }
            linkFavicon.href = config.logo_url;
        }

        return true; // Sucesso! A loja existe, pagou a mensalidade e pintamos o site.

    } catch (e) {
        console.error("Erro no Motor Camaleão:", e);
        return false;
    }
};