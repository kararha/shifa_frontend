import { writable } from 'svelte/store';

export const authStore = writable({
  user: null,
  token: null,
  isAuthenticated: false
});

export function initAuth() {
  const storedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (storedUser && token) {
    try {
      const user = JSON.parse(storedUser);
      authStore.set({
        user,
        token,
        isAuthenticated: true
      });
      return true;
    } catch (e) {
      console.error('Error initializing auth:', e);
      clearAuth();
    }
  }
  return false;
}

export function clearAuth() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  authStore.set({
    user: null,
    token: null,
    isAuthenticated: false
  });
}
