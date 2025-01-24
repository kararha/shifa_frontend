// src/routes/medical-histories/+page.svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import type { MedicalHistory } from '$lib/types';
    import MedicalHistoryForm from '$lib/components/medical-histories/MedicalHistoryForm.svelte';
    import MedicalHistoryList from '$lib/components/medical-histories/MedicalHistoryList.svelte';
    import { medicalHistoryStore } from '$lib/stores/medicalHistoryStore';

    let medicalHistories: MedicalHistory[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            await medicalHistoryStore.fetchMedicalHistories();
            medicalHistories = $medicalHistoryStore.medicalHistories;
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    async function createMedicalHistory(medicalHistoryData: Partial<MedicalHistory>) {
        try {
            await medicalHistoryStore.createMedicalHistory(medicalHistoryData);
        } catch (err) {
            error = err.message;
        }
    }
</script>

{#if loading}
    <p>Loading medical histories...</p>
{:else if error}
    <p>Error: {error}</p>
{:else}
    <div class="medical-histories-page">
        <h1>Medical Histories</h1>
        <MedicalHistoryForm on:submit={createMedicalHistory} />
        <MedicalHistoryList {medicalHistories} />
    </div>
{/if}

// src/lib/types.ts (add to existing file)
export interface MedicalHistory {
    id?: number;
    patientId: number;
    condition: string;
    treatment: string;
    date: string;
}

// src/lib/stores/medicalHistoryStore.ts
import { writable } from 'svelte/store';
import type { MedicalHistory } from '$lib/types';
import { api } from '$lib/api';

function createMedicalHistoryStore() {
    const { subscribe, set, update } = writable({
        medicalHistories: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        fetchMedicalHistories: async () => {
            try {
                const response = await api.get('/medical-histories');
                update(store => ({ ...store, medicalHistories: response.data }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        createMedicalHistory: async (medicalHistoryData: Partial<MedicalHistory>) => {
            try {
                const response = await api.post('/medical-histories', medicalHistoryData);
                update(store => ({
                    ...store, 
                    medicalHistories: [...store.medicalHistories, response.data]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const medicalHistoryStore = createMedicalHistoryStore();