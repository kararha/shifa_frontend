<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { authStore } from '$lib/stores/authStore';

    export let show = false;
    export let doctorId: number;
    export let doctorName: string;

    const dispatch = createEventDispatcher();
    let errorMessage: string | null = null;
    let isSubmitting = false;

    // Get patient ID from auth store
    $: patientId = $authStore?.id;
    $: if (show && !$authStore) {
        errorMessage = 'Please log in first to book an appointment.';
    }

    let appointmentData = {
        doctor_id: doctorId,
        appointment_date: '',
        appointment_time: '',
        reason: '',
        status: 'pending'
    };

    async function handleSubmit() {
        try {
            if (!$authStore?.id) {
                throw new Error('Please log in first to book an appointment.');
            }

            isSubmitting = true;
            errorMessage = null;
            
            const formattedDate = new Date(`${appointmentData.appointment_date}T${appointmentData.appointment_time}`);
            
            // Ensure all numeric fields are numbers, not strings
            const appointmentPayload = {
                doctor_id: Number(doctorId),
                patient_id: Number($authStore.id),
                reason: appointmentData.reason,
                status: 'pending',
                appointment_datetime: formattedDate.toISOString()
            };

            console.log('Sending payload:', appointmentPayload); // Debug log

            const response = await fetch('http://localhost:8888/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(appointmentPayload)
            });

            let data;
            const textResponse = await response.text();
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                console.error('Failed to parse response:', textResponse);
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create appointment');
            }

            // Reset form
            appointmentData = {
                doctor_id: doctorId,
                appointment_date: '',
                appointment_time: '',
                reason: '',
                status: 'pending'
            };

            dispatch('appointmentCreated', data);
            show = false;

        } catch (error: any) {
            errorMessage = error.message || 'Failed to create appointment';
            console.error('Error creating appointment:', error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

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

            {#if errorMessage}
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
                        class="px-4 py-2 text-white bg-blue-600/90 rounded-md hover:bg-blue-700/90 backdrop-blur-sm transition-all duration-200"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Booking...' : 'Book Appointment'}
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