<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fade, fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { BACKEND_URL } from '$lib/constants';
  import ConsultationChat from '$lib/chat/ConsultationChat.svelte';
  import Icon from '@iconify/svelte';
  import { t } from '$lib/i18n';
  
  interface ConsultationDetails {
    id: number;
    consultation_id: number;
    request_details: string;
    symptoms: string;
    diagnosis: string;
    prescription: string;
    notes: string;
    follow_up_date?: string;
    created_at: string;
    updated_at: string;
  }
  
  let consultation = null;
  let doctor = null;
  let patient = null;
  let loading = true;
  let error = '';
  let user = null;
  let userRole = null;
  let showPaymentModal = false;
  let processingPayment = false;
  let paymentError = '';
  
  // New variables for consultation details
  let consultationDetails: ConsultationDetails | null = null;
  let loadingDetails = false;
  let detailsError = '';
  let showDetailsForm = false;
  let editingDetails = false;
  
  // Form fields for consultation details
  let requestDetails = '';
  let symptoms = '';
  let diagnosis = '';
  let prescription = '';
  let notes = '';
  let followUpDate = '';
  
  export let params;
  let consultationId = +params.id;

  async function startConsultation() {
    await fetch(`${BACKEND_URL}/api/consultations/${consultationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'in_progress' })
    });
    // ...handle response...
  }

  async function completeConsultation() {
    await fetch(`${BACKEND_URL}/api/consultations/${consultationId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
      // no body needed if your handler sets completed status automatically
    });
    // ...handle response...
  }

  onMount(async () => {
    try {
      // Validate consultation ID is not zero or invalid
      const consultationId = $page.params.id;
      if (!consultationId || consultationId === '0' || isNaN(Number(consultationId))) {
        throw new Error('Invalid consultation ID');
      }
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        goto('/login');
        return;
      }
      
      user = JSON.parse(userData);
      userRole = user.role;
      
      const token = localStorage.getItem('token');
      if (!token) {
        goto('/login');
        return;
      }
      
      console.log(`Fetching consultation with ID: ${consultationId}`);
      console.log(`API URL: ${BACKEND_URL}/api/consultations/${consultationId}`);
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/consultations/${consultationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}. Response: ${responseText}`);
        }
        
        try {
          // Parse the JSON response after logging the raw text
          consultation = JSON.parse(responseText);
          console.log('Parsed consultation:', consultation);
          
          // Validate consultation object
          if (!consultation || !consultation.id) {
            throw new Error('Invalid consultation data received');
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Failed to parse consultation data');
        }
      
      } catch (fetchError) {
        console.error('API fetch error:', fetchError);
        throw new Error(`Failed to load consultation details: ${fetchError.message}`);
      }
      
      // Fetch doctor information
      const doctorResponse = await fetch(`${BACKEND_URL}/api/doctors/${consultation.doctor_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (doctorResponse.ok) {
        doctor = await doctorResponse.json();
      }
      
      // Fetch patient information if user is a doctor
      if (userRole === 'doctor') {
        const patientResponse = await fetch(`${BACKEND_URL}/api/patients/${consultation.patient_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (patientResponse.ok) {
          patient = await patientResponse.json();
        }
      }
      
      // Check if the user has permission to view this consultation
      if (
        (userRole === 'patient' && user.id !== consultation.patient_id) ||
        (userRole === 'doctor' && user.id !== consultation.doctor_id)
      ) {
        throw new Error('You do not have permission to view this consultation');
      }
      
      // Fetch consultation details
      await fetchConsultationDetails(consultationId);
      
    } catch (e) {
      console.error('Error:', e);
      error = e.message || 'An unexpected error occurred';
    } finally {
      loading = false;
    }
  });
  
  async function fetchConsultationDetails(consultationId) {
    try {
      loadingDetails = true;
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log(`Fetching consultation details for consultation ID: ${consultationId}`);
      console.log(`API URL: ${BACKEND_URL}/api/consultations/${consultationId}/details`);
      
      const response = await fetch(`${BACKEND_URL}/api/consultations/${consultationId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // If details don't exist yet (404), that's okay - just means none have been created
      if (response.status === 404) {
        console.log('No consultation details found - none have been created yet');
        consultationDetails = null;
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch consultation details: ${response.statusText}`);
      }
      
      consultationDetails = await response.json();
      console.log('Fetched consultation details:', consultationDetails);
      
      // Populate form fields if details exist and we're editing
      if (consultationDetails) {
        requestDetails = consultationDetails.request_details || '';
        symptoms = consultationDetails.symptoms || '';
        diagnosis = consultationDetails.diagnosis || '';
        prescription = consultationDetails.prescription || '';
        notes = consultationDetails.notes || '';
        followUpDate = consultationDetails.follow_up_date ? 
          new Date(consultationDetails.follow_up_date).toISOString().split('T')[0] : '';
      }
      
    } catch (e) {
      console.error('Error fetching consultation details:', e);
      detailsError = e instanceof Error ? e.message : 'Failed to load consultation details';
    } finally {
      loadingDetails = false;
    }
  }
  
  async function saveConsultationDetails() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const consultationId = $page.params.id;
      const detailsData = {
        consultation_id: Number(consultationId),
        request_details: requestDetails,
        symptoms: symptoms,
        diagnosis,
        prescription,
        notes
        // Note: follow_up_date isn't in the DB schema but we might keep it for frontend use
        // The backend should ignore fields it doesn't use
      };
      
      let url, method;
      
      if (consultationDetails) {
        // Update existing details
        url = `${BACKEND_URL}/api/consultation-details/${consultationDetails.id}`;
        method = 'PUT';
      } else {
        // Create new details
        url = `${BACKEND_URL}/api/consultations/${consultationId}/details`;
        method = 'POST';
      }
      
      console.log(`${method} consultation details to ${url}`);
      console.log('Details payload:', detailsData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(detailsData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${consultationDetails ? 'update' : 'create'} consultation details: ${errorText}`);
      }
      
      // Refresh consultation details
      await fetchConsultationDetails(consultationId);
      
      // Close form
      showDetailsForm = false;
      editingDetails = false;
      
    } catch (e) {
      console.error('Error saving consultation details:', e);
      detailsError = e instanceof Error ? e.message : 'Failed to save consultation details';
    }
  }
  
  function startEditDetails() {
    if (consultationDetails) {
      requestDetails = consultationDetails.request_details || '';
      symptoms = consultationDetails.symptoms || '';
      diagnosis = consultationDetails.diagnosis || '';
      prescription = consultationDetails.prescription || '';
      notes = consultationDetails.notes || '';
      followUpDate = consultationDetails.follow_up_date ? 
        new Date(consultationDetails.follow_up_date).toISOString().split('T')[0] : '';
    } else {
      requestDetails = '';
      symptoms = '';
      diagnosis = '';
      prescription = '';
      notes = '';
      followUpDate = '';
    }
    
    editingDetails = true;
    showDetailsForm = true;
  }
  
  function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }
  
  async function makePayment() {
    processingPayment = true;
    paymentError = '';
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Create payment
      const paymentPayload = {
        amount: Number(consultation.fee),
        status: 'completed',
        payment_date: new Date().toISOString(),
        consultation_id: consultation.id
      };
      
      const paymentResponse = await fetch(`${BACKEND_URL}/api/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentPayload)
      });
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Payment processing failed');
      }
      
      // Update consultation payment status
      const updateResponse = await fetch(`${BACKEND_URL}/api/consultations/${consultation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_paid: true
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update consultation payment status');
      }
      
      // Update the consultation in our state
      consultation.is_paid = true;
      
      // Close payment modal
      showPaymentModal = false;
      
    } catch (e) {
      paymentError = e instanceof Error ? e.message : 'Failed to process payment';
      console.error('Payment error:', e);
    } finally {
      processingPayment = false;
    }
  }
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    {#if loading}
      <div class="flex justify-center items-center h-64" in:fade>
        <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <span class="ml-3 text-white">Loading consultation details...</span>
      </div>
    {:else if error}
      <div class="glass-card p-6 text-center" in:fade>
        <Icon icon="mdi:alert-circle" class="text-6xl text-red-400 mb-4" />
        <h2 class="text-xl font-semibold text-white mb-2">Error</h2>
        <p class="text-gray-300 mb-6">{error}</p>
        <a href="/dashboard" class="glass-button">
          Return to Dashboard
        </a>
      </div>
    {:else if consultation}
      <!-- Payment reminder banner for unpaid consultations (for patients only) -->
      {#if userRole === 'patient' && !consultation.is_paid}
        <div class="glass-card p-4 mb-8 bg-yellow-500/10 border-yellow-500/30" in:fade>
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <Icon icon="mdi:cash-clock" class="text-yellow-300 text-2xl mr-3" />
              <div>
                <h3 class="text-white font-medium">Payment Required</h3>
                <p class="text-yellow-200/80 text-sm">
                  Please complete the payment for this consultation. The fee is ${consultation.fee.toFixed(2)}.
                </p>
              </div>
            </div>
            <button 
              class="glass-button-primary"
              on:click={() => showPaymentModal = true}
            >
              Pay Now
            </button>
          </div>
        </div>
      {/if}

      <div class="glass-card p-6 mb-8" in:fade>
        <div class="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">
              Consultation #{consultation.id}
            </h1>
            <div class="flex items-center gap-2 mb-4">
              <span class="px-3 py-1 rounded-full text-sm border {getStatusBadgeClass(consultation.status)}">
                {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
              </span>
              <span class="text-gray-400">
                Started: {formatDateTime(consultation.started_at)}
              </span>
              {#if consultation.completed_at}
                <span class="text-gray-400">
                  Completed: {formatDateTime(consultation.completed_at)}
                </span>
              {/if}
            </div>
          </div>
          
          <div class="text-right">
            <div class="text-2xl font-bold text-white">
              ${consultation.fee.toFixed(2)}
            </div>
            <div class="text-blue-300 text-sm">
              Consultation Fee
            </div>
          </div>
        </div>
        
        <!-- Participant Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {#if doctor}
            <div class="glass-panel">
              <h2 class="text-lg font-semibold text-white mb-4">Doctor</h2>
              <div class="flex items-center">
                <img 
                  src={doctor.profile_picture_url || '/images/default-avatar.png'} 
                  alt={doctor.name}
                  class="w-12 h-12 rounded-full object-cover"
                  on:error={e => e.target.src = '/images/default-avatar.png'}
                />
                <div class="ml-4">
                  <div class="text-white font-medium">Dr. {doctor.name}</div>
                  <div class="text-gray-400 text-sm">{doctor.specialty}</div>
                </div>
              </div>
            </div>
          {/if}
          
          {#if patient && userRole === 'doctor'}
            <div class="glass-panel">
              <h2 class="text-lg font-semibold text-white mb-4">Patient</h2>
              <div class="flex items-center">
                <img 
                  src={patient.profile_picture_url || '/images/default-avatar.png'} 
                  alt={patient.name}
                  class="w-12 h-12 rounded-full object-cover"
                  on:error={e => e.target.src = '/images/default-avatar.png'}
                />
                <div class="ml-4">
                  <div class="text-white font-medium">{patient.name}</div>
                  <div class="text-gray-400 text-sm">{patient.email}</div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Consultation Details Section (if consultation is completed or if doctor views active consultation) -->
      {#if consultationDetails || (userRole === 'doctor' && (consultation.status === 'active' || consultation.status === 'completed'))}
        <div class="glass-card p-6 mb-8" in:fade>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold text-white">{$t('consultationPage.details.title', 'Consultation Details')}</h2>
            {#if userRole === 'doctor' && !showDetailsForm}
              <button 
                class="glass-button-primary"
                on:click={startEditDetails}
              >
                {consultationDetails ? $t('common.edit', 'Edit') : $t('common.add', 'Add')} {$t('consultationPage.details.title', 'Details')}
              </button>
            {/if}
          </div>
          
          {#if detailsError}
            <div class="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-4">
              <p class="text-red-200 text-sm">{detailsError}</p>
            </div>
          {/if}
          
          {#if showDetailsForm && userRole === 'doctor'}
            <!-- Consultation Details Form -->
            <form on:submit|preventDefault={saveConsultationDetails} class="space-y-4">
              <div>
                <label for="requestDetails" class="block text-sm font-medium text-gray-300 mb-2">
                  {$t('consultationPage.details.requestDetails', 'Request Details')}
                </label>
                <textarea
                  id="requestDetails"
                  bind:value={requestDetails}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white h-24"
                  placeholder={$t('consultationPage.details.requestDetailsPlaceholder', 'Enter request details')}
                ></textarea>
              </div>
              
              <div>
                <label for="symptoms" class="block text-sm font-medium text-gray-300 mb-2">
                  {$t('consultationPage.details.symptoms', 'Symptoms')}
                </label>
                <textarea
                  id="symptoms"
                  bind:value={symptoms}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white h-24"
                  placeholder={$t('consultationPage.details.symptomsPlaceholder', 'Enter patient symptoms')}
                ></textarea>
              </div>
              
              <div>
                <label for="diagnosis" class="block text-sm font-medium text-gray-300 mb-2">
                  {$t('consultationPage.details.diagnosis', 'Diagnosis')}
                </label>
                <textarea
                  id="diagnosis"
                  bind:value={diagnosis}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white h-24"
                  placeholder={$t('consultationPage.details.diagnosisPlaceholder', 'Enter your diagnosis')}
                ></textarea>
              </div>
              
              <div>
                <label for="prescription" class="block text-sm font-medium text-gray-300 mb-2">
                  {$t('consultationPage.details.prescription', 'Prescription')}
                </label>
                <textarea
                  id="prescription"
                  bind:value={prescription}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white h-24"
                  placeholder={$t('consultationPage.details.prescriptionPlaceholder', 'Enter prescription details')}
                ></textarea>
              </div>
              
              <div>
                <label for="notes" class="block text-sm font-medium text-gray-300 mb-2">
                  {$t('consultationPage.details.notes', 'Notes')}
                </label>
                <textarea
                  id="notes"
                  bind:value={notes}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white h-24"
                  placeholder={$t('consultationPage.details.notesPlaceholder', 'Additional notes')}
                ></textarea>
              </div>
              
              <div>
                <label for="followUpDate" class="block text-sm font-medium text-gray-300 mb-2">
                  {$t('consultationPage.details.followUpDate', 'Follow-up Date')}
                </label>
                <input
                  id="followUpDate"
                  type="date"
                  bind:value={followUpDate}
                  class="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  class="glass-button"
                  on:click={() => {
                    showDetailsForm = false;
                    editingDetails = false;
                  }}
                >
                  {$t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  class="glass-button-primary"
                >
                  {$t('common.save', 'Save')}
                </button>
              </div>
            </form>
          {:else if consultationDetails}
            <!-- Display Consultation Details -->
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium text-white mb-2">{$t('consultationPage.details.requestDetails', 'Request Details')}</h3>
                <p class="text-gray-300 bg-white/5 p-4 rounded-lg border border-white/10">
                  {consultationDetails.request_details || $t('consultationPage.details.noRequestDetails', 'No request details provided')}
                </p>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-white mb-2">{$t('consultationPage.details.symptoms', 'Symptoms')}</h3>
                <p class="text-gray-300 bg-white/5 p-4 rounded-lg border border-white/10">
                  {consultationDetails.symptoms || $t('consultationPage.details.noSymptoms', 'No symptoms provided')}
                </p>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-white mb-2">{$t('consultationPage.details.diagnosis', 'Diagnosis')}</h3>
                <p class="text-gray-300 bg-white/5 p-4 rounded-lg border border-white/10">
                  {consultationDetails.diagnosis || $t('consultationPage.details.noDiagnosis', 'No diagnosis provided')}
                </p>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-white mb-2">{$t('consultationPage.details.prescription', 'Prescription')}</h3>
                <p class="text-gray-300 bg-white/5 p-4 rounded-lg border border-white/10">
                  {consultationDetails.prescription || $t('consultationPage.details.noPrescription', 'No prescription provided')}
                </p>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-white mb-2">{$t('consultationPage.details.notes', 'Notes')}</h3>
                <p class="text-gray-300 bg-white/5 p-4 rounded-lg border border-white/10">
                  {consultationDetails.notes || $t('consultationPage.details.noNotes', 'No additional notes')}
                </p>
              </div>
              
              {#if consultationDetails.follow_up_date}
                <div>
                  <h3 class="text-lg font-medium text-white mb-2">{$t('consultationPage.details.followUpDate', 'Follow-up Date')}</h3>
                  <p class="text-gray-300 bg-white/5 p-4 rounded-lg border border-white/10">
                    {formatDateTime(consultationDetails.follow_up_date)}
                  </p>
                </div>
              {/if}
              
              <div class="text-right text-gray-400 text-sm">
                {$t('consultationPage.details.lastUpdated', 'Last updated')}: {formatDateTime(consultationDetails.updated_at)}
              </div>
            </div>
          {:else if userRole === 'doctor'}
            <!-- No details yet, prompt for doctor to add them -->
            <div class="text-center py-8">
              <p class="text-gray-400 mb-4">{$t('consultationPage.details.noDetailsYet', 'No consultation details have been added yet.')}</p>
              <button 
                class="glass-button-primary"
                on:click={startEditDetails}
              >
                {$t('consultationPage.details.addDetails', 'Add Consultation Details')}
              </button>
            </div>
          {:else}
            <!-- Patient view when no details exist -->
            <div class="text-center py-8">
              <p class="text-gray-400">{$t('consultationPage.details.noDetailsYetPatient', 'The doctor has not provided any consultation details yet.')}</p>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Chat Section -->
      <div class="glass-card h-[600px] overflow-hidden flex flex-col" in:fade>
        <ConsultationChat
          consultationId={consultation.id}
          userId={user.id}
          userRole={userRole === 'doctor' ? 'doctor' : 'patient'}
          isPaid={consultation.is_paid}
        />
      </div>
      
      <!-- Action Buttons -->
      {#if consultation.status === 'active' || consultation.status === 'pending'}
        <div class="flex justify-end mt-6 gap-4">
          {#if userRole === 'doctor'}
            <button 
              class="glass-button-success"
              on:click={async () => {
                try {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    throw new Error('Authentication required');
                  }
                  
                  const response = await fetch(`${BACKEND_URL}/api/consultations/${consultation.id}/complete`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to complete consultation');
                  }
                  
                  // Refresh page to show updated status
                  window.location.reload();
                } catch (e) {
                  error = e instanceof Error ? e.message : 'Failed to complete consultation';
                }
              }}
            >
              Complete Consultation
            </button>
          {/if}
          
          {#if userRole === 'patient' && !consultation.is_paid}
            <button 
              class="glass-button-primary"
              on:click={() => showPaymentModal = true}
            >
              Pay for Consultation
            </button>
          {/if}
          
          <button 
            class="glass-button-danger"
            on:click={async () => {
              try {
                const token = localStorage.getItem('token');
                if (!token) {
                  throw new Error('Authentication required');
                }
                
                const response = await fetch(`${BACKEND_URL}/api/consultations/${consultation.id}/cancel`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (!response.ok) {
                  throw new Error('Failed to cancel consultation');
                }
                
                // Redirect to dashboard after cancellation
                window.location.href = userRole === 'doctor' ? '/doctors/dashboard' : '/dashboard';
              } catch (e) {
                error = e instanceof Error ? e.message : 'Failed to cancel consultation';
              }
            }}
          >
            Cancel Consultation
          </button>
        </div>
      {/if}
      
      <!-- Payment Modal -->
      {#if showPaymentModal}
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" transition:fade>
          <div class="glass-card max-w-md w-full relative" in:fly={{ y: 20, duration: 300 }}>
            <button
              class="absolute top-4 right-4 text-gray-400 hover:text-white"
              on:click={() => showPaymentModal = false}
              disabled={processingPayment}
            >
              <Icon icon="mdi:close" class="text-xl" />
            </button>

            <h2 class="text-xl font-bold text-white mb-4">Make Payment</h2>
            
            <p class="text-gray-300 mb-6">
              Complete your payment for consultation with Dr. {doctor?.name}
            </p>
            
            {#if paymentError}
              <div class="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
                {paymentError}
              </div>
            {/if}

            <div class="space-y-4">
              <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                <div class="flex justify-between items-center">
                  <span class="text-gray-300">Consultation Fee</span>
                  <span class="text-white font-semibold">${consultation.fee.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <div class="grid grid-cols-2 gap-3 mt-2">
                  <div class="bg-white/10 p-3 rounded-lg flex items-center border border-white/20 cursor-pointer hover:bg-white/15">
                    <Icon icon="logos:visa" class="mr-2" />
                    <span class="text-white">Credit Card</span>
                  </div>
                  <div class="bg-white/10 p-3 rounded-lg flex items-center border border-white/20 cursor-pointer hover:bg-white/15">
                    <Icon icon="logos:paypal" class="mr-2" />
                    <span class="text-white">PayPal</span>
                  </div>
                </div>
              </div>

              <button
                class="w-full glass-button-primary py-3 mt-4"
                on:click={makePayment}
                disabled={processingPayment}
              >
                {#if processingPayment}
                  <span class="flex items-center justify-center">
                    <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </span>
                {:else}
                  Pay ${consultation.fee.toFixed(2)}
                {/if}
              </button>
              
              <p class="text-gray-400 text-xs text-center mt-4">
                Your payment information is secure and encrypted.
              </p>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<button on:click={startConsultation}>Start Consultation</button>
<button on:click={completeConsultation}>Complete Consultation</button>

<style>
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .glass-button {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .glass-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .glass-button-success {
    background: rgba(34, 197, 94, 0.3);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .glass-button-success:hover {
    background: rgba(34, 197, 94, 0.4);
  }

  .glass-button-danger {
    background: rgba(239, 68, 68, 0.3);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .glass-button-danger:hover {
    background: rgba(239, 68, 68, 0.4);
  }
</style>
