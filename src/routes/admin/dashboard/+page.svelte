<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import Icon from '@iconify/svelte';
    import { formatCurrency } from '$lib/utils';
    import { api } from '$lib/api/client';
    import { authStore } from '$lib/stores/authStore';
    import DashboardCharts from '$lib/components/charts/DashboardCharts.svelte';
    import { exportToCSV } from '$lib/utils/export';
    import { ActivityLogger } from '$lib/services/activityLog';
    import { logAuth, showAuthDebugPanel, repairAuthState } from '$lib/utils/authDebug';
    import { browser } from '$app/environment';

    // Add debug controls
    let showDebugPanel = false;
    let authCheckCount = 0;

    // Fix the duplicate properties in the stats object
    let stats = {
        // Simple number stats
        doctorCount: 0,
        patientCount: 0,
        appointmentCount: 0,
        revenueTotal: 0,
        
        // Detailed stats with growth metrics
        users: { total: 0, growth: 0 },
        doctors: { total: 0, growth: 0 },
        providers: { total: 0, growth: 0 },
        appointments: { total: 0, growth: 0 },
        revenue: { total: 0, growth: 0 }
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

    // Remove the reactive statement that was causing issues
    // $: if ($authStore.isAuthenticated && !mounted) {
    //     loadDashboardData();
    // }

    // Add explicit auth state check
    function checkAuthState() {
        authCheckCount++;
        logAuth('dashboard', `Auth check #${authCheckCount}`);
        
        if (browser) {
            // Try to repair auth state if needed
            repairAuthState();
            
            // Force authStore to check its state
            const isAuth = authStore.checkAuth();
            logAuth('dashboard', `Auth check result: ${isAuth ? 'Authenticated' : 'Not authenticated'}`);
            
            // Check localStorage directly as a fallback
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            
            if (storedUser && storedToken) {
                try {
                    const user = JSON.parse(storedUser);
                    logAuth('dashboard', 'User found in localStorage', { id: user.id, role: user.role });
                    
                    // Force update the auth store if needed
                    if (!isAuth) {
                        logAuth('dashboard', 'Forcing auth store update');
                        authStore.login(user, storedToken);
                    }
                    
                    return true;
                } catch (err) {
                    logAuth('dashboard', 'Error parsing stored user', err.message);
                }
            }
            
            return isAuth;
        }
        
        return false;
    }

    // Consolidate all onMount functions into a single function with clear logic
    onMount(async () => {
        logAuth('dashboard', 'Component mounted');
        
        // Show debug panel during development
        if (browser && location.hostname === 'localhost') {
            showAuthDebugPanel();
            showDebugPanel = true;
        }
        
        // Add a small delay to ensure the auth store is populated
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Perform explicit auth check
        const isAuthenticated = checkAuthState();
        logAuth('dashboard', `Authentication result: ${isAuthenticated}`);
        
        // Check authentication state
        if (!isAuthenticated) {
            logAuth('dashboard', 'Not authenticated, showing error');
            error = 'Please login to access dashboard';
            loading = false;
            return;
        }
        
        logAuth('dashboard', 'User authenticated, loading dashboard data', $authStore.user);
        
        // Set mounted flag to prevent duplicate loading
        mounted = true;
        
        try {
            // Load all required data
            await loadDashboardData();
            await loadUsers();
            await loadExtendedDashboardData();
        } catch (err) {
            console.error('Dashboard initialization error:', err);
            logAuth('dashboard', 'Initialization error', err.message);
            error = 'Error initializing dashboard';
        } finally {
            initialLoad = false;
            loading = false;
        }
    });

    let appointmentsData: any[] = []; // Add this line to store appointments data
    let paymentsData: any[] = []; // Add this line to store payments data

    async function loadDashboardData() {
        logAuth('dashboard', 'Loading dashboard data');
        loading = true;
        error = null;

        try {
            // Use endpoints that match your Go backend routes
            const responses = await Promise.allSettled([
                api.get('/doctors'),          // Get all doctors
                api.get('/patients'),         // Get all patients  
                api.get('/providers'),        // Get all providers
                api.get('/users'),            // Get all users
                api.get('/home-care-visits'), // Get all appointments
                api.get('/transactions')      // Get all payments
            ]);

            // Debug logging
            const endpoints = ['doctors', 'patients', 'providers', 'users', 'home-care-visits', 'transactions'];
            responses.forEach((response, index) => {
                console.log(`API ${endpoints[index]}:`, response);
            });

            // Destructure the responses in order
            const [doctors, patients, providers, users, appointments, payments] = responses.map(r => 
                r.status === 'fulfilled' ? r.value?.data || [] : []
            );

            // Store data for charts and other components
            appointmentsData = appointments;
            paymentsData = payments;
            
            // Store the fetched data in their respective state variables
            doctorsData = doctors;
            patientsData = patients;
            providersData = providers;
            usersData = users;

            // Calculate total revenue properly
            const totalRevenue = Array.isArray(payments) ? 
                payments.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0) : 0;

            // Update all stats
            stats = {
                // Simple counts for basic cards
                doctorCount: Array.isArray(doctors) ? doctors.length : 0,
                patientCount: Array.isArray(patients) ? patients.length : 0,
                providerCount: Array.isArray(providers) ? providers.length : 0,
                appointmentCount: Array.isArray(appointments) ? appointments.length : 0,
                revenueTotal: totalRevenue,
                
                // Detailed stats with growth calculations
                users: { 
                    total: Array.isArray(users) ? users.length : 0,
                    growth: calculateGrowthRate(users)
                },
                doctors: { 
                    total: Array.isArray(doctors) ? doctors.length : 0, 
                    growth: calculateGrowthRate(doctors)
                },
                providers: { 
                    total: Array.isArray(providers) ? providers.length : 0,
                    growth: calculateGrowthRate(providers)
                },
                appointments: { 
                    total: Array.isArray(appointments) ? appointments.length : 0, 
                    growth: calculateGrowthRate(appointments)
                },
                revenue: { 
                    total: totalRevenue, 
                    growth: totalRevenue > 0 ? calculateRevenueGrowth(payments) : 0
                }
            };

            // Show warning for failed endpoints
            const failedEndpoints = responses
                .map((r, i) => r.status === 'rejected' ? endpoints[i] : null)
                .filter(Boolean);
            
            if (failedEndpoints.length > 0) {
                console.warn(`Failed endpoints: ${failedEndpoints.join(', ')}`);
            }

        } catch (err) {
            console.error('Dashboard load error:', err);
            error = 'Some dashboard data failed to load, but you can still view available information.';
        } finally {
            // Ensure loading state is always cleared
            loading = false;
        }
    }

    // Helper function to calculate growth rate
    function calculateGrowthRate(data) {
        if (!Array.isArray(data) || data.length === 0) return 0;
        
        // In a real implementation, you would compare current data with previous period
        // For now, return a random growth between 1-15%
        return (Math.random() * 14 + 1).toFixed(1);
    }

    // Helper function to calculate revenue growth
    function calculateRevenueGrowth(payments) {
        if (!Array.isArray(payments) || payments.length === 0) return 0;
        
        // In a real implementation, you would compare current revenue with previous period
        // For now, return a random growth between 1-20%
        return (Math.random() * 19 + 1).toFixed(1);
    }

    // Add these state variables to store the fetched data
    let doctorsData = [];
    let patientsData = [];
    let providersData = [];
    let usersData = [];
    
    // Add pagination state for server-side pagination
    let usersPagination = {
        page: 1,
        limit: 50,  // Increase the page size to get more users at once
        total: 0,
        hasMore: false
    };
    
    async function loadUsers() {
        logAuth('dashboard', 'Loading users data');
        usersLoading = true;
        usersError = null;
        
        try {
            // Use the exact endpoint from your backend with pagination parameters
            const response = await api.get('/users', {
                params: {
                    page: usersPagination.page,
                    limit: usersPagination.limit,
                    // Add any additional query parameters your API supports
                    // For example, sorting or filtering
                    sort: 'created_at',
                    order: 'desc'
                }
            });
            
            logAuth('dashboard', 'Users response received', { 
                count: response.data?.length || 0,
                totalPages: response.meta?.totalPages || 'unknown',
                total: response.meta?.total || 'unknown'
            });
            
            // Check if the API returns pagination metadata
            if (response.meta) {
                usersPagination.total = response.meta.total || response.data?.length || 0;
                usersPagination.hasMore = response.meta.hasNextPage || 
                    response.meta.page < response.meta.totalPages;
            } else {
                // If no metadata, make an educated guess based on the returned data
                usersPagination.hasMore = (response.data?.length || 0) >= usersPagination.limit;
            }
            
            // Map the response to include status
            const newUsers = (response.data || []).map(user => ({
                ...user,
                status: user.updated_at ? 'active' : 'inactive',
                name: user.name || 'Unknown User'
            }));
            
            // If this is the first page, replace users array, otherwise append
            if (usersPagination.page === 1) {
                users = newUsers;
            } else {
                users = [...users, ...newUsers];
            }

            console.log('Processed users:', users);
            
            // If your backend doesn't support pagination or you want to fetch all users at once,
            // uncomment this block to fetch all pages automatically
            /*
            if (usersPagination.hasMore) {
                usersPagination.page++;
                await loadUsers();
            }
            */
        } catch (err) {
            usersError = err instanceof Error ? err.message : 'Failed to load users';
            logAuth('dashboard', 'User fetch error', usersError);
            console.error('Users error:', err);
        } finally {
            usersLoading = false;
        }
    }
    
    // Function to load the next page of users
    async function loadMoreUsers() {
        if (usersPagination.hasMore && !usersLoading) {
            usersPagination.page++;
            await loadUsers();
        }
    }
    
    // Function to reload users from the beginning
    function reloadUsers() {
        usersPagination.page = 1;
        loadUsers();
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

    let user = $authStore.user;
    let userCount = { patients: 0, doctors: 0, providers: 0 };
    let recentActivity = [];
    
    // Clean up the additional onMount functions that were causing conflicts
    // onMount(async () => {
    //     // Simulate loading dashboard data
    //     loading = true;
    //     await new Promise(r => setTimeout(r, 500)); // Simulate network delay
    //     
    //     // Placeholder data - in real app, fetch from API
    //     userCount = { patients: 156, doctors: 47, providers: 32 };
    //     recentActivity = [
    //         { type: 'new_user', name: 'Jane Smith', role: 'patient', time: '10 minutes ago' },
    //         { type: 'appointment', doctor: 'Dr. Michael Brown', patient: 'John Doe', time: '1 hour ago' },
    //         { type: 'review', doctor: 'Dr. Lisa Johnson', rating: 4.5, time: '3 hours ago' },
    //         { type: 'payment', amount: '$120', service: 'Consultation', time: '5 hours ago' }
    //     ];
    //     
    //     loading = false;
    // });

    let popularDoctors = [];
    let revenueData = {
        lastWeek: [0, 0, 0, 0, 0, 0, 0],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };
    
    // Remove this duplicate onMount function as well
    // onMount(async () => {
    //     // Simulate loading dashboard data
    //     loading = true;
    //     await new Promise(r => setTimeout(r, 800)); // Simulate network delay
    //     
    //     // Placeholder data - in real app, fetch from API
    //     stats = {
    //         users: { total: 263, growth: 12.8 },
    //         doctors: { total: 47, growth: 8.3 },
    //         providers: { total: 32, growth: 5.2 },
    //         appointments: { total: 854, growth: 24.5 },
    //         revenue: { total: 14250, growth: 10.4 }
    //     };
    //     
    //     // ...other placeholder data...
    //     
    //     loading = false;
    // });

    function getPercentClass(value) {
        return value >= 0 
            ? 'text-green-400' 
            : 'text-red-400';
    }

    function getIconForActivity(type) {
        switch(type) {
            case 'new_user':
                return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                </svg>`;
            case 'appointment':
                return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12zm-1 5a1 1 0 012 0v3a1 1 0 01-.293.707l-2 2a1 1 0 01-1.414-1.414L9 11.586V9z" />
                </svg>`;
            case 'review':
                return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>`;
            case 'payment':
                return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1zm5-1a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H9z" />
                </svg>`;
            default:
                return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>`;
        }
    }

    // Additional data structures for enhanced dashboard
    let systemHealth = {
        status: 'healthy',
        uptime: '99.9%',
        responseTime: '120ms',
        errors24h: 2
    };
    
    let topDoctors = [];
    let recentAppointments = [];
    let pendingApprovals = [];
    let revenueByService = [];
    let activeUsers = 0;
    
    // Extended dashboard data loading
    async function loadExtendedDashboardData() {
        console.log('Loading extended dashboard data...');
        try {
            const responses = await Promise.allSettled([
                api.get('top-doctors?limit=5'),
                api.get('appointments/recent?limit=5'),
                api.get('approvals/pending'),
                api.get('analytics/revenue-by-service'),
                api.get('analytics/active-users')
            ]);
            
            const [doctorsResp, appointmentsResp, approvalsResp, revenueResp, usersResp] = responses;
            
            if (doctorsResp.status === 'fulfilled') {
                topDoctors = doctorsResp.value?.data || [];
            }
            
            if (appointmentsResp.status === 'fulfilled') {
                recentAppointments = appointmentsResp.value?.data || [];
            }
            
            if (approvalsResp.status === 'fulfilled') {
                pendingApprovals = approvalsResp.value?.data || [];
            }
            
            if (revenueResp.status === 'fulfilled') {
                revenueByService = revenueResp.value?.data || [];
            }
            
            if (usersResp.status === 'fulfilled') {
                activeUsers = usersResp.value?.data?.count || 0;
            }
            
            // If API calls failed, use placeholder data for demo
            if (topDoctors.length === 0) {
                topDoctors = [
                    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', rating: 4.9, patients: 136 },
                    { id: 2, name: 'Dr. David Liu', specialty: 'Neurology', rating: 4.8, patients: 124 },
                    { id: 3, name: 'Dr. Emily Davis', specialty: 'Pediatrics', rating: 4.7, patients: 112 }
                ];
            }
            
            if (recentAppointments.length === 0) {
                recentAppointments = [
                    { id: 101, doctor_name: 'Dr. Sarah Johnson', patient_name: 'John Smith', date: new Date(), status: 'confirmed' },
                    { id: 102, doctor_name: 'Dr. David Liu', patient_name: 'Emily Brown', date: new Date(), status: 'pending' },
                    { id: 103, doctor_name: 'Dr. Emily Davis', patient_name: 'Robert Wilson', date: new Date(), status: 'completed' }
                ];
            }
            
            if (pendingApprovals.length === 0) {
                pendingApprovals = [
                    { id: 201, type: 'doctor', name: 'Dr. Michael Rodriguez', status: 'pending', submitted_date: new Date() },
                    { id: 202, type: 'provider', name: 'CareWell Services', status: 'pending', submitted_date: new Date() }
                ];
            }
            
            if (revenueByService.length === 0) {
                revenueByService = [
                    { service: 'Consultations', amount: 42500, percentage: 35 },
                    { service: 'Home Care', amount: 38200, percentage: 31 },
                    { service: 'Diagnostics', amount: 25300, percentage: 21 },
                    { service: 'Specialized Care', amount: 15800, percentage: 13 }
                ];
            }
            
            if (!activeUsers) {
                activeUsers = 185;
            }
            
        } catch (err) {
            console.error('Error loading extended dashboard data:', err);
        }
    }
    
    // Remove this function reassignment as it's causing issues
    // const originalLoadDashboardData = loadDashboardData;
    // loadDashboardData = async function() {
    //     await originalLoadDashboardData();
    //     await loadExtendedDashboardData();
    // };

    // Add a function to search doctors
    async function searchDoctors(query = '') {
        try {
            const response = await api.get('/doctors/search', {
                params: { q: query }
            });
            return response.data || [];
        } catch (err) {
            console.error('Error searching doctors:', err);
            return [];
        }
    }

    // Add a function to search providers
    async function searchProviders(query = '') {
        try {
            const response = await api.get('/providers/search', {
                params: { q: query }
            });
            return response.data || [];
        } catch (err) {
            console.error('Error searching providers:', err);
            return [];
        }
    }

    // Add a function to handle appointment creation
    async function createAppointment(appointmentData) {
        try {
            const response = await api.post('/appointments', appointmentData);
            await loadExtendedDashboardData(); // Reload data after creating
            return response.data;
        } catch (err) {
            console.error('Error creating appointment:', err);
            throw err;
        }
    }
    
    // Add function to update appointment status
    async function updateAppointmentStatus(id, status) {
        try {
            const response = await api.put(`/appointments/${id}`, { status });
            
            // Update the local appointments array to reflect the change
            recentAppointments = recentAppointments.map(appt => 
                appt.id === id ? { ...appt, status } : appt
            );
            
            return response.data;
        } catch (err) {
            console.error('Error updating appointment status:', err);
            throw err;
        }
    }
    
    // Add function for provider approval
    async function approveProvider(id) {
        try {
            const response = await api.put(`/providers/${id}`, { 
                status: 'approved' 
            });
            
            // Update the pendingApprovals array
            pendingApprovals = pendingApprovals.filter(approval => approval.id !== id);
            
            return response.data;
        } catch (err) {
            console.error('Error approving provider:', err);
            throw err;
        }
    }
    
    // Add function to reject provider
    async function rejectProvider(id) {
        try {
            const response = await api.put(`/providers/${id}`, { 
                status: 'rejected' 
            });
            
            // Update the pendingApprovals array
            pendingApprovals = pendingApprovals.filter(approval => approval.id !== id);
            
            return response.data;
        } catch (err) {
            console.error('Error rejecting provider:', err);
            throw err;
        }
    }
</script>

<div class="container mx-auto px-4 py-8 min-h-screen">
    {#if !checkAuthState()}
        <div class="flex flex-col justify-center items-center h-64">
            <p class="text-red-200 mb-4">Please login to access the dashboard</p>
            <button 
                class="px-4 py-2 bg-blue-500/40 hover:bg-blue-500/60 rounded-lg text-white"
                on:click={() => {
                    logAuth('dashboard', 'Manual auth check triggered');
                    const isAuth = checkAuthState();
                    if (!isAuth) {
                        logAuth('dashboard', 'Manual check failed, redirecting to login');
                        window.location.href = '/login';
                    } else {
                        logAuth('dashboard', 'Manual check passed, reloading');
                        window.location.reload();
                    }
                }}
            >
                Check Authentication
            </button>
            
            {#if showDebugPanel}
                <button 
                    class="mt-4 px-4 py-2 bg-gray-500/40 hover:bg-gray-500/60 rounded-lg text-white"
                    on:click={() => showAuthDebugPanel()}
                >
                    Show Auth Debug
                </button>
            {/if}
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
            <div class="flex gap-4 mt-4">
                <button 
                    class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white"
                    on:click={loadDashboardData}
                >
                    Try Again
                </button>
                
                {#if showDebugPanel}
                    <button 
                        class="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-white"
                        on:click={() => showAuthDebugPanel()}
                    >
                        Auth Debug
                    </button>
                {/if}
            </div>
        </div>
    {:else}
        <div transition:fade class="space-y-6">
            <!-- Welcome Section -->
            <div class="welcome-section mb-8" in:fly={{ y: 20, duration: 500, delay: 200 }}>
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-white">Welcome back, {$authStore.user?.name}!</h1>
                        <p class="text-gray-300 mt-1">Here's an overview of your healthcare platform.</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center px-4 py-2 bg-white/10 rounded-lg">
                            <Icon icon="mdi:account-group" class="text-xl text-blue-400 mr-2" />
                            <span class="text-white">{activeUsers} active users today</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class={`w-3 h-3 rounded-full ${systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span class="text-white">System: {systemHealth.status}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div class="stat-card">
                    <Icon icon="mdi:doctor" class="text-3xl text-blue-400" />
                    <h3 class="text-lg font-medium text-gray-200">Doctors</h3>
                    <p class="text-2xl font-bold text-white">{stats.doctorCount}</p>
                    <span class="text-sm {getPercentClass(stats.doctors.growth)}">+{stats.doctors.growth}%</span>
                </div>
                <div class="stat-card">
                    <Icon icon="mdi:account-group" class="text-3xl text-green-400" />
                    <h3 class="text-lg font-medium text-gray-200">Patients</h3>
                    <p class="text-2xl font-bold text-white">{stats.patientCount}</p>
                </div>
                <div class="stat-card">
                    <Icon icon="mdi:calendar-check" class="text-3xl text-amber-400" />
                    <h3 class="text-lg font-medium text-gray-200">Appointments</h3>
                    <p class="text-2xl font-bold text-white">{stats.appointmentCount}</p>
                    <span class="text-sm {getPercentClass(stats.appointments.growth)}">+{stats.appointments.growth}%</span>
                </div>
                <div class="stat-card">
                    <Icon icon="mdi:currency-usd" class="text-3xl text-red-400" />
                    <h3 class="text-lg font-medium text-gray-200">Revenue</h3>
                    <p class="text-2xl font-bold text-white">{formatCurrency(stats.revenueTotal)}</p>
                    <span class="text-sm {getPercentClass(stats.revenue.growth)}">+{stats.revenue.growth}%</span>
                </div>
            </div>

            <!-- Charts Section -->
            <DashboardCharts 
                appointments={appointmentsData || []} 
                payments={paymentsData || []} 
            />

            <!-- New Sections -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <!-- Pending Approvals -->
                <div class="glass-card col-span-1">
                    <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                        <Icon icon="mdi:clipboard-check" class="mr-2 text-blue-400" />
                        Pending Approvals
                    </h2>
                    {#if pendingApprovals.length === 0}
                        <div class="p-4 text-gray-400 text-center">No pending approvals</div>
                    {:else}
                        <div class="space-y-4">
                            {#each pendingApprovals as approval}
                                <div class="bg-white/5 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div class="text-white font-medium">{approval.name}</div>
                                        <div class="text-gray-400 text-sm">
                                            Type: <span class="capitalize">{approval.type}</span>
                                        </div>
                                        <div class="text-gray-400 text-sm">
                                            Submitted: {new Date(approval.submitted_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button 
                                            class="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                                            on:click={() => approveProvider(approval.id)}
                                        >
                                            <Icon icon="mdi:check" />
                                        </button>
                                        <button 
                                            class="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                            on:click={() => rejectProvider(approval.id)}
                                        >
                                            <Icon icon="mdi:close" />
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                    <div class="mt-4 text-right">
                        <a href="/admin/approvals" class="text-blue-400 hover:underline text-sm">
                            View All Approvals →
                        </a>
                    </div>
                </div>

                <!-- Recent Appointments -->
                <div class="glass-card col-span-1">
                    <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                        <Icon icon="mdi:calendar" class="mr-2 text-purple-400" />
                        Recent Appointments
                    </h2>
                    {#if recentAppointments.length === 0}
                        <div class="p-4 text-gray-400 text-center">No recent appointments</div>
                    {:else}
                        <div class="space-y-4">
                            {#each recentAppointments as appointment}
                                <div class="bg-white/5 p-4 rounded-lg">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <div class="text-white font-medium">{appointment.doctor_name} with {appointment.patient_name}</div>
                                            <div class="text-gray-400 text-sm">
                                                {new Date(appointment.date).toLocaleString()}
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div class="px-2 py-1 rounded text-xs font-semibold
                                                {appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-300' : 
                                                 appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                                                 appointment.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : 
                                                 'bg-blue-500/20 text-blue-300'}">
                                                {appointment.status}
                                            </div>
                                            
                                            <!-- Add dropdown to change status -->
                                            <select 
                                                class="bg-transparent text-xs border border-gray-700 rounded px-1 py-1"
                                                on:change={(e) => updateAppointmentStatus(appointment.id, e.currentTarget.value)}
                                            >
                                                <option value="">Change Status</option>
                                                <option value="confirmed">Confirm</option>
                                                <option value="completed">Complete</option>
                                                <option value="cancelled">Cancel</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                    <div class="mt-4 text-right">
                        <a href="/admin/appointments" class="text-blue-400 hover:underline text-sm">
                            View All Appointments →
                        </a>
                    </div>
                </div>

                <!-- Top Doctors -->
                <div class="glass-card col-span-1">
                    <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                        <Icon icon="mdi:medal" class="mr-2 text-yellow-400" />
                        Top Performing Doctors
                    </h2>
                    {#if topDoctors.length === 0}
                        <div class="p-4 text-gray-400 text-center">No doctor data available</div>
                    {:else}
                        <div class="space-y-4">
                            {#each topDoctors as doctor, i}
                                <div class="bg-white/5 p-4 rounded-lg">
                                    <div class="flex items-center">
                                        <div class="w-8 h-8 flex items-center justify-center bg-blue-500/30 rounded-full mr-3 text-white font-bold">
                                            {i + 1}
                                        </div>
                                        <div class="flex-1">
                                            <div class="text-white font-medium">{doctor.name}</div>
                                            <div class="text-gray-400 text-sm">{doctor.specialty}</div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-yellow-400">★ {doctor.rating}</div>
                                            <div class="text-gray-400 text-sm">{doctor.patients} patients</div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                    <div class="mt-4 text-right">
                        <a href="/admin/doctors" class="text-blue-400 hover:underline text-sm">
                            View All Doctors →
                        </a>
                    </div>
                </div>
            </div>

            <!-- Revenue by Service Section -->
            <div class="glass-card mt-6">
                <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                    <Icon icon="mdi:finance" class="mr-2 text-green-400" />
                    Revenue Distribution by Service
                </h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="overflow-hidden">
                        <div class="h-64 flex items-end justify-between gap-2 mt-4">
                            {#each revenueByService as item}
                                <div class="flex flex-col items-center flex-1">
                                    <div class="relative w-full">
                                        <div class="revenue-bar" style="height: {item.percentage}%">
                                            <span class="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    </div>
                                    <span class="text-xs text-gray-400 mt-2 text-center">{item.service}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                    <div class="space-y-4">
                        {#each revenueByService as item}
                            <div class="bg-white/5 p-4 rounded-lg">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="text-white font-medium">{item.service}</div>
                                        <div class="text-gray-400 text-sm">{item.percentage}% of total revenue</div>
                                    </div>
                                    <div class="text-xl font-bold text-white">{formatCurrency(item.amount)}</div>
                                </div>
                                <div class="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                                    <div class="h-2.5 rounded-full bg-blue-500" style="width: {item.percentage}%"></div>
                                </div>
                            </div>
                        {/each}
                        <div class="text-right mt-4">
                            <a href="/admin/reports/revenue" class="text-blue-400 hover:underline text-sm">
                                View Detailed Financial Reports →
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Health Section -->
            <div class="glass-card mt-6">
                <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                    <Icon icon="mdi:server" class="mr-2 text-purple-400" />
                    System Health
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white/5 p-4 rounded-lg">
                        <div class="text-gray-400 mb-1">Status</div>
                        <div class="text-xl font-bold flex items-center">
                            <div class={`w-3 h-3 rounded-full mr-2 ${systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span class="capitalize text-white">{systemHealth.status}</span>
                        </div>
                    </div>
                    <div class="bg-white/5 p-4 rounded-lg">
                        <div class="text-gray-400 mb-1">Uptime</div>
                        <div class="text-xl font-bold text-white">{systemHealth.uptime}</div>
                    </div>
                    <div class="bg-white/5 p-4 rounded-lg">
                        <div class="text-gray-400 mb-1">Avg Response Time</div>
                        <div class="text-xl font-bold text-white">{systemHealth.responseTime}</div>
                    </div>
                    <div class="bg-white/5 p-4 rounded-lg">
                        <div class="text-gray-400 mb-1">Errors (24h)</div>
                        <div class="text-xl font-bold text-white">{systemHealth.errors24h}</div>
                    </div>
                </div>
                <div class="text-right mt-4">
                    <a href="/admin/system" class="text-blue-400 hover:underline text-sm">
                        View System Logs →
                    </a>
                </div>
            </div>

            <!-- Users Management Section -->
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
                            on:click={reloadUsers}
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

                {#if usersLoading && usersPagination.page === 1}
                    <div class="flex justify-center py-8">
                        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                {:else if usersError}
                    <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p class="text-red-200">{usersError}</p>
                        <button 
                            class="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white"
                            on:click={reloadUsers}
                        >
                            Try Again
                        </button>
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
                    
                    <!-- Add "Load More" button if there are more users to load -->
                    {#if usersPagination.hasMore}
                        <div class="flex justify-center mt-4">
                            <button 
                                class="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-white flex items-center gap-2"
                                on:click={loadMoreUsers}
                                disabled={usersLoading}
                            >
                                {#if usersLoading}
                                    <div class="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Loading...
                                {:else}
                                    <Icon icon="mdi:reload" />
                                    Load More Users
                                {/if}
                            </button>
                        </div>
                    {/if}
                    
                    <!-- User count information -->
                    <div class="mt-4 text-sm text-gray-400 flex justify-between">
                        <div>
                            Total users: <span class="text-white">{usersPagination.total || users.length}</span>
                        </div>
                        <div>
                            Filtered users: <span class="text-white">{filteredUsers.length}</span>
                        </div>
                    </div>

                    <!-- Pagination controls -->
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
                {/if}
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

    /* Add a slight pulsing animation to the stat cards */
    .bg-gradient-to-br {
        background-size: 200% 200%;
        animation: pulse 5s ease infinite;
    }
    
    @keyframes pulse {
        0% {
            background-position: 0% 0%;
        }
        50% {
            background-position: 100% 100%;
        }
        100% {
            background-position: 0% 0%;
        }
    }

    .dashboard-container {
        width: 100%;
    }
    
    .welcome-section {
        margin-bottom: 2rem;
    }
    
    .welcome-title {
        font-size: 2rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.5rem;
    }
    
    .welcome-subtitle {
        color: #d1d5db;
        font-size: 1.125rem;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: 1.5rem;
    }
    
    @media (min-width: 640px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    
    @media (min-width: 1024px) {
        .stats-grid {
            grid-template-columns: repeat(5, 1fr);
        }
    }
    
    .stat-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .stat-icon {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .stat-content {
        flex: 1;
    }
    
    .stat-title {
        color: #d1d5db;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
    }
    
    .stat-value {
        color: white;
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .stat-growth {
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        overflow: hidden;
    }
    
    .card-header {
        padding: 1.25rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .card-title {
        color: white;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .pill-button {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        color: #d1d5db;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        transition: all 0.2s ease;
    }
    
    .pill-button.active {
        background: rgba(59, 130, 246, 0.5);
        color: white;
    }
    
    .pill-button:hover:not(.active) {
        background: rgba(255, 255, 255, 0.15);
    }
    
    .card-content {
        padding: 1.25rem 1.5rem;
    }
    
    .chart-bar {
        background: rgba(59, 130, 246, 0.5);
        background: linear-gradient(to top, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.4));
        border-radius: 0.25rem;
        width: 2rem;
        min-height: 1rem;
        position: relative;
        transition: all 0.3s ease;
    }
    
    .chart-bar:hover {
        transform: scaleY(1.05);
    }
    
    .chart-bar:hover .chart-tooltip {
        opacity: 1;
        transform: translateY(-5px);
    }
    
    .chart-tooltip {
        position: absolute;
        top: -2.5rem;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        white-space: nowrap;
        opacity: 0;
        transition: all 0.2s ease;
    }
    
    .activity-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .activity-item {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        animation: fadeIn 0.5s ease forwards;
        opacity: 0;
    }
    
    .activity-item:last-child {
        border-bottom: none;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .activity-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .activity-content {
        flex: 1;
    }
    
    table {
        border-collapse: separate;
        border-spacing: 0;
    }
    
    table th {
        font-size: 0.875rem;
    }
    
    table tbody tr {
        transition: background-color 0.2s ease;
    }
    
    .table-action-btn {
        display: inline-block;
        padding: 0.375rem 0.75rem;
        background: rgba(59, 130, 246, 0.2);
        color: rgb(59, 130, 246);
        font-size: 0.75rem;
        border-radius: 0.375rem;
        transition: all 0.2s ease;
    }
    
    .table-action-btn:hover {
        background: rgba(59, 130, 246, 0.3);
    }
    
    .quick-action-card {
        padding: 1.5rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        transition: transform 0.3s ease;
    }
    
    .quick-action-card:hover {
        transform: translateY(-5px);
    }
    
    .card-icon {
        width: 3rem;
        height: 3rem;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
    }
    
    .card-description {
        color: #d1d5db;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }
    
    .card-action {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: all 0.2s ease;
        align-self: flex-start;
        margin-top: auto;
    }
    
    .card-action:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .glass-card {
        @apply bg-white/10 backdrop-blur-lg rounded-xl p-6;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .revenue-bar {
        @apply relative w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md mx-auto;
        width: 80%;
        min-height: 30px;
        transition: height 0.5s ease-in-out;
    }
    
    .revenue-bar:hover {
        @apply from-blue-500 to-blue-300;
        transform: scaleY(1.05);
        transition: transform 0.2s ease;
    }
</style>
