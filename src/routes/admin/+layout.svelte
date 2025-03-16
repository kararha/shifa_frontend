<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/authStore';
    import { browser } from '$app/environment';

    let isLoading = true;

    onMount(async () => {
        if (!browser) return;

        // Small delay to ensure auth store is hydrated
        await new Promise(resolve => setTimeout(resolve, 100));

        const user = $authStore.user;
        const token = localStorage.getItem('token');

        console.log('Admin check:', { 
            user, 
            token,
            isAuth: $authStore.isAuthenticated,
            role: user?.role 
        });

        if (!user || user.role !== 'admin') {
            console.log('Access denied');
            window.location.href = '/login';
            return;
        }

        isLoading = false;
    });
</script>

{#if isLoading}
    <div class="loading">Verifying admin access...</div>
{:else}
    <slot />
{/if}

<style>
    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 1.2rem;
    }
</style>
