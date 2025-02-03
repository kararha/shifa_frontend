<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { authStore } from '$lib/stores/authStore';

    export let show = false;
    export let doctorId: number;
    export let doctorName: string;
    export let isAvailable = true; // Add this prop

    const dispatch = createEventDispatcher();
    let errorMessage: string | null = null;
    let isSubmitting = false;

    $: if (show) {
        errorMessage = null;
    }

    let appointmentData = {
        appointment_date: '',
        appointment_time: '',
        reason: ''
    };

    async function handleSubmit() {
        try {
            errorMessage = null;

            if (!isAvailable) {
                errorMessage = 'This doctor is currently not available for appointments.';
                return;
            }

            if (!$authStore?.user?.id) {
                errorMessage = 'Please log in first to book an appointment.';
                return;
            }

            if (!appointmentData.appointment_date || !appointmentData.appointment_time || !appointmentData.reason) {
                throw new Error('Please fill in all required fields.');
            }

            isSubmitting = true;

            // Create UTC date objects for appointment
            const appointmentDateTime = new Date(`${appointmentData.appointment_date}T${appointmentData.appointment_time}:00`);
            const startTimeUTC = appointmentDateTime.toISOString();
            const endTimeUTC = new Date(appointmentDateTime.getTime() + (60 * 60 * 1000)).toISOString();

            const appointmentPayload = {
                patient_id: $authStore.user.id,
                provider_type: 'doctor',
                doctor_id: doctorId,
                appointment_date: startTimeUTC, // Match the exact format from working example
                start_time: startTimeUTC,
                end_time: endTimeUTC,
                status: 'scheduled' // Changed from 'pending' to match working example
            };

            console.log('Appointment payload:', appointmentPayload);

            // Update the endpoint URL to match the backend route
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(appointmentPayload)
            });

            const responseText = await response.text();
            console.log('Response:', responseText);

            if (!response.ok) {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.message || 'Failed to create appointment');
            }

            const result = JSON.parse(responseText);
            dispatch('appointmentCreated', result);
            show = false;
        } catch (error: any) {
            errorMessage = error.message || 'Failed to create appointment';
            console.error('Error creating appointment:', error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<!-- The rest of the template remains the same as in previous answer -->

{#if show}
<div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white/70 backdrop-blur-md rounded-lg max-w-md w-full p-6 relative shadow-lg border border-white/20">
        <button
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            on:click={() => show = false}
            disabled={isSubmitting}
        >
            ✕
        </button>

        <h2 class="text-2xl font-bold mb-4 text-gray-800">Book Appointment with Dr. {doctorName}</h2>

        {#if !isAvailable}
            <div class="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
                <p class="font-semibold">Doctor Not Available</p>
                <p class="text-sm mt-1">This doctor is currently not accepting new appointments.</p>
            </div>
        {:else if errorMessage}
            <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {errorMessage}
            </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <div>
                <label for="appointment_date" class="block text-sm font-medium text-gray-700">
                    Date
                </label>
                <input
                    type="date"
                    id="appointment_date"
                    bind:value={appointmentData.appointment_date}
                    min={new Date().toISOString().split('T')[0]}
                    class="mt-1 block w-full rounded-md bg-white/50 border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 backdrop-blur-sm"
                    required
                />
            </div>

            <div>
                <label for="appointment_time" class="block text-sm font-medium text-gray-700">
                    Time
                </label>
                <input
                    type="time"
                    id="appointment_time"
                    bind:value={appointmentData.appointment_time}
                    class="mt-1 block w-full rounded-md bg-white/50 border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 backdrop-blur-sm"
                    required
                />
            </div>

            <div>
                <label for="reason" class="block text-sm font-medium text-gray-700">
                    Reason for Visit
                </label>
                <textarea
                    id="reason"
                    bind:value={appointmentData.reason}
                    rows="3"
                    class="mt-1 block w-full rounded-md bg-white/50 border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 backdrop-blur-sm"
                    required
                ></textarea>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    class="px-4 py-2 text-gray-700 bg-white/50 rounded-md hover:bg-white/70 backdrop-blur-sm transition-all duration-200"
                    on:click={() => show = false}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="px-4 py-2 text-white bg-blue-600/90 rounded-md hover:bg-blue-700/90 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !isAvailable}
                >
                    {#if !isAvailable}
                        Not Available
                    {:else if isSubmitting}
                        Booking...
                    {:else}
                        Book Appointment
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

<style>
    :global(body) {
        overflow-y: auto !important;
        padding-right: 0 !important;
    }
</style>