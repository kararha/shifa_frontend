import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { api } from '$lib/api';

interface LoginResponse {
    user: any;
    token: string;
}

interface AuthState {
    user: any | null;
    token: string | null;
    error: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: browser ? JSON.parse(localStorage.getItem('user') || 'null') : null,
    token: browser ? localStorage.getItem('token') : null,
    error: null,
    isAuthenticated: browser ? Boolean(localStorage.getItem('isLoggedIn')) : false
};

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,
        login: async (credentials: { email: string; password: string }) => {
            try {
                const response = await api.login(credentials.email, credentials.password) as LoginResponse;
                const authData = {
                    user: response.user,
                    token: response.token,
                    error: null,
                    isAuthenticated: true
                };
                
                // Update store state
                set(authData);
                
                // Store auth data in localStorage and cookies
                if (browser) {
                    localStorage.setItem('user', JSON.stringify(authData.user));
                    localStorage.setItem('token', authData.token);
                    localStorage.setItem('isLoggedIn', 'true');
                }

                return authData;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Login failed';
                set({ ...initialState, error: errorMsg });
                throw err; 
            }
        },
        logout: () => {
            // Clear store state
            set(initialState);
            
            // Clear localStorage and cookies
            if (browser) {
                localStorage.removeItem('user');
                localStorage.removeItem('token'); 
                localStorage.removeItem('isLoggedIn');
                document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                document.cookie = 'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
        }
    };
}

export const authStore = createAuthStore();
