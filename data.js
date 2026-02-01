// data.js - Configurações Centrais
const CONFIG = {
    dono: "Theverton",
    insta: "https://instagram.com/seu_instagram",
    pixKey: "84987371966", // Sua chave Pix
    
    // COLOQUE O LINK DO SEU LOGO AQUI ENTRE AS ASPAS
    // Se não tiver, use este placeholder para testar: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png"
    logo: "https://zpdpscjjxqkbuhesdtyq.supabase.co/storage/v1/object/public/assets/WhatsApp%20Image%202026-01-31%20at%2011.18.35.jpeg" 
};

// Inicializa Supabase
const SB_URL = 'https://zpdpscjjxqkbuhesdtyq.supabase.co';
const SB_KEY = 'sb_publishable_3uaoU1fmUEKBrDmbhnk0qw_j3hsPk06';

if (typeof supabase !== 'undefined') {
    window._supabase = supabase.createClient(SB_URL, SB_KEY);
}