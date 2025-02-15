<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { authStore } from '$lib/stores/authStore';
  import { apiRequest } from '$lib/utils/api';
  import { API_CONFIG } from '$lib/config/api';
  import type { User } from '$lib/types';
  import type { HomeCareVisit } from '$lib/types/homeCareVisit';

  export let providerId: number;
  export let show = false;

  const dispatch = createEventDispatcher();

  let formData = {
    address: '',
    latitude: 0,
    longitude: 0,
    durationHours: 1,
    specialRequirements: '',
    visitDate: '',
    visitTime: ''
  };

  async function getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      throw new Error('Could not find coordinates for this address');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to get location coordinates');
    }
  }

  async function checkLocationPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted';
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  async function getCurrentLocation(): Promise<void> {
    try {
      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        const userResponse = confirm(
          'This app needs your location to provide accurate service. Would you like to:\n\n' +
          '1. Enable location services in your browser\n' +
          '2. Enter your address manually\n\n' +
          'Click OK to enable location or Cancel to enter manually.'
        );
        
        if (!userResponse) {
          return;
        }
      }

      const position: GeolocationPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Unable to get your location. ';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Please enable location services in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage += 'Request timed out. Please try again.';
                break;
              default:
                errorMessage += 'Please enter your address manually.';
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
      
      formData.latitude = position.coords.latitude;
      formData.longitude = position.coords.longitude;

      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        formData.address = data.display_name;
      }
    } catch (error) {
      error = error instanceof Error ? error.message : 'Location services are not available';
      console.error('Location error:', error);
    }
  }

  async function handleAddressChange() {
    if (formData.address.trim()) {
      try {
        const coords = await getCoordinatesFromAddress(formData.address);
        formData.latitude = coords.lat;
        formData.longitude = coords.lng;
      } catch (error) {
        console.error('Error getting coordinates:', error);
      }
    }
  }

  let loading = false;
  let error: string | null = null;
  let currentUser: User | null = null;

  // Subscribe to authStore to get the current user
  authStore.subscribe(state => {
    currentUser = state.user as User | null;
  });

  function closeModal() {
    formData = {
      address: '',
      latitude: 0,
      longitude: 0,
      durationHours: 1,
      specialRequirements: '',
      visitDate: '',
      visitTime: ''
    };
    error = null;
    dispatch('close');
  }

  async function handleSubmit() {
    loading = true;
    error = null;

    try {
      if (!currentUser) {
        throw new Error('Please login to schedule a visit');
      }

      // Validate inputs
      if (!formData.address.trim()) {
        throw new Error('Address is required');
      }

      // Get coordinates if not already set
      if (!formData.latitude || !formData.longitude) {
        const coords = await getCoordinatesFromAddress(formData.address);
        formData.latitude = coords.lat;
        formData.longitude = coords.lng;
      }

      const payload: HomeCareVisit = {
        patient_id: currentUser.id,
        provider_id: providerId,
        address: formData.address.trim(),
        latitude: Number(formData.latitude.toFixed(8)),
        longitude: Number(formData.longitude.toFixed(8)),
        duration_hours: Number(formData.durationHours.toFixed(2)),
        special_requirements: formData.specialRequirements.trim(),
        status: 'scheduled'
      };

      console.log('Submitting home care visit:', payload);

      const data = await apiRequest<HomeCareVisit>(API_CONFIG.endpoints.homeCareVisits, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log('Home care visit created:', data);
      dispatch('success', data);
      closeModal();
    } catch (err: any) {
      error = err instanceof Error ? err.message : 'Failed to schedule visit';
      console.error('Scheduling error:', err);
    } finally {
      loading = false;
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 overflow-y-auto" transition:fade>
    <div class="flex min-h-screen items-center justify-center px-4">
      <button type="button" class="fixed inset-0 bg-black/50 backdrop-blur-sm" on:click={closeModal} on:keydown={e => e.key === 'Escape' && closeModal()} aria-label="Close modal"></button>
      <div class="glass-card w-full max-w-md p-6 relative z-10">
        <h2 class="text-2xl font-bold text-white mb-6">Schedule Home Care Visit</h2>
        {#if error}
          <div class="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        {/if}
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-gray-300 mb-1" for="address">Address *</label>
            <div class="relative">
              <input
                type="text"
                id="address"
                bind:value={formData.address}
                on:change={handleAddressChange}
                required
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white pr-24"
                placeholder="Enter your full address"
              />
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-2">
                <button
                  type="button"
                  class="text-gray-400 hover:text-white px-2 py-1 rounded"
                  on:click={() => {
                    getCurrentLocation().catch(err => {
                      error = err.message;
                    });
                  }}
                  title="Use current location"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="text-gray-400 hover:text-white px-2 py-1 rounded text-xs"
                  on:click={() => {
                    window.open('https://www.openstreetmap.org/search', '_blank');
                  }}
                  title="Open map"
                >
                  Map
                </button>
              </div>
            </div>
            {#if formData.latitude && formData.longitude}
              <p class="text-xs text-gray-400 mt-1">
                Location: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            {/if}
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-300 mb-1" for="visitDate">Date *</label>
              <input type="date" id="visitDate" bind:value={formData.visitDate} required min={new Date().toISOString().split('T')[0]} class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label class="block text-gray-300 mb-1" for="visitTime">Time *</label>
              <input type="time" id="visitTime" bind:value={formData.visitTime} required class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
          <div>
            <label class="block text-gray-300 mb-1" for="duration">Duration (hours) *</label>
            <input type="number" id="duration" bind:value={formData.durationHours} min="0.5" max="12" step="0.5" required class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" />
          </div>
          <div>
            <label class="block text-gray-300 mb-1" for="requirements">Special Requirements</label>
            <textarea id="requirements" bind:value={formData.specialRequirements} rows="3" class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white" placeholder="Any special requirements or notes for the care provider..."></textarea>
          </div>
          <div class="flex justify-end space-x-4 mt-6">
            <button type="button" class="glass-button" on:click={closeModal} disabled={loading}>Cancel</button>
            <button type="submit" class="glass-button-primary" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule Visit'}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .glass-card {
    @apply overflow-hidden rounded-xl;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }
  .glass-button-primary {
    @apply px-6 py-3 rounded-lg font-semibold text-white text-center;
    background: rgba(37, 99, 235, 0.8);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(59, 130, 246, 0.5);
    transition: all 0.2s ease-in-out;
  }
  .glass-button-primary:hover {
    background: rgba(37, 99, 235, 0.9);
    transform: translateY(-1px);
  }
  .glass-button {
    @apply px-6 py-2 rounded-lg font-semibold text-white;
    background: rgba(59, 130, 246, 0.5);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease-in-out;
  }
  .glass-button:hover {
    background: rgba(59, 130, 246, 0.7);
    transform: translateY(-1px);
  }
  :global(input[type="date"]::-webkit-calendar-picker-indicator),
  :global(input[type="time"]::-webkit-calendar-picker-indicator) {
    filter: invert(1);
  }
</style>
