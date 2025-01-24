// src/lib/utils/auth.ts
import { writable } from 'svelte/store';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: any | null;
}

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>({
        isAuthenticated: false,
        token: null,
        user: null
    });

    return {
        subscribe,
        login: (token: string, user: any) => update(state => ({
            isAuthenticated: true,
            token,
            user
        })),
        logout: () => set({
            isAuthenticated: false,
            token: null,
            user: null
        }),
        updateUser: (userData: any) => update(state => ({
            ...state,
            user: userData
        }))
    };
}

export const authStore = createAuthStore();