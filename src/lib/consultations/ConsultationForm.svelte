<!-- // src/lib/components/consultations/ConsultationForm.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { authStore } from '$lib/stores/authStore';
  import type { Consultation } from '$lib/types/consultation';
  import { BACKEND_URL } from '$lib/constants';
  import Icon from '@iconify/svelte';
  import { t } from '$lib/i18n';
  
  // Define interface for consultation details matching the backend structure
  interface ConsultationDetails {
    id?: number;
    consultation_id: number;
    request_details?: string;
    symptoms?: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    follow_up_date?: string;
  }
  
  export let show = false;
  export let doctorId: string;
  export let doctorName: string;
  export let consultationFee: number;
  export let initialMessage: string = ''; // Optional initial message

  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';
  let flowStep = 1; // 1: Confirm, 2: Details, 3: Optional message

  // Fields for consultation details with complete structure
  let requestDetails = '';
  let symptoms = '';
  let diagnosis = ''; // Additional field (will be empty for patient submissions)
  let prescription = ''; // Additional field (will be empty for patient submissions)
  let notes = ''; // Additional field (will be empty for patient submissions)
  let followUpDate = ''; // Additional field (will be empty for patient submissions)
  
  // Get patient ID from auth store properly
  $: isAuthenticated = $authStore.isAuthenticated;
  $: patientId = $authStore.user?.id;

  onMount(() => {
    authStore.initialize();
  });

  async function handleSubmit() {
    if (flowStep === 1) {
      // Move to details step
      flowStep = 2;
      return;
    } else if (flowStep === 2) {
      // Move to optional message step
      flowStep = 3;
      return;
    }
    
    loading = true;
    error = '';

    try {
      if (!isAuthenticated || !patientId) {
        throw new Error('Please log in first to book a consultation.');
      }

      // Add more detailed logging
      console.log(`Creating consultation with doctor ID: ${doctorId} for patient ID: ${patientId}`);
      
      // Validate inputs before making API call
      if (!doctorId || isNaN(Number(doctorId))) {
        throw new Error('Invalid doctor ID');
      }
      
      if (!patientId || isNaN(Number(patientId))) {
        throw new Error('Invalid patient ID');
      }
      
      if (!consultationFee || isNaN(Number(consultationFee))) {
        throw new Error('Invalid consultation fee');
      }
      
      const consultationPayload = {
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        status: 'requested', // Changed from 'pending' to match the database enum
        fee: Number(consultationFee),
        is_paid: false // Mark consultation as unpaid initially
      };

      // Use BACKEND_URL directly instead of API_CONFIG
      console.log('Submitting consultation with payload:', consultationPayload);
      console.log(`API endpoint: ${BACKEND_URL}/api/consultations`);

      // Make the API request with expanded error handling
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token is missing. Please log in again.');
        }
        
        // STEP 1: BOOK - Create the basic consultation with a simpler approach
        console.log('STEP 1: Creating consultation...');
        const consultationResponse = await fetch(`${BACKEND_URL}/api/consultations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(consultationPayload)
        });
        
        if (!consultationResponse.ok) {
          const errorText = await consultationResponse.text();
          throw new Error(`Failed to create consultation: ${consultationResponse.status}. ${errorText}`);
        }
        
        const consultationData = await consultationResponse.json();
        console.log('Consultation created successfully:', consultationData);
        
        // STEP 2: Add consultation details - using a more direct approach
        if (requestDetails.trim() || symptoms.trim()) {
          console.log('Adding consultation details');
          
          // Simplify the payload to focus only on required fields
          const detailsPayload = {
            consultation_id: consultationData.id,
            request_details: requestDetails.trim() || '',
            symptoms: symptoms.trim() || ''
          };
          
          try {
            const detailsResponse = await fetch(`${BACKEND_URL}/api/consultations/${consultationData.id}/details`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(detailsPayload)
            });
            
            const detailsText = await detailsResponse.text();
            console.log(`Details API response (${detailsResponse.status}):`, detailsText);
            
            if (!detailsResponse.ok) {
              console.error('Failed to create consultation details:', detailsText);
            }
          } catch (detailsError) {
            console.error('Error creating consultation details:', detailsError);
          }
        }
        
        // STEP 3: Add initial message if provided
        if (initialMessage.trim()) {
          console.log('Sending initial message');
          
          try {
            const messagePayload = {
              consultation_id: consultationData.id,
              sender_type: 'patient',
              sender_id: Number(patientId),
              message: initialMessage.trim(),
              sent_at: new Date().toISOString(),
              is_read: false
            };
            
            const messageResponse = await fetch(`${BACKEND_URL}/api/chat/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(messagePayload)
            });
            
            const messageText = await messageResponse.text();
            console.log(`Message API response (${messageResponse.status}):`, messageText);
            
            if (!messageResponse.ok) {
              console.error('Failed to send initial message:', messageText);
            }
          } catch (messageError) {
            console.error('Error sending initial message:', messageError);
          }
        }
        
        // Finish up and redirect
        console.log('Consultation booking complete, redirecting to consultation page');
        dispatch('consultationCreated', { consultation: consultationData });
        show = false;
        
        // Wait a short moment to ensure all API calls have completed
        setTimeout(() => {
          window.location.href = `/consultations/${consultationData.id}`;
        }, 500);
        
      } catch (apiError) {
        console.error('API error:', apiError);
        throw apiError;
      }

    } catch (e: any) {
      console.error('Consultation submission error:', e);
      error = e.responseText 
        ? `Error: ${e.message}. Server response: ${e.responseText.substring(0, 100)}...`
        : e.message || 'An unexpected error occurred';
      loading = false;
    }
  }
  
  function cancelConsultation() {
    show = false;
  }
  
  function goBack() {
    flowStep = flowStep - 1;
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" transition:fade>
    <div class="bg-white/10 backdrop-blur-md rounded-xl max-w-lg w-full p-6 shadow-xl border border-white/20 max-h-[90vh] flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-white">
          {#if flowStep === 1}
            Book Consultation with Dr. {doctorName}
          {:else if flowStep === 2}
            Consultation Details
          {:else}
            Add Initial Message (Optional)
          {/if}
        </h2>
        <button 
          class="text-gray-400 hover:text-white transition-colors"
          on:click={cancelConsultation}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {#if !isAuthenticated}
        <div class="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p class="text-red-200 text-sm">
            <span class="font-semibold">Authentication Required:</span>
            Please <a href="/login" class="text-blue-300 underline">log in</a> to book a consultation.
          </p>
        </div>
      {:else if error}
        <div class="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p class="text-red-200 text-sm">
            <span class="font-semibold">Error:</span> {error}
          </p>
        </div>
      {/if}

      {#if isAuthenticated}
        <!-- Scrollable content area -->
        <div class="overflow-y-auto flex-grow pr-1 consultation-scroll-container">
          <!-- Consultation Booking Form -->
          <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            {#if flowStep === 1}
              <!-- Step 1: Consultation Confirmation -->
              <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                <div class="flex justify-between items-center">
                  <span class="text-gray-300">Consultation Fee</span>
                  <span class="text-white font-semibold">${consultationFee}</span>
                </div>
              </div>
              
              <!-- How it works section -->
              <div class="space-y-3 bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <h3 class="font-medium text-blue-300">How It Works - Book → Chat → Pay</h3>
                <ol class="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                  <li>Book a consultation with Dr. {doctorName} now</li>
                  <li>Start chatting immediately</li>
                  <li>Pay for the consultation during or after your chat</li>
                </ol>
                <p class="text-xs text-gray-400">
                  We use a delayed payment system to ensure you only pay after you've received value from the consultation.
                </p>
              </div>
            {:else if flowStep === 2}
              <!-- Step 2: Consultation Details -->
              <div>
                <label for="requestDetails" class="block text-sm font-medium text-gray-300 mb-1">
                  Reason for Consultation
                </label>
                <textarea
                  id="requestDetails"
                  bind:value={requestDetails}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white h-24 resize-none"
                  placeholder="Briefly describe why you're seeking this consultation..."
                  required
                ></textarea>
              </div>
              
              <div>
                <label for="symptoms" class="block text-sm font-medium text-gray-300 mb-1">
                  Symptoms (if any)
                </label>
                <textarea
                  id="symptoms"
                  bind:value={symptoms}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white h-24 resize-none"
                  placeholder="Describe any symptoms you're experiencing..."
                ></textarea>
                <p class="mt-1 text-xs text-gray-400">
                  Providing this information helps the doctor prepare for your consultation.
                </p>
              </div>
              
              <!-- Visible fields for additional consultation details -->
              <div>
                <label for="diagnosis" class="block text-sm font-medium text-gray-300 mb-1">
                  Diagnosis (Optional)
                </label>
                <textarea
                  id="diagnosis"
                  bind:value={diagnosis}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white h-20 resize-none"
                  placeholder="Leave blank - will be filled by doctor"
                ></textarea>
              </div>
              
              <div>
                <label for="prescription" class="block text-sm font-medium text-gray-300 mb-1">
                  Prescription (Optional)
                </label>
                <textarea
                  id="prescription"
                  bind:value={prescription}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white h-20 resize-none"
                  placeholder="Leave blank - will be filled by doctor"
                ></textarea>
              </div>
              
              <div>
                <label for="notes" class="block text-sm font-medium text-gray-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  bind:value={notes}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white h-20 resize-none"
                  placeholder="Any additional information you'd like to share"
                ></textarea>
              </div>
              
              <div>
                <label for="followUpDate" class="block text-sm font-medium text-gray-300 mb-1">
                  Follow-up Date (Optional)
                </label>
                <input
                  id="followUpDate"
                  type="date"
                  bind:value={followUpDate}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
            {:else}
              <!-- Step 3: Initial Message -->
              <div>
                <label for="initialMessage" class="block text-sm font-medium text-gray-300 mb-1">
                  Initial Message to Doctor (Optional)
                </label>
                <textarea
                  id="initialMessage"
                  bind:value={initialMessage}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white h-32 resize-none"
                  placeholder="Type a message to start the conversation..."
                ></textarea>
                <p class="mt-1 text-xs text-gray-400">
                  This will be sent as your first message when the chat begins. You can also leave this empty and type your message later.
                </p>
              </div>
            {/if}
          </form>
        </div>

        <!-- Fixed footer with buttons -->
        <div class="flex justify-end space-x-3 pt-4 mt-4 border-t border-white/10">
          {#if flowStep > 1}
            <button
              type="button"
              class="px-4 py-2 rounded-lg font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-all duration-200"
              on:click={goBack}
              disabled={loading}
            >
              Back
            </button>
          {/if}
          <button
            type="button"
            class="px-4 py-2 rounded-lg font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-all duration-200"
            on:click={cancelConsultation}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg font-medium text-white bg-blue-600/90 hover:bg-blue-700/90 
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              focus:ring-2 focus:ring-blue-500/30"
            on:click={handleSubmit}
            disabled={loading}
          >
            {#if loading}
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            {:else if flowStep < 3}
              Continue
            {:else}
              Book Consultation
            {/if}
          </button>
        </div>
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

  /* Custom scrollbar for form container */
  .consultation-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  .consultation-scroll-container::-webkit-scrollbar {
    width: 6px;
  }

  .consultation-scroll-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .consultation-scroll-container::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  /* Reduce height of text areas */
  textarea {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  /* ...existing scrollbar styles... */
</style>
