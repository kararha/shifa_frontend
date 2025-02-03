<script lang="ts">
    import { authStore } from '$lib/stores/authStore';
    import Icon from '@iconify/svelte';

    function handleLogout() {
        authStore.logout();
        window.location.href = '/login';
    }

    $: userRole = $authStore?.user?.role || 'guest';
</script>

<nav class="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50">
    <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <a href="/" class="flex items-center space-x-3">
                <Icon icon="material-symbols:medication" class="text-2xl text-blue-400" />
                <span class="text-xl font-bold text-white">Shfia</span>
            </a>

            <!-- Navigation Links -->
            <div class="hidden md:flex items-center space-x-4">
                <a href="/" class="nav-link">Home</a>
                <a href="/doctors" class="nav-link">Doctors</a>
                <a href="/services" class="nav-link">Services</a>
                {#if userRole === 'admin'}
                    <a href="/admin/dashboard" class="nav-link">Dashboard</a>
                {/if}
            </div>

            <!-- User Menu -->
            {#if $authStore?.isAuthenticated}
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-300">
                        Welcome, {$authStore.user?.name}
                    </span>
                    <button 
                        on:click={handleLogout}
                        class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>
            {:else}
                <div class="flex items-center space-x-4">
                    <a href="/login" class="nav-link-button">Login</a>
                    <a href="/register" class="nav-link-button bg-blue-500/20 hover:bg-blue-500/30">
                        Register
                    </a>
                </div>
            {/if}
        </div>
    </div>
</nav>

<style>
    .nav-link {
        @apply text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm transition-colors;
    }

    .nav-link-button {
        @apply px-4 py-2 rounded-lg text-sm text-white transition-colors bg-gray-700/50 hover:bg-gray-700/70;
    }
</style>
