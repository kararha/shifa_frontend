<!-- // src/lib/components/consultations/ConsultationList.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  interface Consultation {
    id: number;
    patient_id: number;
    doctor_id: number;
    appointment_id: number;
    consultation_type: string;
    status: string;
    started_at: string;
    completed_at: string;
    fee: number;
  }

  export let doctorId: string;
  let consultations: Consultation[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/consultations?doctor_id=${doctorId}`);
      if (!response.ok) throw new Error('Failed to fetch consultations');
      consultations = await response.json();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  });

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }
</script>

<div class="glass-panel mt-8">
  <h2 class="text-xl font-semibold text-white mb-6">Consultations History</h2>
  
  {#if loading}
    <div class="flex justify-center py-4">
      <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="text-red-400 text-center py-4">{error}</div>
  {:else if consultations.length === 0}
    <p class="text-gray-400 text-center py-4">No consultations found</p>
  {:else}
    <div class="space-y-4">
      {#each consultations as consultation (consultation.id)}
        <div class="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors" transition:fade>
          <div class="flex justify-between items-start">
            <div>
              <span class="text-white font-medium">
                Consultation #{consultation.id}
              </span>
              <p class="text-gray-400 text-sm mt-1">
                Type: {consultation.consultation_type}
              </p>
            </div>
            <span class="px-3 py-1 rounded-full text-sm 
              {consultation.status === 'completed' ? 'bg-green-500/20 text-green-300' : 
               consultation.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' : 
               'bg-gray-500/20 text-gray-300'}">
              {consultation.status}
            </span>
          </div>
          <div class="mt-3 text-sm text-gray-400">
            <p>Started: {formatDate(consultation.started_at)}</p>
            {#if consultation.completed_at}
              <p>Completed: {formatDate(consultation.completed_at)}</p>
            {/if}
            <p class="mt-2 text-white">Fee: ${consultation.fee}</p>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
