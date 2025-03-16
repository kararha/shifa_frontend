import { writable } from 'svelte/store';

type User = {
    id: number;
    email: string;
    name: string;
    role: string;
};

type AuthState = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
};

function createAuthStore() {
    const { subscribe, set } = writable<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false
    });

    // Try to restore auth state immediately
    try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            const user = JSON.parse(storedUser);
            set({ user, token, isAuthenticated: true });
        }
    } catch (e) {
        console.error('Failed to restore auth state:', e);
    }

    return {
        subscribe,
        login: (user: User, token: string, refresh_token?: string) => {
            console.log('Setting auth state for:', user.email);
            
            // Update store first
            set({
                user,
                token,
                isAuthenticated: true
            });

            // Then persist to storage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
            }

            // Set session cookies
            const expires = new Date(Date.now() + 24*60*60*1000).toUTCString();
            document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; expires=${expires}`;
            document.cookie = `token=${token}; path=/; expires=${expires}`;
            if (refresh_token) {
                document.cookie = `refresh_token=${refresh_token}; path=/; expires=${expires}`;
            }
        },
        logout: () => {
            // Clear both localStorage and cookies
            localStorage.clear();
            document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            
            set({ user: null, token: null, isAuthenticated: false });
        }
    };
}

export const authStore = createAuthStore();
