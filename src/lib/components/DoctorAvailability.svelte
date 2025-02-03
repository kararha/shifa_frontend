<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';

    export let doctorId: string;

    interface Availability {
        id: number;
        doctor_id: number;
        day_of_week: number;
        start_time: string; // Will store as "15:04:05" format
        end_time: string;   // Will store as "15:04:05" format
    }

    // Match Go's time.Weekday (0 = Sunday, 6 = Saturday)
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let availabilities: Availability[] = [];
    let loading = true;
    let error: string | null = null;
    let showAddForm = false;

    // Initialize with Sunday (0)
    let newSlot = {
        day_of_week: 0,
        start_time: '09:00',
        end_time: '17:00'
    };

    onMount(async () => {
        await loadAvailability();
    });

    async function loadAvailability() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                error = 'Authentication token not found';
                return;
            }

            // Debug information
            console.log('Loading availability with:', {
                doctorId,
                token: token ? 'exists' : 'missing',
                url: `${BACKEND_URL}/api/doctors/${doctorId}/availability`
            });

            const response = await fetch(`${BACKEND_URL}/api/doctors/${doctorId}/availability`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Log the response status and headers
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            // Log raw response for debugging
            const text = await response.text();
            console.log('Raw availability response:', text);

            if (!response.ok) {
                if (response.status === 404) {
                    availabilities = [];
                    return;
                }
                throw new Error(text || 'Failed to load availability');
            }

            try {
                const data = JSON.parse(text);
                console.log('Parsed availability data:', data);

                if (Array.isArray(data)) {
                    availabilities = data.map(slot => ({
                        ...slot,
                        day_of_week: Number(slot.day_of_week),
                        // Ensure consistent time format
                        start_time: formatTimeForBackend(slot.start_time),
                        end_time: formatTimeForBackend(slot.end_time)
                    }));
                } else {
                    availabilities = [];
                }
            } catch (e) {
                console.error('JSON parsing error:', e);
                throw new Error('Invalid response format');
            }

            error = null;
            console.log('Processed availabilities:', availabilities);
        } catch (err) {
            console.error('Load availability error:', err);
            error = err instanceof Error ? err.message : 'Failed to load availability';
            availabilities = []; // Reset on error
        } finally {
            loading = false;
        }
    }

    // Add validation function
    function validateDayOfWeek(day: number): boolean {
        return day >= 0 && day <= 6;
    }

    // Function to ensure time is in correct format for Go backend
    function formatTimeForBackend(timeStr: string): string {
        try {
            // Ensure time has seconds component
            if (!timeStr.includes(':')) return '';
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                return `${parts[0]}:${parts[1]}:00`;
            }
            return timeStr;
        } catch (e) {
            console.error('Time formatting error:', e);
            return timeStr;
        }
    }

    async function addAvailability() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                error = 'Authentication token not found';
                return;
            }

            // Validate day of week
            if (!validateDayOfWeek(newSlot.day_of_week)) {
                error = 'Invalid day of week';
                return;
            }

            if (newSlot.start_time >= newSlot.end_time) {
                error = 'End time must be after start time';
                return;
            }

            // Format the time values with seconds for backend
            const payload = {
                doctor_id: parseInt(doctorId),
                day_of_week: newSlot.day_of_week,
                start_time: formatTimeForBackend(newSlot.start_time),
                end_time: formatTimeForBackend(newSlot.end_time)
            };

            console.log('Sending formatted payload:', payload);

            const response = await fetch(`${BACKEND_URL}/api/doctors/${doctorId}/availability`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            console.log('Server response:', responseText);

            if (!response.ok) {
                throw new Error(responseText || 'Failed to add availability');
            }

            await loadAvailability();
            showAddForm = false;
            newSlot = { day_of_week: 0, start_time: '09:00', end_time: '17:00' };
            error = null;
        } catch (err) {
            console.error('Add availability error:', err);
            error = err instanceof Error ? err.message : 'Failed to add availability';
        }
    }

    async function deleteAvailability(id: number) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${BACKEND_URL}/api/doctors/${doctorId}/availability/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete availability');
            }
            
            await loadAvailability();
        } catch (err) {
            console.error('Delete availability error:', err);
            error = err instanceof Error ? err.message : 'Failed to delete availability';
        }
    }

    // Helper function to format time for display
    function formatTimeForDisplay(timeStr: string): string {
        try {
            const parts = timeStr.split(':');
            if (parts.length < 2) return timeStr;
            
            const hours = parseInt(parts[0]);
            const minutes = parts[1];
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            
            return `${displayHours}:${minutes} ${period}`;
        } catch (e) {
            console.error('Time display formatting error:', e);
            return timeStr;
        }
    }

    // Update the display in the template
    function getDayName(dayIndex: number): string {
        return DAYS[dayIndex] || 'Unknown';
    }
</script>

<div class="glass-card p-6" transition:fade>
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">Availability Schedule</h2>
        <button 
            class="glass-button"
            on:click={() => showAddForm = !showAddForm}
        >
            {showAddForm ? 'Cancel' : 'Add Time Slot'}
        </button>
    </div>

    {#if showAddForm}
        <form class="glass-panel space-y-4 mb-6" on:submit|preventDefault={addAvailability}>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label for="day-select" class="block text-gray-300 mb-2">Day</label>
                    <select
                        id="day-select"
                        bind:value={newSlot.day_of_week}
                        class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    >
                        {#each DAYS as day, index}
                            <option value={index}>{day}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label for="start-time" class="block text-gray-300 mb-2">Start Time</label>
                    <input
                        id="start-time"
                        type="time"
                        bind:value={newSlot.start_time}
                        class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                </div>
                <div>
                    <label for="end-time" class="block text-gray-300 mb-2">End Time</label>
                    <input
                        id="end-time"
                        type="time"
                        bind:value={newSlot.end_time}
                        class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                </div>
            </div>
            <div class="flex justify-end">
                <button type="submit" class="glass-button-primary">
                    Add Slot
                </button>
            </div>
        </form>
    {/if}

    {#if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-4">
            {error}
        </div>
    {:else if loading}
        <div class="flex justify-center">
            <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    {:else if availabilities.length === 0}
        <p class="text-center text-gray-400">No availability slots set</p>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each availabilities as slot}
                <div class="glass-panel">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-white font-semibold">{getDayName(slot.day_of_week)}</h3>
                            <p class="text-gray-300">
                                {formatTimeForDisplay(slot.start_time)} - 
                                {formatTimeForDisplay(slot.end_time)}
                            </p>
                        </div>
                        <button
                            class="text-red-400 hover:text-red-300"
                            on:click={() => deleteAvailability(slot.id)}
                            aria-label="Delete availability slot"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* ...existing glass styles... */
</style>
