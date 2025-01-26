import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
    name: string;
    profile_picture_url?: string;
    id?: string;
    role?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

// Safe initialization function
function getInitialState(): AuthState {
    if (browser) {
        try {
            const userCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('user='));
            
            if (userCookie) {
                const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
                return {
                    user: userData,
                    isAuthenticated: true
                };
            }
        } catch (e) {
            console.error('Error loading auth state:', e);
        }
    }
    
    return {
        user: null,
        isAuthenticated: false
    };
}

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(getInitialState());

    return {
        subscribe,
        setUser: (user: User) => {
            if (browser) {
                document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/`;
                set({ user, isAuthenticated: true });
            }
        },
        logout: () => {
            if (browser) {
                document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                document.cookie = 'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                set({ user: null, isAuthenticated: false });
            }
        }
    };
}

export const authStore = createAuthStore();
