import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { logAuth } from '$lib/utils/authDebug';

// Initialize auth state from localStorage or default empty state
function createAuthStore() {
    // Default initial state
    const initialState = {
        user: null,
        token: null,
        isAuthenticated: false
    };

    // Try to load previous state from localStorage
    if (browser) {
        try {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            
            if (storedUser && storedToken) {
                const user = JSON.parse(storedUser);
                initialState.user = user;
                initialState.token = storedToken;
                initialState.isAuthenticated = true;
                
                logAuth('authStore', 'Initialized from localStorage', { userId: user.id, role: user.role });
                
                // Ensure cookies are also set (for server-side checks)
                document.cookie = `token=${storedToken}; path=/; max-age=86400`;
                document.cookie = `user=${encodeURIComponent(storedUser)}; path=/; max-age=86400`;
            }
        } catch (err) {
            console.error('Error initializing auth store from localStorage:', err);
            logAuth('authStore', 'Init error', err.message);
        }
    }

    const { subscribe, set, update } = writable(initialState);

    return {
        subscribe,
        
        // Login: update store and persist to localStorage
        login: (user, token) => {
            logAuth('authStore', 'Login', { userId: user.id, role: user.role });
            
            if (browser) {
                // Persist to localStorage
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', token);
                
                // Set cookies for server-side auth checks
                document.cookie = `token=${token}; path=/; max-age=86400`;
                document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;
            }
            
            // Update the store
            set({
                user,
                token,
                isAuthenticated: true
            });
        },
        
        // Logout: clear store and remove from localStorage
        logout: () => {
            logAuth('authStore', 'Logout');
            
            if (browser) {
                // Remove from localStorage
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                
                // Clear cookies
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
            
            // Reset the store
            set({
                user: null,
                token: null,
                isAuthenticated: false
            });
        },
        
        // Update user info without changing authentication state
        updateUser: (userData) => {
            logAuth('authStore', 'Update user', userData);
            
            update(state => {
                const updatedUser = { ...state.user, ...userData };
                
                if (browser) {
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    document.cookie = `user=${encodeURIComponent(JSON.stringify(updatedUser))}; path=/; max-age=86400`;
                }
                
                return {
                    ...state,
                    user: updatedUser
                };
            });
        },
        
        // Check if auth is valid and repair if needed
        checkAuth: () => {
            if (!browser) return false;
            
            try {
                const storedUser = localStorage.getItem('user');
                const storedToken = localStorage.getItem('token');
                
                // Get current state
                update(state => {
                    // If localStorage has auth but store doesn't, restore it
                    if (storedUser && storedToken && !state.isAuthenticated) {
                        logAuth('authStore', 'Repairing auth state from localStorage');
                        
                        const user = JSON.parse(storedUser);
                        
                        // Ensure cookies are set
                        document.cookie = `token=${storedToken}; path=/; max-age=86400`;
                        document.cookie = `user=${encodeURIComponent(storedUser)}; path=/; max-age=86400`;
                        
                        return {
                            user,
                            token: storedToken,
                            isAuthenticated: true
                        };
                    }
                    
                    return state;
                });
                
                // Return the final authentication state
                let isAuth = false;
                subscribe(state => {
                    isAuth = state.isAuthenticated;
                })();
                
                logAuth('authStore', `Auth check result: ${isAuth}`);
                return isAuth;
            } catch (err) {
                console.error('Error checking auth:', err);
                logAuth('authStore', 'Auth check error', err.message);
                return false;
            }
        }
    };
}

export const authStore = createAuthStore();
