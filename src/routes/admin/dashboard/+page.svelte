<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import Icon from '@iconify/svelte';
    import { formatCurrency } from '$lib/utils';
    import { api } from '$lib/api/client';
    import { authStore } from '$lib/stores/authStore';
    import DashboardCharts from '$lib/components/charts/DashboardCharts.svelte';
    import { exportToCSV } from '$lib/utils/export';
    import { ActivityLogger } from '$lib/services/activityLog';

    let stats = {
        doctors: 0,
        patients: 0,
        appointments: 0,
        revenue: 0
    };
    
    interface Activity {
        type: string;
        title: string;
        date: Date;
        status: string;
    }

    interface Payment {
        amount: number;
    }
    
    interface User {
        id: number;
        email: string;
        name: string;
        role: string;
        created_at: string;
        updated_at: string;
        status?: 'active' | 'inactive';
    }

    let activities: Activity[] = [];
    let users: User[] = [];
    let loading = true;
    let error: string | null = null;
    let mounted = false;
    let initialLoad = true;
    let usersLoading = false;
    let usersError: string | null = null;

    // Add pagination state
    let currentPage = 1;
    let pageSize = 10;
    let searchTerm = '';
    let filterRole = 'all';
    
    // Filter users based on search and role
    $: filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    // Paginate users
    $: paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * pageSize, 
        currentPage * pageSize
    );

    $: totalPages = Math.ceil(filteredUsers.length / pageSize);

    // Add user management functions
    async function deleteUser(userId: number) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            await api.delete(`/users/${userId}`);
            await ActivityLogger.logUserAction('DELETE_USER', userId, 'User deleted');
            await loadUsers(); // Reload users after deletion
        } catch (err) {
            console.error('Failed to delete user:', err);
        }
    }

    async function updateUserRole(userId: number, newRole: string) {
        try {
            await api.put(`/users/${userId}`, { role: newRole });
            await loadUsers(); // Reload users after update
        } catch (err) {
            console.error('Failed to update user role:', err);
        }
    }

    $: if ($authStore.isAuthenticated && !mounted) {
        loadDashboardData();
    }

    onMount(async () => {
        const isAuthed = $authStore?.isAuthenticated;
        if (!isAuthed) {
            error = 'Please login to access dashboard';
            loading = false;
            return;
        }

        await loadDashboardData();
        await loadUsers();
    });

    let appointmentsData: any[] = []; // Add this line to store appointments data
    let paymentsData: any[] = []; // Add this line to store payments data

    async function loadDashboardData() {
        mounted = true;
        loading = true;
        error = null;

        try {
            // Update endpoints to match your Go backend routes
            const responses = await Promise.allSettled([
                api.get('doctors'),
                api.get('patients'),
                api.get('home-care-visits'), // Changed from appointments
                api.get('transactions')      // Changed from payments
            ]);

            // Debug logging
            const endpoints = ['doctors', 'patients', 'home-care-visits', 'transactions'];
            responses.forEach((response, index) => {
                console.log(`API ${endpoints[index]}:`, response);
            });

            const [doctors, patients, appointments, payments] = responses.map(r => 
                r.status === 'fulfilled' ? r.value?.data || [] : []
            );

            // Store data for charts and other components
            appointmentsData = appointments;
            paymentsData = payments;

            // Update stats with fallbacks for missing data
            stats = {
                doctors: doctors?.length || 0,
                patients: patients?.length || 0,
                appointments: appointments?.length || 0,
                revenue: payments?.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0) || 0
            };

            // Initialize activities with empty array if no appointments
            activities = (Array.isArray(appointments) ? appointments : [])
                .filter(apt => apt && typeof apt === 'object')
                .slice(0, 5)
                .map(apt => ({
                    type: 'appointment',
                    title: `Appointment with Dr. ${apt.doctor_name || 'Unknown'}`,
                    date: new Date(apt.appointment_date || apt.date || Date.now()),
                    status: apt.status?.toLowerCase() || 'pending'
                }));

            // Show warning for failed endpoints
            const failedEndpoints = responses
                .map((r, i) => r.status === 'rejected' ? endpoints[i] : null)
                .filter(Boolean);
            
            if (failedEndpoints.length > 0) {
                console.warn(`Failed endpoints: ${failedEndpoints.join(', ')}`);
            }

            loading = false;
            initialLoad = false;

        } catch (err) {
            console.error('Dashboard load error:', err);
            error = 'Some dashboard data failed to load, but you can still view available information.';
        } finally {
            // Ensure loading state is always cleared
            loading = false;
            initialLoad = false;
        }
    }

    async function loadUsers() {
        usersLoading = true;
        try {
            const response = await api.get<User[]>('/users');
            console.log('Users response:', response);
            
            // Map the response to include status
            users = (response.data || []).map(user => ({
                ...user,
                status: user.updated_at ? 'active' : 'inactive',
                name: user.name || 'Unknown User'
            }));

            console.log('Processed users:', users);
        } catch (err) {
            usersError = err instanceof Error ? err.message : 'Failed to load users';
            console.error('Users error:', err);
        } finally {
            usersLoading = false;
        }
    }

    // Helper function to format date
    function formatDate(date: string) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Add export function
    function handleExportUsers() {
        exportToCSV(users, 'users-export');
        ActivityLogger.logUserAction('EXPORT_USERS', $authStore.user?.id || 0, 'Exported users list');
    }
