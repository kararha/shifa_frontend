<script lang="ts">
    import { fade } from 'svelte/transition';

    // Mock data for dashboard
    const mockStats = {
        total_patients: 150,
        total_doctors: 45,
        total_providers: 30,
        total_appointments: 320,
        total_consultations: 280,
        total_revenue: 25000
    };

    // Mock data for recent activities
    const mockActivities = [
        {
            id: 1,
            type: 'appointment',
            description: 'New appointment scheduled with Dr. Smith',
            timestamp: new Date().toISOString(),
            status: 'pending'
        },
        {
            id: 2,
            type: 'registration',
            description: 'New doctor registration',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            status: 'completed'
        },
        {
            id: 3,
            type: 'consultation',
            description: 'Online consultation completed',
            timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            status: 'completed'
        }
    ];

    let stats = mockStats;
    let recentActivities = mockActivities;
    let loading = false;
    let error: string | null = null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    {#if loading}
        <div class="flex justify-center items-center h-64" transition:fade>
            <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    {:else if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-8" transition:fade>
            <p>{error}</p>
            <button class="glass-button mt-4" on:click={() => window.location.href = '/login'}>
                Return to Login
            </button>
        </div>
    {:else}
        <div class="max-w-7xl mx-auto space-y-8" transition:fade>
            <!-- Header -->
            <div class="glass-card">
                <h1 class="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>
                
                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-panel">
                        <h3 class="text-lg font-semibold text-white mb-2">Users</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-400">Patients</p>
                                <p class="text-2xl text-white">{stats?.total_patients || 0}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-400">Doctors</p>
                                <p class="text-2xl text-white">{stats?.total_doctors || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel">
                        <h3 class="text-lg font-semibold text-white mb-2">Services</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-400">Appointments</p>
                                <p class="text-2xl text-white">{stats?.total_appointments || 0}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-400">Consultations</p>
                                <p class="text-2xl text-white">{stats?.total_consultations || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel">
                        <h3 class="text-lg font-semibold text-white mb-2">Revenue</h3>
                        <p class="text-3xl text-white">{formatCurrency(stats?.total_revenue || 0)}</p>
                        <p class="text-sm text-gray-400 mt-1">Total Revenue</p>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="glass-card">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold text-white">Recent Activity</h2>
                    <button class="glass-button">View All</button>
                </div>

                <div class="space-y-4">
                    {#each recentActivities as activity}
                        <div class="glass-panel flex items-center justify-between">
                            <div>
                                <p class="text-white font-medium">{activity.description}</p>
                                <p class="text-sm text-gray-400">{formatDate(activity.timestamp)}</p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-sm" 
                                class:bg-green-500={activity.status === 'completed'}
                                class:bg-yellow-500={activity.status === 'pending'}
                                class:bg-red-500={activity.status === 'cancelled'}>
                                {activity.status}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button class="glass-button-primary">
                    <span class="block text-lg">Add New Doctor</span>
                </button>
                <button class="glass-button-primary">
                    <span class="block text-lg">View Reports</span>
                </button>
                <button class="glass-button-primary">
                    <span class="block text-lg">System Settings</span>
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .dashboard {
        padding: 2rem;
    }
    .profile-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    .admin-actions {
        margin-top: 2rem;
    }
    .admin-actions button {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
    }
    .glass-card {
        @apply p-6 rounded-xl;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .glass-panel {
        @apply p-4 rounded-lg;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .glass-button {
        @apply px-4 py-2 rounded-lg text-white font-semibold;
        background: rgba(59, 130, 246, 0.5);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(59, 130, 246, 0.3);
        transition: all 0.2s ease-in-out;
    }

    .glass-button:hover {
        background: rgba(59, 130, 246, 0.7);
        transform: translateY(-1px);
    }

    .glass-button-primary {
        @apply w-full p-4 rounded-lg text-white font-semibold;
        background: rgba(37, 99, 235, 0.8);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(59, 130, 246, 0.5);
        transition: all 0.2s ease-in-out;
    }

    .glass-button-primary:hover {
        background: rgba(37, 99, 235, 0.9);
        transform: translateY(-1px);
    }
</style>
