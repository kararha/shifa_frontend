<!-- // src/lib/components/consultations/ConsultationForm.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { authStore } from '$lib/stores/authStore';
  
  export let show = false;
  export let doctorId: string;
  export let doctorName: string;
  export let consultationFee: number;

  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';

  // Get patient ID from auth store
  $: patientId = $authStore?.id;
  $: if (show && !patientId) {
    error = 'Please log in first to book a consultation.';
  }

  let consultationData = {
    consultation_type: 'video',
    patient_notes: ''
  };

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      if (!patientId) {
        throw new Error('Please log in first to book a consultation.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctor_id: parseInt(doctorId),
          patient_id: parseInt(patientId),
          ...consultationData,
          fee: consultationFee
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book consultation');
      }

      dispatch('consultationCreated', data);
      show = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'An unexpected error occurred';
      console.error('Consultation error:', e);
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
      
      {#if error}
        <div class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p class="text-red-200">
            {#if error.includes('log in')}
              <span class="font-semibold">Authentication Required:</span>
            {:else}
              <span class="font-semibold">Error:</span>
            {/if}
            {error}
          </p>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">
            Consultation Type
          </label>
          <select
            bind:value={consultationData.consultation_type}
            class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
            required
          >
            <option value="video" class="bg-gray-800">Video Call</option>
            <option value="audio" class="bg-gray-800">Audio Call</option>
            <option value="chat" class="bg-gray-800">Chat</option>
          </select>
        </div>

        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">
            Notes/Symptoms
          </label>
          <textarea
            bind:value={consultationData.patient_notes}
            class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white h-32 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
            placeholder="Please describe your symptoms or reason for consultation..."
            required
          ></textarea>
        </div>

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
