<script lang="ts">
    import { onMount } from 'svelte';
    import { authStore } from '$lib/stores/authStore';
    
    let user = $authStore.user;
</script>

<div class="container mx-auto px-6 py-8">
    <h1 class="text-3xl font-bold mb-8">Welcome to Admin Dashboard</h1>
    
    {#if user}
        <div class="bg-gray-800/50 p-6 rounded-lg mb-8">
            <h2 class="text-xl font-bold mb-4">Admin Profile</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-900/50 p-4 rounded">
                    <div class="text-gray-400">Name</div>
                    <div class="text-xl">{user.name}</div>
                </div>
                <div class="bg-gray-900/50 p-4 rounded">
                    <div class="text-gray-400">Email</div>
                    <div class="text-xl">{user.email}</div>
                </div>
                <div class="bg-gray-900/50 p-4 rounded">
                    <div class="text-gray-400">User ID</div>
                    <div class="text-xl">{user.id}</div>
                </div>
                <div class="bg-gray-900/50 p-4 rounded">
                    <div class="text-gray-400">Role</div>
                    <div class="text-xl">{user.role}</div>
                </div>
            </div>
        </div>
    {/if}
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-blue-900/20 hover:bg-blue-900/30 transition-colors p-6 rounded-lg">
            <h3 class="text-xl font-bold mb-2">Manage Doctors</h3>
            <p class="text-gray-300 mb-4">View and manage doctor profiles</p>
            <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                View Doctors
            </button>
        </div>
        
        <div class="bg-purple-900/20 hover:bg-purple-900/30 transition-colors p-6 rounded-lg">
            <h3 class="text-xl font-bold mb-2">Manage Providers</h3>
            <p class="text-gray-300 mb-4">View and manage care providers</p>
            <button class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
                View Providers
            </button>
        </div>
        
        <div class="bg-green-900/20 hover:bg-green-900/30 transition-colors p-6 rounded-lg">
            <h3 class="text-xl font-bold mb-2">User Management</h3>
            <p class="text-gray-300 mb-4">Manage patient accounts</p>
            <button class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                Manage Users
            </button>
        </div>
    </div>
</div>
