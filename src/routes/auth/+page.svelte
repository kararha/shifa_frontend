// src/routes/auth/+page.svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { authStore } from '$lib/stores/authStore';
    import AuthForm from '$lib/components/auth/AuthForm.svelte';

    let loading = false;
    let error: string | null = null;

    async function handleAuth(authData: { username: string; password: string; }) {
        loading = true;
        try {
            await authStore.login(authData);
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }
</script>

{#if loading}
    <p>Loading...</p>
{:else if error}
    <p>Error: {error}</p>
{:else}
    <div class="auth-page">
        <h1>Login</h1>
        <AuthForm on:submit={handleAuth} />
    </div>
{/if}

// src/lib/stores/authStore.ts
import { writable } from 'svelte/store';
import { api } from '$lib/api';

function createAuthStore() {
    const { subscribe, set } = writable({
        user: null,
        token: null,
        error: null
    });

    return {
        subscribe,
        login: async (authData: { username: string; password: string; }) => {
            try {
                const response = await api.post('/auth/login', authData);
                set({ user: response.data.user, token: response.data.token, error: null });
            } catch (error) {
                set({ user: null, token: null, error: error.message });
            }
        },
        logout: () => {
            set({ user: null, token: null, error: null });
        }
    };
}

export const authStore = createAuthStore();