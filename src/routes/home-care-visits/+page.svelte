// src/routes/home-care-visits/+page.svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import type { HomeCareVisit } from '$lib/types';
    import HomeCareVisitForm from '$lib/components/home-care-visits/HomeCareVisitForm.svelte';
    import HomeCareVisitList from '$lib/components/home-care-visits/HomeCareVisitList.svelte';
    import { homeCareVisitStore } from '$lib/stores/homeCareVisitStore';

    let visits: HomeCareVisit[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            await homeCareVisitStore.fetchVisits();
            visits = $homeCareVisitStore.visits;
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    async function createVisit(visitData: Partial<HomeCareVisit>) {
        try {
            await homeCareVisitStore.createVisit(visitData);
        } catch (err) {
            error = err.message;
        }
    }
</script>

{#if loading}
    <p>Loading home care visits...</p>
{:else if error}
    <p>Error: {error}</p>
{:else}
    <div class="home-care-visits-page">
        <h1>Home Care Visits</h1>
        <HomeCareVisitForm on:submit={createVisit} />
        < HomeCareVisitList {visits} />
    </div>
{/if}

// src/lib/types.ts (add to existing file)
export interface HomeCareVisit {
    id?: number;
    patientId: number;
    providerId: number;
    scheduledDate: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

// src/lib/stores/homeCareVisitStore.ts
import { writable } from 'svelte/store';
import type { HomeCareVisit } from '$lib/types';
import { api } from '$lib/api';

function createHomeCareVisitStore() {
    const { subscribe, set, update } = writable({
        visits: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        fetchVisits: async () => {
            try {
                const response = await api.get('/home-care-visits');
                update(store => ({ ...store, visits: response.data }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        createVisit: async (visitData: Partial<HomeCareVisit>) => {
            try {
                const response = await api.post('/home-care-visits', visitData);
                update(store => ({
                    ...store, 
                    visits: [...store.visits, response.data]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const homeCareVisitStore = createHomeCareVisitStore();