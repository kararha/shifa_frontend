import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { api } from '$lib/api';

interface AuthState {
    user: any | null;
    token: string | null;
    error: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    token: null,
    error: null,
    isAuthenticated: false
};

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,
        login: async (credentials: { email: string; password: string }) => {
            try {
                const response = await api.login(credentials.email, credentials.password) as { user: any; token: string };
                const authData = {
                    user: response.user,
                    token: response.token,
                    error: null,
                    isAuthenticated: true
                };
                set(authData);
                
                // Store auth data in localStorage
                if (browser) {
                    localStorage.setItem('auth', JSON.stringify(authData));
                }
                
                return response;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Login failed';
                update(state => ({ ...state, error: errorMessage }));
                throw error;
            }
        },
        logout: () => {
            set(initialState);
            if (browser) {
                localStorage.removeItem('auth');
            }
        },
        initialize: () => {
            if (browser) {
                const stored = localStorage.getItem('auth');
                if (stored) {
                    try {
                        const authData = JSON.parse(stored);
                        set({...authData, isAuthenticated: !!authData.token});
                    } catch {
                        localStorage.removeItem('auth');
                    }
                }
            }
        }
    };
}

export const authStore = createAuthStore();

// Initialize auth state on app load
if (browser) {
    authStore.initialize();
}
