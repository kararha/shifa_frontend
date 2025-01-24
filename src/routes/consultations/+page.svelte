// src/routes/consultations/+page.svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import type { Consultation } from '$lib/types';
    import ConsultationForm from '$lib/components/consultations/ConsultationForm.svelte';
    import ConsultationList from '$lib/components/consultations/ConsultationList.svelte';
    import { consultationStore } from '$lib/stores/consultationStore';

    let consultations: Consultation[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            await consultationStore.fetchConsultations();
            consultations = $consultationStore.consultations;
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    async function createConsultation(consultationData: Partial<Consultation>) {
        try {
            await consultationStore.createConsultation(consultationData);
        } catch (err) {
            error = err.message;
        }
    }
</script>

{#if loading}
    <p>Loading consultations...</p>
{:else if error}
    <p>Error: {error}</p>
{:else}
    <div class="consultations-page">
        <h1>Consultations</h1>
        <ConsultationForm on:submit={createConsultation} />
        <ConsultationList {consultations} />
    </div>
{/if}

// src/lib/types.ts (add to existing file)
export interface Consultation {
    id?: number;
    patientId: number;
    doctorId: number;
    date: string;
    time: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

// src/lib/stores/consultationStore.ts
import { writable } from 'svelte/store';
import type { Consultation } from '$lib/types';
import { api } from '$lib/api';

function createConsultationStore() {
    const { subscribe, set, update } = writable({
        consultations: [],
 loading: false,
        error: null
    });

    return {
        subscribe,
        fetchConsultations: async () => {
            try {
                const response = await api.get('/consultations');
                update(store => ({ ...store, consultations: response.data }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        createConsultation: async (consultationData: Partial<Consultation>) => {
            try {
                const response = await api.post('/consultations', consultationData);
                update(store => ({
                    ...store, 
                    consultations: [...store.consultations, response.data]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const consultationStore = createConsultationStore();