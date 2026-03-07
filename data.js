// data.js
const SUPABASE_URL = "https://zpdpscjjxqkbuhesdtyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3uaoU1fmUEKBrDmbhnk0qw_j3hsPk06";

// Inicializa o cliente
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuração extra (Fallback/Legacy)
const CONFIG = {
    loja: {
        nome: "Alfa Salgateria",
        telefone: "84987371966"
    },
    pagamento: {
        pixKey: "84987371966",
        pixNome: "Tereza Ceciliana Guaraci Gomes da Costa Rodrigues"
    }
};
// --- CONFIGURAÇÃO DO PIX ---
const CHAVE_PIX_LOJA = "(84) 987371966";

// =====================================================================
// MOTOR CAMALEÃO & SAAS V2 (Multi-Lojas, Mensalidade e Cache)
// =====================================================================

// 1. Descobre de qual loja o cliente está comprando
const urlParams = new URLSearchParams(window.location.search);
let urlLojaId = urlParams.get('loja');

if (urlLojaId) {
    localStorage.setItem('loja_atual_id', urlLojaId);
}

// Define a loja atual
window.LOJA_ID = localStorage.getItem('loja_atual_id') || 'alfa';
window.LOJA_CONFIG = null;

// 2. A Mágica do Tailwind (Lendo a variável RGB para aceitar opacidade)
if (window.tailwind) {
    window.tailwind.config = {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
                    secondary: 'var(--secondary-color, #ffffff)'
                }
            }
        }
    };
}

// 3. Funções de Injeção Visual e Segurança (Design Tokens)
function aplicarCorCamaleao(hexColor, secondaryHex) {
    const isValidHex = /^#[0-9A-F]{6}$/i.test(hexColor);
    const safePrimary = isValidHex ? hexColor : '#ea580c';

    // Converte HEX para RGB (Para o Tailwind)
    const r = parseInt(safePrimary.slice(1, 3), 16);
    const g = parseInt(safePrimary.slice(3, 5), 16);
    const b = parseInt(safePrimary.slice(5, 7), 16);
    const rgbValue = `${r}, ${g}, ${b}`;

    // Aplica no DOM
    const root = document.documentElement;
    root.style.setProperty('--primary-hex', safePrimary);
    root.style.setProperty('--primary-rgb', rgbValue);

    if (secondaryHex && /^#[0-9A-F]{6}$/i.test(secondaryHex)) {
        root.style.setProperty('--secondary-color', secondaryHex);
    } else {
        root.style.setProperty('--secondary-color', '#ffffff');
    }

    localStorage.setItem(`tema_cor_${window.LOJA_ID}`, rgbValue);
    return safePrimary;
}

function aplicarConfiguracoesVisuais(config) {
    const safePrimary = aplicarCorCamaleao(config.cor_primaria, config.cor_secundaria);

    if (config.nome_loja) {
        // Proteção XSS (Limpa tags HTML indesejadas)
        const safeName = config.nome_loja.replace(/<[^>]*>?/gm, '');
        document.title = `${safeName} - Cardápio`;

        document.querySelectorAll('.nome-loja-dinamico').forEach(el => {
            el.innerText = safeName;
        });
    }

    // Dentro da função aplicarConfiguracoesVisuais(config)

    if (config.logo_url) {
        // 1. Defesa em Profundidade: Valida o protocolo da URL
        const isSafeUrl = config.logo_url.startsWith('http') || config.logo_url.startsWith('data:image');

        if (isSafeUrl) {
            // 2. Preload Invisível (Evita o "piscar" e o CLS)
            const imgPreload = new Image();
            imgPreload.src = config.logo_url;

            // 3. Só aplica no DOM se o download for um sucesso
            imgPreload.onload = () => {
                // Seleciona tanto as logos normais quanto a logo do loader de uma vez
                document.querySelectorAll('.logo-loja-dinamica, #loader-logo').forEach(img => {
                    img.src = config.logo_url;
                });

                // Atualiza o Favicon do navegador
                let linkFavicon = document.querySelector("link[rel~='icon']");
                if (!linkFavicon) {
                    linkFavicon = document.createElement('link');
                    linkFavicon.rel = 'icon';
                    document.head.appendChild(linkFavicon);
                }
                linkFavicon.href = config.logo_url;
            };

            // 4. Sistema de Fallback (Se a imagem do Supabase Storage quebrar/sumir)
            imgPreload.onerror = () => {
                console.warn(`[Motor Camaleão] Falha ao carregar logo da loja ${config.nome_loja}. Mantendo Fallback Padrão.`);
                // O sistema não faz nada. O HTML continuará exibindo a sua logo genérica (assets/default-logo.png)
            };
        }
    }

    // Efeito de App Nativo na Barra do Celular (Ajustado pro Modo Escuro)
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = "theme-color";
        document.head.appendChild(metaThemeColor);
    }
    const isDark = document.documentElement.classList.contains('dark');
    metaThemeColor.setAttribute('content', isDark ? '#111827' : safePrimary);
}

