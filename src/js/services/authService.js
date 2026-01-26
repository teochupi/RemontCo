import { supabase } from './supabase.js';

export const authService = {
    async signUp(email, password, metadata) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata // Тук записваме име, роля, ЕИК
            }
        });
        return { data, error };
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};
