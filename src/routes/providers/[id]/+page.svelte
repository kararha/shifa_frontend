<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { DEFAULT_DOCTOR_AVATAR } from '$lib/constants';
  import HomeCareVisitModal from '$lib/components/HomeCareVisitModal.svelte';
  import ReviewList from '$lib/components/ReviewList.svelte';

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const providerId = $page.params.id;
  let provider: any = null;
  let loading = true;
  let error: string | null = null;
  let showBookingModal = false;

  onMount(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/providers/${providerId}`);
      console.log('Provider API response:', response); // Debug log

      if (!response.ok) throw new Error('Provider not found');
      
      const data = await response.json();
      console.log('Provider data:', data); // Debug log
      
      provider = data;
      loading = false; // Set loading to false after data is set

    } catch (err) {
      console.error('Error loading provider:', err);
      error = err instanceof Error ? err.message : 'Failed to load provider';
      loading = false;
    }
  });

  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = DEFAULT_DOCTOR_AVATAR;
  }

  function handleBookingSuccess() {
    showBookingModal = false;
    // Optional: Show success message or redirect
  }
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    {#if error}
      <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-8" transition:fade>
        <p class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
          </svg>
          {error}
        </p>
        <a href="/providers" class="glass-button mt-4 inline-block">Back to Providers</a>
      </div>
    {:else if loading}
      <div class="flex justify-center items-center h-64" transition:fade>
        <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8" transition:fade>
        <!-- Profile Sidebar -->
        <div class="lg:col-span-1">
          <div class="glass-card">
            <div class="relative">
              <img
                src={provider.profile_picture_url || DEFAULT_DOCTOR_AVATAR}
                alt={provider.name}
                class="w-full h-64 object-cover rounded-t-xl"
                on:error={handleImageError}
              />
              {#if provider.is_verified}
                <div class="absolute top-4 right-4 bg-blue-500 p-2 rounded-full">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                  </svg>
                </div>
              {/if}
            </div>
            <div class="p-6">
              <h1 class="text-2xl font-bold text-white mb-2">{provider.qualifications?.split('.')[0]}</h1>
              <p class="text-blue-300 mb-4">{provider.qualifications}</p>
              <div class="flex items-center mb-4">
                <span class="text-yellow-400 mr-1">★</span>
                <span class="text-gray-300">{provider.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <div class="flex flex-col space-y-4">
                <div class="flex justify-between text-gray-300">
                  <span>Experience</span>
                  <span>{provider.experience_years} years</span>
                </div>
                <div class="flex justify-between text-gray-300">
                  <span>Hourly Rate</span>
                  <span class="text-white font-bold">${provider.hourly_rate}</span>
                </div>
                <div class="flex justify-between text-gray-300">
                  <span>Availability</span>
                  <span class={provider.is_available ? 'text-green-400' : 'text-red-400'}>
                    {provider.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- About Section -->
          <div class="glass-card p-6">
            <h2 class="text-xl font-bold text-white mb-4">About</h2>
            <p class="text-gray-300">{provider.bio}</p>
          </div>

          <!-- Qualifications Section -->
          <div class="glass-card p-6">
            <h2 class="text-xl font-bold text-white mb-4">Qualifications</h2>
            <div class="space-y-2">
              {#each provider.qualifications?.split('.') || [] as qualification}
                {#if qualification.trim()}
                  <div class="flex items-center text-gray-300">
                    <svg class="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span>{qualification.trim()}</span>
                  </div>
                {/if}
              {/each}
            </div>
          </div>

          <!-- Book Appointment Button -->
          <button 
            class="glass-button-primary w-full"
            on:click={() => showBookingModal = true}
          >
            Book home care visit
          </button>

          <!-- Add modal component -->
          <HomeCareVisitModal
            show={showBookingModal}
            providerId={provider?.user_id}
            on:close={() => showBookingModal = false}
            on:success={handleBookingSuccess}
          />

          <ReviewList 
            entityId={provider?.id?.toString() || ''} 
            entityType="home-care-provider"
          />
        </div>
      </div>
    {/if}
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

  .glass-panel {
    @apply p-4 rounded-lg;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid;
  }
</style>