<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  
  // Initialize auth store if needed
  onMount(() => {
    // Check for existing login info
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = localStorage.getItem('user');
    
    if (isLoggedIn && userData) {
      try {
        const user = JSON.parse(userData);
        // You can set up your auth store here when you create it
        // authStore.set({ user, isLoggedIn: true });
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  });
</script>

<slot />

<style>
  /* Global styles can go here */
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>