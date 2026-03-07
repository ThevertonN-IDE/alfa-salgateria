// /src/services/notificationService.js
import { supabase } from './api.js';

export const NotificationService = {
    _channel: null,

    async initRealtime(userId, lojaUrlLogo) {
        // Pede permissão PWA de forma amigável
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        // Previne vazamento de memória com múltiplas inscrições
        if (this._channel) await supabase.removeChannel(this._channel);

        this._channel = supabase.channel(`user-tracker-${userId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                this._dispatchNativeNotification(payload.new.status, payload.new.id, lojaUrlLogo);
                // Grita para o sistema que um pedido mudou (para atualizar badges/listas)
                document.dispatchEvent(new CustomEvent('alfa:orderStatusChanged'));
            })
            .subscribe();
    },

    _dispatchNativeNotification(status, orderId, logoUrl) {
        const idCurto = String(orderId).slice(0, 4).toUpperCase();
        const map = {
            'preparo': { title: "👨‍🍳 Pedido Aceito!", body: `Pedido #${idCurto} na cozinha.` },
            'saiu_entrega': { title: "🛵 Saiu para Entrega!", body: `Pedido #${idCurto} a caminho.` },
            'entregue': { title: "✅ Entregue", body: `Bom apetite!` },
        };

        const config = map[status];
        if (!config) return;

        // Feedback Visual na Tela (UI unificada que criamos antes)
        if (window.Swal) {
            Swal.fire({ toast: true, position: 'top', icon: 'info', title: config.title, text: config.body, timer: 5000 });
        }

        // PWA Push Notification (Funciona em Background)
        if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(config.title, {
                    body: config.body,
                    icon: logoUrl || '/assets/default-logo.png',
                    vibrate: [200, 100, 200],
                    tag: `pedido-${orderId}` // Substitui a notificação antiga do mesmo pedido
                });
            });
        }
    }
};