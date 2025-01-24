<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';

    export let doctorId: string;

    interface Availability {
        id: number;
        doctor_id: number;
        day_of_week: number;
        start_time: string;
        end_time: string;
    }

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let availabilities: Availability[] = [];
    let loading = true;
    let error: string | null = null;
    let showAddForm = false;

    let newSlot = {
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00'
    };

    onMount(async () => {
        await loadAvailability();
    });

    async function loadAvailability() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${BACKEND_URL}/api/doctors/${doctorId}/availability`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load availability');
            availabilities = await response.json();
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load availability';
        } finally {
            loading = false;
        }
    }

    async function addAvailability() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${BACKEND_URL}/api/doctors/${doctorId}/availability`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSlot)
            });

            if (!response.ok) throw new Error('Failed to add availability');
            
            await loadAvailability();
            showAddForm = false;
            newSlot = { day_of_week: 1, start_time: '09:00', end_time: '17:00' };
        } catch (err) {
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
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete availability');
            await loadAvailability();
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to delete availability';
        }
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
                    <label class="block text-gray-300 mb-2">Day</label>
                    <select
                        bind:value={newSlot.day_of_week}
                        class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    >
                        {#each DAYS as day, index}
                            <option value={index}>{day}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label class="block text-gray-300 mb-2">Start Time</label>
                    <input
                        type="time"
                        bind:value={newSlot.start_time}
                        class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                </div>
                <div>
                    <label class="block text-gray-300 mb-2">End Time</label>
                    <input
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
                            <h3 class="text-white font-semibold">{DAYS[slot.day_of_week]}</h3>
                            <p class="text-gray-300">
                                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <button
                            class="text-red-400 hover:text-red-300"
                            on:click={() => deleteAvailability(slot.id)}
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
