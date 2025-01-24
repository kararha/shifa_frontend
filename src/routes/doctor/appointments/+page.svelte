<script>
    import { onMount } from 'svelte';

    type Appointment = {
        patientName: string;
        date: string;
        time: string;
        status: string;
    };

    let appointments = /** @type {Appointment[]} */ ([]);
    let loading = true;

    onMount(async () => {
        try {
            // TODO: Replace with actual API endpoint
            const response = await fetch('/api/appointments');
            appointments = await response.json();
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            loading = false;
        }
    });
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Doctor Appointments</h1>

    {#if loading}
        <p>Loading appointments...</p>
    {:else if appointments.length === 0}
        <p>No appointments found.</p>
    {:else}
        <div class="grid gap-4">
            {#each appointments as appointment}
                <div class="appointment-card">
                    <h2 class="font-semibold">Patient: {appointment.patientName}</h2>
                    <p>Date: {new Date(appointment.date).toLocaleDateString()}</p>
                    <p>Time: {appointment.time}</p>
                    <p>Status: {appointment.status}</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .container {
        padding: 2rem;
    }

    .appointment-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(8px) saturate(180%);
        -webkit-backdrop-filter: blur(8px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        color: white;
    }

    h1 {
        color: white;
        margin-bottom: 2rem;
    }
</style>