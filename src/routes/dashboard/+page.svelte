<script lang="ts">
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/authStore';

    // Redirect if not authenticated
    $: if (!$authStore?.token) {
        goto('/login');
    }
</script>

<div class="dashboard">
    <h1>Dashboard</h1>
    <!-- Add your dashboard content here -->
</div>

<style>
    .dashboard {
        padding: 2rem;
    }
</style>
