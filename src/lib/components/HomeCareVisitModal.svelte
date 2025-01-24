<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { User } from '$lib/types';

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

  let loading = false;
  let error: string | null = null;
  let currentUser: User | null = null;

  async function getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('http://localhost:8888/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to get user data');
      return await response.json();
    } catch (err) {
      console.error('Error fetching user:', err);
      return null;
    }
  }

  async function createAppointment(token: string, visitDateTime: Date) {
    // Calculate end time based on duration
    const startTime = visitDateTime;
    const endTime = new Date(startTime.getTime() + (formData.durationHours * 60 * 60 * 1000));

    const appointmentPayload = {
      patient_id: currentUser?.id,
      provider_type: 'home_care_provider',
      home_care_provider_id: providerId,
      appointment_date: visitDateTime.toISOString().split('T')[0],
      start_time: startTime.toTimeString().split(' ')[0],
      end_time: endTime.toTimeString().split(' ')[0],
      status: 'scheduled'
    };

    const response = await fetch('http://localhost:8888/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(appointmentPayload)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create appointment');
    }

    const data = await response.json();
    return data.id;
  }

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

  async function validateAddress() {
    try {
      // You might want to use a geocoding service here
      // For now, we'll use browser's geolocation as a placeholder
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      formData.latitude = position.coords.latitude;
      formData.longitude = position.coords.longitude;
    } catch (err) {
      console.warn('Could not get coordinates:', err);
    }
  }

  async function handleSubmit() {
    loading = true;
    error = null;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to schedule a visit');
      }

      if (!currentUser) {
        currentUser = await getCurrentUser();
        if (!currentUser) {
          throw new Error('Failed to get user data');
        }
      }

      // Validation
      if (!formData.address.trim()) {
        throw new Error('Address is required');
      }

      if (!formData.visitDate || !formData.visitTime) {
        throw new Error('Visit date and time are required');
      }

      const visitDateTime = new Date(`${formData.visitDate}T${formData.visitTime}`);
      if (isNaN(visitDateTime.getTime())) {
        throw new Error('Invalid date or time');
      }

      if (visitDateTime < new Date()) {
        throw new Error('Visit time cannot be in the past');
      }

      await validateAddress();

      // Create appointment first
      const appointmentId = await createAppointment(token, visitDateTime);
      
      // Create home care visit with proper decimal precision for coordinates
      const payload = {
        appointment_id: appointmentId,
        address: formData.address.trim(),
        latitude: Number(formData.latitude.toFixed(8)),
        longitude: Number(formData.longitude.toFixed(8)),
        duration_hours: Number(formData.durationHours.toFixed(2)),
        special_requirements: formData.specialRequirements.trim(),
        status: 'scheduled' // Using correct enum value from database
      };

      const response = await fetch('http://localhost:8888/api/home-care-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.msg || 'Failed to schedule visit');
      }

      dispatch('success');
      closeModal();
    } catch (err) {
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
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" on:click={closeModal}></div>

      <!-- Modal -->
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
            <input
              type="text"
              id="address"
              bind:value={formData.address}
              required
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              placeholder="Enter your full address"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-300 mb-1" for="visitDate">Date *</label>
              <input
                type="date"
                id="visitDate"
                bind:value={formData.visitDate}
                required
                min={new Date().toISOString().split('T')[0]}
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label class="block text-gray-300 mb-1" for="visitTime">Time *</label>
              <input
                type="time"
                id="visitTime"
                bind:value={formData.visitTime}
                required
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label class="block text-gray-300 mb-1" for="duration">Duration (hours) *</label>
            <input
              type="number"
              id="duration"
              bind:value={formData.durationHours}
              min="0.5"
              max="12"
              step="0.5"
              required
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div>
            <label class="block text-gray-300 mb-1" for="requirements">Special Requirements</label>
            <textarea
              id="requirements"
              bind:value={formData.specialRequirements}
              rows="3"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              placeholder="Any special requirements or notes for the care provider..."
            ></textarea>
          </div>

          <div class="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              class="glass-button"
              on:click={closeModal}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="glass-button-primary"
              disabled={loading}
            >
              {loading ? 'Scheduling...' : 'Schedule Visit'}
            </button>
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