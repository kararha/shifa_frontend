// src/routes/service-types/+page.svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import type { ServiceType } from '$lib/types';
    import ServiceTypeForm from '$lib/components/service-types/ServiceTypeForm.svelte';
    import ServiceTypeList from '$lib/components/service-types/ServiceTypeList.svelte';
    import { serviceTypeStore } from '$lib/stores/serviceTypeStore';

    let serviceTypes: ServiceType[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            await serviceTypeStore.fetchServiceTypes();
            serviceTypes = $serviceTypeStore.serviceTypes;
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    async function createServiceType(serviceTypeData: Partial<ServiceType>) {
        try {
            await serviceTypeStore.createServiceType(serviceTypeData);
        } catch (err) {
            error = err.message;
        }
    }
</script>

// src/lib/types.ts (add to existing file)
export interface ServiceType {
    id?: number;
    name: string;
    description: string;
    basePrice: number;
    category: string;
}

// src/lib/stores/serviceTypeStore.ts
import { writable } from 'svelte/store';
import type { ServiceType } from '$lib/types';
import { api } from '$lib/api';

function createServiceTypeStore() {
    const { subscribe, set, update } = writable({
        serviceTypes: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        fetchServiceTypes: async () => {
            try {
                const response = await api.get('/service-types');
                update(store => ({ ...store, serviceTypes: response.data }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        createServiceType: async (serviceTypeData: Partial<ServiceType>) => {
            try {
                const response = await api.post('/service-types', serviceTypeData);
                update(store => ({
                    ...store, 
                    serviceTypes: [...store.serviceTypes, response.data]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const serviceTypeStore = createServiceTypeStore();