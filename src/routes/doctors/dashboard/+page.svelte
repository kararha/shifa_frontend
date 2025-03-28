<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';
    import DoctorAvailability from '$lib/components/DoctorAvailability.svelte';
    import { goto } from '$app/navigation';
    import { t } from '$lib/utils/i18n';
    import { currentLanguage, currentTranslations } from '$lib/stores/translations';

    interface Appointment {
        id: number;
        patient_id: number;
        provider_type: string;
        appointment_date: string;
        start_time: string;
        end_time: string;
        status: string;
        cancellation_reason?: string;
        created_at: string;
        updated_at: string;
        doctor_id?: number;
        home_care_provider_id?: number;
    }

    let appointments: Appointment[] = [];
    let loading = true;
    let error: string | null = null;
    let selectedDate = new Date().toISOString().split('T')[0];
    let activeTab: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';

    // Get doctor ID from stored user data
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const doctorId = userData.id;

    // New reactive variables for global listing
    let allAvailabilities = [];
    let loadingAllAvailabilities = true;
    let errorAllAvailabilities: string | null = null;

    onMount(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!token || !user) {
            goto('/login');
            return;
        }
    
        if (user.role !== 'doctor') {
            goto('/login');
            return;
        }
    });

    onMount(async () => {
        await loadAppointments();
        loadAllAvailabilities();
    });

    // Format date for API requests
    function formatDateForApi(date: string): string {
        return new Date(date).toISOString().split('T')[0];
    }

    async function loadAppointments() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                error = 'Authentication token not found';
                goto('/login');
                return;
            }

            const formattedDate = formatDateForApi(selectedDate);
            console.log('Loading appointments for:', {
                doctorId,
                date: formattedDate,
            });

            // Updated URL to use the correct query parameters
            const response = await fetch(
                `${BACKEND_URL}/api/appointments?type=doctor&providerId=${doctorId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received appointments:', data);

            appointments = data.map((apt: Appointment) => ({
                ...apt,
                start_time: apt.start_time?.substring(0, 5) || '',
                end_time: apt.end_time?.substring(0, 5) || '',
                appointment_date: formatDateForApi(apt.appointment_date)
            }));

            error = null;
        } catch (err) {
            console.error('Load appointments error:', err);
            error = err instanceof Error ? err.message : 'Failed to load appointments';
        } finally {
            loading = false;
        }
    }

    async function updateAppointmentStatus(appointmentId: number, newStatus: string, reason?: string) {
        try {
            const token = localStorage.getItem('token');
            const appointment = appointments.find(apt => apt.id === appointmentId);
            if (!appointment) {
                throw new Error('Appointment not found');
            }

            // Format date and times properly and build a full RFC3339 datetime
            const formattedDate = new Date(appointment.appointment_date).toISOString().split('T')[0];
            const fullDate = formattedDate + "T00:00:00Z"; // Append default time

            const formattedStartTime = `${appointment.start_time}:00`;
            const formattedEndTime = `${appointment.end_time}:00`;

            const payload = {
                status: newStatus,
                provider_type: 'doctor',
                patient_id: appointment.patient_id,
                doctor_id: appointment.doctor_id,
                appointment_date: fullDate,
                start_time: formattedStartTime,
                end_time: formattedEndTime
                // Remove or include service_type_id as needed
            };

            if (reason) {
                payload.cancellation_reason = reason;
            }

            const response = await fetch(`${BACKEND_URL}/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update appointment');
            }

            await loadAppointments();
        } catch (err) {
            console.error('Update appointment error:', err);
            error = err instanceof Error ? err.message : 'Failed to update appointment';
        }
    }

    async function handleCancel(appointmentId: number) {
        const reason = window.prompt('Please enter a reason for cancellation:');
        if (reason !== null) { // Only proceed if user didn't click Cancel
            await updateAppointmentStatus(appointmentId, 'cancelled', reason);
        }
    }

    // Function to load availability for this specific doctor
    async function loadAllAvailabilities() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                errorAllAvailabilities = 'Authentication token not found';
                return;
            }
            // Change fetch URL to specific doctor's endpoint using doctorId
            const response = await fetch(`${BACKEND_URL}/api/doctors/${doctorId}/availability`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            // Optionally format times if needed
            allAvailabilities = data.map(slot => ({
                ...slot,
                start_time: new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                end_time: new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            errorAllAvailabilities = null;
        } catch (err) {
            errorAllAvailabilities = err instanceof Error ? err.message : 'Failed to load availabilities';
        } finally {
            loadingAllAvailabilities = false;
        }
    }

    // Reload appointments when date changes
    $: {
        if (selectedDate) {
            console.log('Date changed, reloading appointments:', selectedDate);
            loadAppointments();
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

    $: translations = $currentTranslations;
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-8" transition:fade>
        <!-- Header -->
        <div class="glass-card">
            <h1 class="text-3xl font-bold text-white mb-6">{$currentTranslations.doctorDashboard.title}</h1>
            
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
                {#each ['upcoming', 'completed', 'cancelled'] as tab}
                    <button
                        class="glass-button"
                        class:active={activeTab === tab}
                        on:click={() => activeTab = tab as 'upcoming' | 'completed' | 'cancelled'}
                    >
                        {$currentTranslations.doctorDashboard.appointments.tabs[tab]}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Appointments List -->
        {#if loading}
            <div class="flex justify-center">
                <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <span class="ml-3 text-white">{$currentTranslations.doctorDashboard.appointments.loading}</span>
            </div>
        {:else if error}
            <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200">
                {$currentTranslations.doctorDashboard.appointments.error}
            </div>
        {:else if filteredAppointments.length === 0}
            <div class="glass-panel text-center text-gray-300">
                {$currentTranslations.doctorDashboard.appointments.noAppointments}
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
                                        on:click={() => handleCancel(appointment.id)}
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

        <!-- Global Availability Listing Section in Doctor Dashboard -->
        <div class="glass-card p-6 mt-8" transition:fade>
            <h2 class="text-2xl font-bold text-white mb-6">{$currentTranslations.doctorDashboard.availability.title}</h2>
            {#if loadingAllAvailabilities}
                <div class="flex justify-center">
                    <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            {:else if errorAllAvailabilities}
                <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200">
                    {errorAllAvailabilities}
                </div>
            {:else if allAvailabilities.length === 0}
                <p class="text-center text-gray-400">No availability slots found.</p>
            {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each allAvailabilities as slot}
                        <div class="glass-panel">
                            <div class="flex flex-col">
                                <h3 class="text-white font-semibold">Doctor ID: {slot.doctor_id}</h3>
                                <p class="text-gray-300">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.day_of_week]}</p>
                                <p class="text-blue-300">
                                    {slot.start_time} - {slot.end_time}
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

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
