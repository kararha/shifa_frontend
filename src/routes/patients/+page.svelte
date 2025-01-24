<!-- // src/routes/patients/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { patientStore } from '$lib/stores/patientStore';
    import { authStore } from '$lib/stores/authStore';

    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        if (!$authStore.isAuthenticated) {
            goto('/login');
            return;
        }

        try {
            loading = true;
            await patientStore?.fetchPatients();
        } catch (err: any) {
            if (err.message === '401') {
                goto('/login');
            } else {
                error = err?.message || 'An error occurred';
            }
        } finally {
            loading = false;
        }
    });
</script>

{#if loading}
    <p>Loading patients...</p>
{:else if error}
    <p>Error: {error}</p>
{:else}
    <div class="patients-page">
        <h1>Patients</h1>
        <div class="patients-grid">
            {#each $patientStore?.patients || [] as patient}
                <a href="/patients/{patient.user_id}" class="patient-card">
                    <h3>{patient.name}</h3>
                    <p>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</p>
                    <p>Gender: {patient.gender}</p>
                </a>
            {/each}
        </div>
    </div>
{/if}

<style>
    .patients-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        padding: 1rem;
    }

    .patient-card {
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        text-decoration: none;
        color: inherit;
        transition: box-shadow 0.2s;
    }

    .patient-card:hover {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
</style>