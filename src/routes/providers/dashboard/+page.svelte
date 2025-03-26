<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { formatDate } from '$lib/utils/date';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/authStore';

  interface Patient {
    user_id: number;
    name: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    address: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
  }

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }

  interface HomeCareVisit {
    id: number;
    patient_id: number;
    provider_id: number;
    address: string;
    latitude: number;
    longitude: number;
    duration_hours: number;
    special_requirements: string;
    status: string;
    patient?: Patient;
  }

  let visits: HomeCareVisit[] = [];
  let loading = true;
  let error: string | null = null;
  let activeTab: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  async function loadVisits() {
    try {
      const token = localStorage.getItem('token');
      const providerId = $authStore.user?.id;

      if (!token || !providerId) {
        throw new Error('Authentication required');
      }

      // Get visits
      const response = await fetch(`http://localhost:8888/api/home-care-visits?provider_id=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load visits: ${response.statusText}`);
      }

      const visitsData = await response.json();
      console.log('Raw visits data:', visitsData);

      // Fetch patient details for each visit using the patients endpoint
      const visitsWithPatients = await Promise.all(visitsData.map(async (visit: HomeCareVisit) => {
        const patientResponse = await fetch(`http://localhost:8888/api/patients/${visit.patient_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          return {
            ...visit,
            patient: patientData
          };
        }
        console.warn(`Failed to fetch patient data for ID: ${visit.patient_id}`);
        return visit;
      }));

      visits = visitsWithPatients;
      console.log('Visits with patient details:', visits);
      
      error = null;

    } catch (err) {
      console.error('Error in loadVisits:', err);
      error = err instanceof Error ? err.message : 'Failed to load visits';
      visits = [];
    } finally {
      loading = false;
    }
  }

  async function handleStatusUpdate(visitId: number, newStatus: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`http://localhost:8888/api/home-care-visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update visit');
      }

      // Reload visits after successful update
      await loadVisits();

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update visit';
      console.error('Update error:', err);
    }
  }

  onMount(() => {
    if (!$authStore.isAuthenticated || !$authStore.user?.id) {
      console.log('Auth state:', {
        isAuthenticated: $authStore.isAuthenticated,
        user: $authStore.user
      });
      window.location.href = '/login?redirect=/providers/dashboard';
      return;
    }

    loadVisits();
  });

  $: filteredVisits = visits.filter(visit => {
    switch (activeTab) {
      case 'upcoming':
        return visit.status === 'scheduled';
      case 'completed':
        return visit.status === 'completed';
      case 'cancelled':
        return visit.status === 'cancelled';
      default:
        return true;
    }
  });
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="glass-card p-6 mb-8">
      <h1 class="text-3xl font-bold text-white mb-6">Provider Dashboard</h1>
      
      <!-- Tabs -->
      <div class="flex space-x-4 mb-6">
        {#each ['upcoming', 'completed', 'cancelled'] as tab}
          <button
            class={`px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === tab 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-400 hover:bg-white/10'
            }`}
            on:click={() => activeTab = tab}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        {/each}
      </div>

      {#if loading}
        <div class="flex flex-col items-center justify-center py-12">
          <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p class="text-white">Loading your visits...</p>
        </div>
      {:else if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-6 p-4">
          <p>{error}</p>
          <button 
            class="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded"
            on:click={loadVisits}
          >
            Try Again
          </button>
        </div>
      {:else if filteredVisits.length === 0}
        <div class="text-center py-12 text-gray-400">
          No {activeTab} visits found
        </div>
      {:else}
        <div class="grid gap-6">
          {#each filteredVisits as visit (visit.id)}
            <div class="glass-card p-6" transition:fade>
              <div class="flex items-start justify-between">
                <div class="space-y-3">
                  <!-- Patient Information -->
                  <div class="border-b border-white/10 pb-3">
                    <h3 class="text-xl font-semibold text-white mb-2">
                      Patient Information
                    </h3>
                    <div class="grid grid-cols-2 gap-4 text-gray-300">
                      <div>
                        <p class="font-medium">Name:</p>
                        <p>{visit.patient?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p class="font-medium">Gender:</p>
                        <p class="capitalize">{visit.patient?.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p class="font-medium">Phone:</p>
                        <p>{visit.patient?.phone || 'N/A'}</p>
                      </div>
                      <!-- <div>
                        <p class="font-medium">Address:</p>
                        <p>{visit.patient?.address || 'N/A'}</p>
                      </div> -->
                    </div>
                  </div>

                  <!-- Visit Information -->
                  <div>
                    <h4 class="text-lg font-medium text-white mb-2">Visit Details</h4>
                    <div class="space-y-2 text-gray-300">
                      <p>
                        <span class="font-medium">Address:</span> {visit.address}
                      </p>
                      <p>
                        <span class="font-medium">Duration:</span> {visit.duration_hours} hours
                      </p>
                      {#if visit.special_requirements}
                        <p>
                          <span class="font-medium">Special Requirements:</span>
                          <span class="text-yellow-300">{visit.special_requirements}</span>
                        </p>
                      {/if}
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col space-y-2">
                  {#if visit.status === 'scheduled'}
                    <button
                      class="glass-button-success"
                      on:click={() => handleStatusUpdate(visit.id, 'completed')}
                    >
                      Mark Complete
                    </button>
                    <button
                      class="glass-button-danger"
                      on:click={() => handleStatusUpdate(visit.id, 'cancelled')}
                    >
                      Cancel
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .glass-card {
    @apply overflow-hidden rounded-xl;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  .glass-button-success {
    @apply px-4 py-2 rounded-lg font-semibold text-white;
    background: rgba(34, 197, 94, 0.5);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(34, 197, 94, 0.3);
    transition: all 0.2s ease-in-out;
  }

  .glass-button-success:hover {
    background: rgba(34, 197, 94, 0.7);
    transform: translateY(-1px);
  }

  .glass-button-danger {
    @apply px-4 py-2 rounded-lg font-semibold text-white;
    background: rgba(239, 68, 68, 0.5);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(239, 68, 68, 0.3);
    transition: all 0.2s ease-in-out;
  }

  .glass-button-danger:hover {
    background: rgba(239, 68, 68, 0.7);
    transform: translateY(-1px);
  }

  .glass-panel {
    @apply p-4 rounded-lg;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid;
  }
</style>
