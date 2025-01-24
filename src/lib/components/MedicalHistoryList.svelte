<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';
    // import MedicalHistoryModal from './MedicalHistoryModal.svelte';

    export let patientId: string;

    interface MedicalHistory {
        id: number;
        patient_id: number;
        condition_name: string;
        diagnosis_date: string;
        treatment: string;
        is_current: boolean;
    }

    let histories: MedicalHistory[] = [];
    let loading = true;
    let error: string | null = null;
    let showAddModal = false;
    let editingHistory: MedicalHistory | null = null;

    onMount(async () => {
        await loadMedicalHistories();
    });

    async function loadMedicalHistories() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${BACKEND_URL}/api/medical-histories?patient_id=${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load medical histories');
            histories = await response.json();
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load medical histories';
        } finally {
            loading = false;
        }
    }

    async function handleSave(event: CustomEvent<MedicalHistory>) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const history = event.detail;
            const url = history.id 
                ? `${BACKEND_URL}/api/medical-histories/${history.id}`
                : `${BACKEND_URL}/api/medical-histories`;

            const response = await fetch(url, {
                method: history.id ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...history,
                    patient_id: parseInt(patientId)
                })
            });

            if (!response.ok) throw new Error('Failed to save medical history');
            await loadMedicalHistories();
            showAddModal = false;
            editingHistory = null;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to save medical history';
        }
    }

    async function deleteHistory(id: number) {
        if (!confirm('Are you sure you want to delete this medical history?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${BACKEND_URL}/api/medical-histories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete medical history');
            await loadMedicalHistories();
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to delete medical history';
        }
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString();
    }
</script>

<div class="glass-card p-6 space-y-6" transition:fade>
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold text-white">Medical History</h2>
        <button 
            class="glass-button"
            on:click={() => {
                editingHistory = null;
                showAddModal = true;
            }}
        >
            Add Medical History
        </button>
    </div>

    {#if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200">
            {error}
        </div>
    {:else if loading}
        <div class="flex justify-center">
            <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    {:else if histories.length === 0}
        <p class="text-center text-gray-400">No medical history records found</p>
    {:else}
        <div class="space-y-4">
            {#each histories as history}
                <div class="glass-panel">
                    <div class="flex justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-white mb-2">
                                {history.condition_name}
                                {#if history.is_current}
                                    <span class="ml-2 text-sm bg-blue-500/50 px-2 py-1 rounded-full">
                                        Current
                                    </span>
                                {/if}
                            </h3>
                            <p class="text-gray-300">Diagnosed: {formatDate(history.diagnosis_date)}</p>
                            <p class="text-gray-300 mt-2">Treatment: {history.treatment}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button
                                class="text-blue-400 hover:text-blue-300"
                                aria-label="Edit medical history"
                                on:click={() => {
                                    editingHistory = history;
                                    showAddModal = true;
                                }}
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </button>
                            <button
                                class="text-red-400 hover:text-red-300"
                                aria-label="Delete medical history"
                                on:click={() => deleteHistory(history.id)}
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- <MedicalHistoryModal
    bind:show={showAddModal}
    medicalHistory={editingHistory}
    on:save={handleSave}
    on:close={() => {
        showAddModal = false;
        editingHistory = null;
    }}
/> -->

<style>
    /* ...existing glass styles... */
</style>