function mostrarTelaBloqueioSaaS(nomeLoja) {
    document.body.innerHTML = `
        <div style="display:flex; height:100vh; background:#020617; color:#f8fafc; align-items:center; justify-content:center; flex-direction:column; text-align:center; padding: 20px; font-family:sans-serif;">
            <i class="fas fa-lock" style="font-size: 4rem; color:#ef4444; margin-bottom: 20px;"></i>
            <h1 style="font-size: 1.5rem; font-weight:bold; margin-bottom: 10px;">Sistema Temporariamente Suspenso</h1>
            <p style="color:#94a3b8; max-width: 400px; font-size: 14px;">O acesso ao sistema da loja <b>${nomeLoja || 'selecionada'}</b> está bloqueado. Por favor, entre em contato com o suporte da plataforma para regularizar a assinatura.</p>
        </div>`;
}

// 4. Função Principal: Inicialização com Cache TTL de 15 Minutos
window.iniciarCamaleao = async function () {
    const cacheKey = `store_config_${window.LOJA_ID}`;
    const cacheTimeKey = `store_config_time_${window.LOJA_ID}`;
    const CACHE_TTL = 1000 * 60 * 15; // 15 minutos

    try {
        // ESTRATÉGIA DE CACHE: Lê os dados salvos localmente
        const cachedConfig = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedConfig && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_TTL) {
            const config = JSON.parse(cachedConfig);

            // VERIFICAÇÃO DE BLOQUEIO (Até no Cache)
            const dataVencimento = new Date(config.vencimento);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            dataVencimento.setHours(0, 0, 0, 0);

            if (config.status_assinatura !== 'ativa' || hoje > dataVencimento) {
                mostrarTelaBloqueioSaaS(config.nome_loja);
                return false;
            }

            window.LOJA_CONFIG = config;
            aplicarConfiguracoesVisuais(config);
            return true; // Economiza a requisição ao Supabase!
        }

        // SE O CACHE ESTÁ VAZIO OU VENCEU: Busca no Supabase
        const { data: config, error } = await _supabase
            .from('store_config')
            .select('*') // Busca todas as informações
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

        // VERIFICAÇÃO DE BLOQUEIO DA MENSALIDADE
        const dataVencimento = new Date(config.vencimento);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        dataVencimento.setHours(0, 0, 0, 0);

        if (config.status_assinatura !== 'ativa' || hoje > dataVencimento) {
            mostrarTelaBloqueioSaaS(config.nome_loja);
            return false;
        }

        // Salva os dados mais recentes no Cache
        localStorage.setItem(cacheKey, JSON.stringify(config));
        localStorage.setItem(cacheTimeKey, Date.now().toString());

        window.LOJA_CONFIG = config;
        aplicarConfiguracoesVisuais(config);

        return true;

    } catch (e) {
        console.error("Erro no Motor Camaleão:", e);
        return false;
    }
};