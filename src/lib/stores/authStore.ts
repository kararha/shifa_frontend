import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
  id?: string;
  name?: string;
  role?: string;
  profile_picture_url?: string;
  // Add other user properties as needed
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

const defaultState: AuthState = {
  isAuthenticated: false,
  user: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(defaultState);

  return {
    subscribe,
    set: (value: AuthState) => {
      if (browser) {
        localStorage.setItem('auth', JSON.stringify(value));
      }
      set(value);
    },
    login: (user: User, token: string) => {
      const authState = { isAuthenticated: true, user };
      if (browser) {
        localStorage.setItem('auth', JSON.stringify(authState));
        localStorage.setItem('token', token);
      }
      set(authState);
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
      }
      set(defaultState);
    },
    init: () => {
      if (browser) {
        const stored = localStorage.getItem('auth');
        if (stored) {
          set(JSON.parse(stored));
        }
      }
    }
  };
}

export const authStore = createAuthStore();
