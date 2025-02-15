<!-- // src/lib/components/consultations/ConsultationForm.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { authStore } from '$lib/stores/authStore';
  import type { Consultation } from '$lib/types/consultation';
  import { apiRequest } from '$lib/utils/api';
  import { API_CONFIG } from '$lib/config/api';
  
  export let show = false;
  export let doctorId: string;
  export let doctorName: string;
  export let consultationFee: number;

  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';

  // Get patient ID from auth store properly
  $: isAuthenticated = $authStore.isAuthenticated;
  $: patientId = $authStore.user?.id;

  onMount(() => {
    authStore.initialize();
  });

  let consultationData: Partial<Consultation> = {
    patient_id: 0,
    doctor_id: 0,
    status: 'pending',
    fee: consultationFee
  };

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      if (!isAuthenticated || !patientId) {
        throw new Error('Please log in first to book a consultation.');
      }

      const payload = {
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        status: 'pending',
        fee: Number(consultationFee),
        started_at: new Date().toISOString()
      };

      console.log('Submitting consultation with payload:', payload);

      const data = await apiRequest<Consultation>(API_CONFIG.endpoints.consultations, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log('Consultation created successfully:', data);
      dispatch('consultationCreated', data);
      show = false;

    } catch (e: any) {
      console.error('Consultation submission error:', e);
      error = e.responseText 
        ? `Error: ${e.message}. Server response: ${e.responseText.substring(0, 100)}...`
        : e.message || 'An unexpected error occurred';
    } finally {
      loading = false;
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" transition:fade>
    <div class="bg-white/10 backdrop-blur-md rounded-xl max-w-lg w-full p-8 shadow-xl border border-white/20">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">Book Consultation with Dr. {doctorName}</h2>
        <button 
          class="text-gray-400 hover:text-white transition-colors"
          on:click={() => show = false}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {#if !isAuthenticated}
        <div class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p class="text-red-200">
            <span class="font-semibold">Authentication Required:</span>
            Please <a href="/login" class="text-blue-300 underline">log in</a> to book a consultation.
          </p>
        </div>
      {:else if error}
        <div class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p class="text-red-200">
            <span class="font-semibold">Error:</span> {error}
          </p>
        </div>
      {/if}

      {#if isAuthenticated}
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <div class="bg-white/5 rounded-lg p-4 border border-white/10">
            <div class="flex justify-between items-center">
              <span class="text-gray-300">Consultation Fee</span>
              <span class="text-white font-semibold">${consultationFee}</span>
            </div>
          </div>

          <div class="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              class="px-6 py-2.5 rounded-lg font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-all duration-200"
              on:click={() => show = false}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600/90 hover:bg-blue-700/90 
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                focus:ring-2 focus:ring-blue-500/30"
              disabled={loading}
            >
              {#if loading}
                <div class="flex items-center space-x-2">
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Booking...</span>
                </div>
              {:else}
                Book Consultation
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
{/if}

<style>
  select option {
    @apply bg-gray-800 text-white;
  }

  textarea::placeholder {
    @apply text-gray-400;
  }

  /* Custom scrollbar for textarea */
  textarea {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  textarea::-webkit-scrollbar {
    width: 6px;
  }

  textarea::-webkit-scrollbar-track {
    background: transparent;
  }

  textarea::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  :global(body) {
    overflow-y: auto !important;
    padding-right: 0 !important;
  }
</style>
