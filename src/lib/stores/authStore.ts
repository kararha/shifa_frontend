import { writable } from 'svelte/store';

export interface User {
    id: number;
    email: string;
    role: string;
    name: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
}

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>({
        isAuthenticated: false,
        token: null,
        user: null
    });

    return {
        subscribe,
        setUser: (user: User) => {
            update(state => ({ ...state, user, isAuthenticated: true }));
        },
        login: (token: string, user: User) => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            }
            set({ isAuthenticated: true, token, user });
        },
        logout: () => {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            set({ isAuthenticated: false, token: null, user: null });
        },
        updateUser: (user: User) => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(user));
            }
            update(state => ({ ...state, user }));
        },
        initialize: () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                if (token && user) {
                    set({ isAuthenticated: true, token, user });
                }
            }
        }
    };
}

export const authStore = createAuthStore();
