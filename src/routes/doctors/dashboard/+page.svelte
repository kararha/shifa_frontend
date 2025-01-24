<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';
    import DoctorAvailability from '$lib/components/DoctorAvailability.svelte';

    interface Appointment {
        id: number;
        patient_name: string;
        appointment_date: string;
        start_time: string;
        end_time: string;
        status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
        type: 'consultation' | 'appointment';
        notes?: string;
    }

    let appointments: Appointment[] = [];
    let loading = true;
    let error: string | null = null;
    let selectedDate = new Date().toISOString().split('T')[0];
    let activeTab: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';

    // Get doctor ID from stored user data
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const doctorId = userData.id;

    onMount(async () => {
        await loadAppointments();
    });

    async function loadAppointments() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`${BACKEND_URL}/api/doctors/appointments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load appointments');
            appointments = await response.json();
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load appointments';
        } finally {
            loading = false;
        }
    }

    async function updateAppointmentStatus(appointmentId: number, newStatus: string) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update appointment');
            await loadAppointments();
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update appointment';
        }
    }

    $: filteredAppointments = appointments.filter(apt => {
        const isMatchingTab = 
            (activeTab === 'upcoming' && ['scheduled', 'pending'].includes(apt.status)) ||
            (activeTab === 'completed' && apt.status === 'completed') ||
            (activeTab === 'cancelled' && apt.status === 'cancelled');

        const isMatchingDate = apt.appointment_date === selectedDate;
        return isMatchingTab && isMatchingDate;
    });

    function formatTime(time: string): string {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-8" transition:fade>
        <!-- Header -->
        <div class="glass-card">
            <h1 class="text-3xl font-bold text-white mb-6">Doctor Dashboard</h1>
            
            <!-- Date Selector -->
            <div class="flex items-center space-x-4 mb-6">
                <input
                    type="date"
                    bind:value={selectedDate}
                    class="glass-input"
                />
            </div>

            <!-- Tabs -->
            <div class="flex space-x-4 mb-6">
                {#each ['upcoming', 'completed', 'cancelled'] as tab, i}
                    <button
                        class="glass-button"
                        class:active={activeTab === tab}
                        on:click={() => activeTab = tab as 'upcoming' | 'completed' | 'cancelled'}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Appointments List -->
        {#if loading}
            <div class="flex justify-center">
                <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        {:else if error}
            <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200">
                {error}
            </div>
        {:else if filteredAppointments.length === 0}
            <div class="glass-panel text-center text-gray-300">
                No appointments found for this date.
            </div>
        {:else}
            <div class="space-y-4">
                {#each filteredAppointments as appointment}
                    <div class="glass-card">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-xl font-semibold text-white mb-2">
                                    {appointment.patient_name}
                                </h3>
                                <p class="text-gray-300">
                                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                                </p>
                                <p class="text-blue-300">
                                    Type: {appointment.type}
                                </p>
                                {#if appointment.notes}
                                    <p class="text-gray-400 mt-2">{appointment.notes}</p>
                                {/if}
                            </div>
                            <div class="flex items-center space-x-2">
                                {#if ['scheduled', 'pending'].includes(appointment.status)}
                                    <button
                                        class="glass-button-success"
                                        on:click={() => updateAppointmentStatus(appointment.id, 'completed')}
                                    >
                                        Complete
                                    </button>
                                    <button
                                        class="glass-button-danger"
                                        on:click={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                    >
                                        Cancel
                                    </button>
                                {/if}
                                <span class="status-badge status-{appointment.status}">
                                    {appointment.status}
                                </span>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Add Availability Management Section -->
        <DoctorAvailability {doctorId} />
        
    </div>
</div>

<style>
    .glass-input {
        /* using @apply in style block instead of inline */
        background: rgba(255, 255, 255, 0.1);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(5px);
    }

    .glass-button.active {
        background: rgba(59, 130, 246, 0.5);
        border-color: rgba(59, 130, 246, 0.5);
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .status-scheduled { 
        background: rgba(59, 130, 246, 0.5);
        color: white;
    }
    .status-completed { 
        background: rgba(16, 185, 129, 0.5);
        color: white;
    }
    .status-cancelled { 
        background: rgba(239, 68, 68, 0.5);
        color: white;
    }
    .status-pending { 
        background: rgba(245, 158, 11, 0.5);
        color: white;
    }

    .glass-button-success {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 600;
        background: rgba(16, 185, 129, 0.5);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .glass-button-danger {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 600;
        background: rgba(239, 68, 68, 0.5);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .glass-card {
        padding: 1.5rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .glass-panel {
        padding: 1rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .glass-button {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 600;
        background: rgba(59, 130, 246, 0.5);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(59, 130, 246, 0.3);
        transition: all 0.2s ease-in-out;
    }

    .glass-button:hover {
        background: rgba(59, 130, 246, 0.7);
        transform: translateY(-1px);
    }
</style>
