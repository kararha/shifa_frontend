// src/routes/appointments/+page.svelte
<script lang="ts">
import { onMount } from 'svelte';
import { listAppointments } from '$lib/api/appointmentApi';
import AppointmentForm from '$components/appointments/AppointmentForm.svelte';

let appointments = [];
let selectedAppointment = null;

async function fetchAppointments() {
    appointments = await listAppointments();
}

onMount(fetchAppointments);
</script>

<h1>Appointments</h1>

<AppointmentForm 
    on:save={() => {
        fetchAppointments();
        selectedAppointment = null;
    }}
/>

<ul>
    {#each appointments as appointment}
        <li>
            {appointment.date} - {appointment.time}
            <button on:click={() => selectedAppointment = appointment}>
                Edit
            </button>
        </li>
    {/each}
</ul>