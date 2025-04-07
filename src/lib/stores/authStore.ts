import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Define the user interface
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    profile_picture_url?: string;
}

// Define the auth store interface
interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
}

// Default state
const defaultState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
};

// Create the store with either the stored state or default
function createAuthStore() {
    // Initialize from localStorage if in browser
    let initialState = defaultState;
    
    if (browser) {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
            try {
                const user = JSON.parse(storedUser);
                initialState = {
                    isAuthenticated: true,
                    user,
                    token
                };
                console.log('Auth store initialized with user:', user.name, 'role:', user.role);
            } catch (error) {
                console.error('Error parsing stored user:', error);
            }
        }
    }
    
    const { subscribe, set, update } = writable<AuthState>(initialState);
    
    return {
        subscribe,
        login: (user: User, token: string) => {
            console.log('Auth store: login called with user:', user.name, 'role:', user.role);
            if (browser) {
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', token);
            }
            set({ isAuthenticated: true, user, token });
        },
        logout: () => {
            console.log('Auth store: logout called');
            if (browser) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
            }
            set(defaultState);
        },
        updateUser: (user: User) => {
            update(state => {
                if (browser && state.isAuthenticated) {
                    localStorage.setItem('user', JSON.stringify(user));
                }
                return { ...state, user };
            });
        }
    };
}

export const authStore = createAuthStore();
