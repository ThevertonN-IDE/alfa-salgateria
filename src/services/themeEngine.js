// /src/services/themeEngine.js
import { getLojaId } from './api.js';

const converterHexParaRgb = (hex) => {
    const safeHex = /^#[0-9A-F]{6}$/i.test(hex) ? hex : '#ea580c';
    return {
        hex: safeHex,
        rgb: `${parseInt(safeHex.slice(1, 3), 16)}, ${parseInt(safeHex.slice(3, 5), 16)}, ${parseInt(safeHex.slice(5, 7), 16)}`
    };
};

export const themeEngine = {
    applyFromCache() {
        const lojaId = getLojaId();
        const cachedRgb = localStorage.getItem(`tema_cor_${lojaId}`);
        const cachedLogo = localStorage.getItem(`tema_logo_${lojaId}`);
        const isDark = localStorage.getItem('tema') === 'dark';

        // Batch update para evitar DOM Thrashing
        requestAnimationFrame(() => {
            const root = document.documentElement;
            if (cachedRgb) root.style.setProperty('--primary-rgb', cachedRgb);
            if (isDark) root.classList.add('dark');
            
            if (cachedLogo) {
                document.querySelectorAll('.logo-loja-dinamica, #loader-logo')
                        .forEach(img => img.src = cachedLogo);
            }
        });
    },

    applyFullTheme(config) {
        if (!config) return;
        const lojaId = getLojaId();
        const primary = converterHexParaRgb(config.cor_primaria);
        const secondary = /^#[0-9A-F]{6}$/i.test(config.cor_secundaria) ? config.cor_secundaria : '#ffffff';
        const isDark = document.documentElement.classList.contains('dark');
        
        // Cacheia a cor imediatamente
        localStorage.setItem(`tema_cor_${lojaId}`, primary.rgb);

        // Agrupa todas as manipulações de DOM no próximo Frame do navegador
        requestAnimationFrame(() => {
            const root = document.documentElement;
            
            // 1. Variáveis CSS
            root.style.setProperty('--primary-hex', primary.hex);
            root.style.setProperty('--primary-rgb', primary.rgb);
            root.style.setProperty('--secondary-color', secondary);

            // 2. Textos Seguros (innerText previne XSS nativamente, sem precisar de Regex)
            const nomeLoja = config.nome_loja || 'Alfa App';
            document.title = `${nomeLoja} - Cardápio`;
            document.querySelectorAll('.nome-loja-dinamico').forEach(el => el.textContent = nomeLoja);

            // 3. PWA Status Bar
            let metaTheme = document.querySelector('meta[name="theme-color"]');
            if (!metaTheme) {
                metaTheme = document.createElement('meta');
                metaTheme.name = "theme-color";
                document.head.appendChild(metaTheme);
            }
            metaTheme.setAttribute('content', isDark ? '#111827' : primary.hex);
        });

        // 4. Tratamento Assíncrono de Imagens
        if (config.logo_url?.startsWith('http')) {
            const imgPreload = new Image();
            imgPreload.src = config.logo_url;
            
            imgPreload.onload = () => {
                requestAnimationFrame(() => {
                    document.querySelectorAll('.logo-loja-dinamica, #loader-logo')
                            .forEach(img => img.src = config.logo_url);
                    
                    let favicon = document.querySelector("link[rel~='icon']") || document.createElement('link');
                    favicon.rel = 'icon';
                    favicon.href = config.logo_url;
                    document.head.appendChild(favicon);
                });
                localStorage.setItem(`tema_logo_${lojaId}`, config.logo_url);
            };

            imgPreload.onerror = () => localStorage.removeItem(`tema_logo_${lojaId}`);
        }
    }
};