import { writable } from 'svelte/store';

// Create a writable store with initial values
const createAuthStore = () => {
  const { subscribe, set, update } = writable({
    user: null,
    isLoggedIn: false,
    token: null
  });

  return {
    subscribe,
    
    // Set user data and login state
    login: (userData, token) => {
      set({ 
        user: userData, 
        isLoggedIn: true,
        token
      });
      
      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      if (token) localStorage.setItem('token', token);
    },
    
    // Clear user data and login state
    logout: () => {
      set({
        user: null,
        isLoggedIn: false,
        token: null
      });
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('token');
    },
    
    // Update user data
    updateUser: (userData) => {
      update(state => {
        const updatedUser = { ...state.user, ...userData };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return {
          ...state,
          user: updatedUser
        };
      });
    }
  };
};

// Export the store
export const authStore = createAuthStore();