</script>

<div class="container mx-auto px-4 py-8 min-h-screen">
    {#if !$authStore?.isAuthenticated}
        <div class="flex justify-center items-center h-64">
            <p class="text-red-200">Please login to access the dashboard</p>
        </div>
    {:else if loading && initialLoad}
        <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div class="bg-gray-800 p-6 rounded-lg shadow-xl">
                <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p class="mt-4 text-white text-center">Loading dashboard data...</p>
            </div>
        </div>
    {:else if error}
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p class="text-red-200">{error}</p>
            <button 
                class="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white"
                on:click={loadDashboardData}
            >
                Try Again
            </button>
        </div>
    {:else}
        <div transition:fade class="space-y-6">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div class="stat-card">
                    <Icon icon="mdi:doctor" class="text-3xl text-blue-400" />
                    <h3 class="text-lg font-medium text-gray-200">Doctors</h3>
                    <p class="text-2xl font-bold text-white">{stats.doctors}</p>
                </div>
                
                <div class="stat-card">
                    <Icon icon="mdi:account-group" class="text-3xl text-green-400" />
                    <h3 class="text-lg font-medium text-gray-200">Patients</h3>
                    <p class="text-2xl font-bold text-white">{stats.patients}</p>
                </div>
                
                <div class="stat-card">
                    <Icon icon="mdi:calendar-check" class="text-3xl text-purple-400" />
                    <h3 class="text-lg font-medium text-gray-200">Appointments</h3>
                    <p class="text-2xl font-bold text-white">{stats.appointments}</p>
                </div>
                
                <div class="stat-card">
                    <Icon icon="mdi:currency-usd" class="text-3xl text-yellow-400" />
                    <h3 class="text-lg font-medium text-gray-200">Revenue</h3>
                    <p class="text-2xl font-bold text-white">{formatCurrency(stats.revenue)}</p>
                </div>
            </div>

            {#if !loading && !error}
                <DashboardCharts 
                    appointments={appointmentsData || []} 
                    payments={paymentsData || []} 
                />
            {/if}

            <!-- Users Management -->
            <div class="mt-8 bg-white/10 rounded-xl p-6 backdrop-blur-lg">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold text-white">Users Management</h2>
                    <div class="flex gap-4">
                        <button 
                            class="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-white transition-colors"
                            on:click={handleExportUsers}
                        >
                            Export Users
                        </button>
                        <button 
                            class="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-white transition-colors"
                            on:click={loadUsers}
                        >
                            Refresh Users
                        </button>
                    </div>
                </div>

                <!-- Add search and filter controls above the users table -->
                <div class="flex flex-wrap gap-4 mb-4">
                    <input 
                        type="text"
                        bind:value={searchTerm}
                        placeholder="Search users..."
                        class="px-4 py-2 bg-white/5 rounded-lg text-white placeholder-gray-400 border border-gray-700"
                    />
                    
                    <select 
                        bind:value={filterRole}
                        class="px-4 py-2 bg-white/5 rounded-lg text-white border border-gray-700"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="patient">Patient</option>
                    </select>
                </div>

                {#if usersLoading}
                    <div class="flex justify-center py-8">
                        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                {:else if usersError}
                    <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p class="text-red-200">{usersError}</p>
                    </div>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-800/50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-700/30">
                                {#each paginatedUsers as user (user.id)}
                                    <tr class="hover:bg-white/5">
                                        <td class="px-4 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="h-10 w-10 rounded-full bg-gray-600/50 flex items-center justify-center">
                                                    <span class="text-lg font-medium text-white">
                                                        {(user.name || 'U')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-white">
                                                        {user.name || 'Unknown User'}
                                                    </div>
                                                    {#if user.created_at}
                                                        <div class="text-sm text-gray-400">
                                                            Joined {new Date(user.created_at).toLocaleDateString()}
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {user.email}
                                        </td>
                                        <td class="px-4 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                {user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 
                                                user.role === 'doctor' ? 'bg-blue-500/20 text-blue-300' : 
                                                'bg-green-500/20 text-green-300'}">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td class="px-4 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                {user.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}">
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <div class="flex space-x-2">
                                                <select 
                                                    value={user.role}
                                                    on:change={(e) => updateUserRole(user.id, e.currentTarget.value)}
                                                    class="bg-transparent border border-gray-700 rounded px-2 py-1"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="doctor">Doctor</option>
                                                    <option value="patient">Patient</option>
                                                </select>
                                                <button 
                                                    class="p-1 hover:text-red-400 transition-colors"
                                                    on:click={() => deleteUser(user.id)}
                                                >
                                                    <Icon icon="mdi:trash" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}

                <!-- Add pagination controls -->
                <div class="mt-4 flex justify-between items-center">
                    <div class="text-sm text-gray-400">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div class="flex gap-2">
                        <button 
                            class="px-3 py-1 bg-white/5 rounded disabled:opacity-50"
                            disabled={currentPage === 1}
                            on:click={() => currentPage--}
                        >
                            Previous
                        </button>
                        <button 
                            class="px-3 py-1 bg-white/5 rounded disabled:opacity-50"
                            disabled={currentPage === totalPages}
                            on:click={() => currentPage++}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <!-- Activities and Actions Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <!-- Recent Activities -->
                <div class="lg:col-span-2 bg-white/10 rounded-xl p-6 backdrop-blur-lg">
                    <h2 class="text-xl font-semibold text-white mb-4">Recent Activities</h2>
                    <div class="space-y-4">
                        {#each activities as activity}
                            <div class="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                                <div class="flex-1">
                                    <p class="text-white">{activity.title}</p>
                                    <p class="text-sm text-gray-400">{activity.date.toLocaleString()}</p>
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
                <div class="bg-white/10 rounded-xl p-6 backdrop-blur-lg">
                    <h2 class="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                    <div class="space-y-4">
                        <a href="/admin/doctors/new" class="action-button">
                            <Icon icon="mdi:doctor-plus" />
                            <span>Add New Doctor</span>
                        </a>
                        <a href="/admin/appointments" class="action-button">
                            <Icon icon="mdi:calendar" />
                            <span>Manage Appointments</span>
                        </a>
                        <a href="/admin/reports" class="action-button">
                            <Icon icon="mdi:chart-box" />
                            <span>View Reports</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .stat-card {
        @apply bg-white/10 backdrop-blur-lg rounded-xl p-6 flex flex-col space-y-2;
    }

    .action-button {
        @apply flex items-center bg-blue-500/20 hover:bg-blue-500/30 
               text-white p-4 rounded-lg transition-all duration-300;
    }

    /* Fix icon spacing */
    .action-button :global(svg) {
        @apply mr-3 flex-shrink-0;
    }

    @media (max-width: 640px) {
        .container {
            @apply px-2 py-4;
        }
        
        .stat-card {
            @apply p-4;
        }
    }

    table {
        @apply w-full border-collapse;
    }

    th {
        @apply bg-gray-800/50 backdrop-blur-sm sticky top-0;
    }

    tr:hover {
        @apply bg-white/5 transition-colors;
    }

    td, th {
        @apply px-4 py-3 text-left;
    }

    /* Add styles for search and filter controls */
    input, select {
        @apply bg-white/5 rounded-lg text-white;
        @apply focus:outline-none focus:ring-2 focus:ring-blue-500/50;
    }

    /* Add styles for pagination buttons */
    button:not(:disabled):hover {
        @apply bg-white/10;
    }
</style>
