// /src/services/auth.js
import { supabase } from './api.js';
import { ui } from './ui.js';
import { NotificationService } from './notificationService.js';

export const auth = {
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        return error ? null : session;
    },

    async signIn(email, password, logoUrl = null) {
        ui.showLoader();
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            ui.showToast('Login realizado com sucesso!', 'success');

            // Liga o radar PWA (Notificações) após login com sucesso
            if (data.session) {
                NotificationService.initRealtime(data.session.user.id, logoUrl);
            }

            return data.session;
        } catch (err) {
            ui.showToast('Credenciais inválidas.', 'error');
            return null;
        } finally {
            ui.hideLoader();
        }
    },

    async signUp(email, password, name) {
        ui.showLoader();
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });
            if (error) throw error;
            ui.showToast('Conta criada com sucesso!', 'success');
            return data.session;
        } catch (err) {
            ui.showToast('Erro ao criar conta.', 'error');
            return null;
        } finally {
            ui.hideLoader();
        }
    },

    // 🌟 PROTEÇÃO DE ROTA BLINDADA (Zero Trust para Admins)
    async checkAccess(requiredRole = 'admin') {
        ui.showLoader();

        try {
            const session = await this.getSession();
            if (!session) return this._failAccess();

            // Ativa notificações para o usuário validado
            NotificationService.initRealtime(session.user.id);

            const cacheKey = 'alfa_profile_cache';
            const cachedData = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
            const now = Date.now();
            let profile;

            // 🛡️ ZERO TRUST: Se exige cargo específico (Admin), NUNCA confia no Cache.
            // O Cache do navegador pode ser fraudado (Spoofing). Sempre bate no banco.
            if (requiredRole !== 'any') {
                const { data, error } = await supabase
                    .from('store_admins')
                    .select('role, loja_id')
                    .eq('user_id', session.user.id)
                    .single();

                if (error || !data) throw new Error("Perfil não encontrado");
                profile = data;

                // Salva o cache real apenas para uso cosmético futuro
                sessionStorage.setItem(cacheKey, JSON.stringify({ profile, timestamp: now }));

            } else {
                // Se o cargo for 'any' (qualquer cliente comum logado), é seguro usar o Cache de 5 minutos
                if (cachedData && (now - cachedData.timestamp) < 300000) {
                    profile = cachedData.profile;
                } else {
                    const { data, error } = await supabase
                        .from('store_admins')
                        .select('role, loja_id')
                        .eq('user_id', session.user.id)
                        .single();

                    if (error || !data) throw new Error("Perfil não encontrado");
                    profile = data;
                    sessionStorage.setItem(cacheKey, JSON.stringify({ profile, timestamp: now }));
                }
            }

            const currentLojaId = localStorage.getItem('loja_atual_id');
            const hasRole = requiredRole === 'any' || profile.role === requiredRole;

            if (!hasRole || profile.loja_id !== currentLojaId) {
                ui.showToast("Acesso Negado ou Privilégio Revogado.", "error");
                return this._failAccess();
            }

            return true;
        } catch (error) {
            return this._failAccess(true);
        } finally {
            ui.hideLoader();
        }
    },

    async _failAccess(isError = false) {
        if (isError) ui.showToast("Sessão inválida. Faça login.", "error");
        sessionStorage.removeItem('alfa_profile_cache');
        await supabase.auth.signOut();
        const lojaId = localStorage.getItem('loja_atual_id') || 'alfa';
        window.location.replace(`cliente-login.html?loja=${lojaId}`);
        return false;
    }
};