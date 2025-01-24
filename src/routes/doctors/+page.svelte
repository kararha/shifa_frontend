<script lang="ts">
  import { onMount } from 'svelte';
  import type { Doctor } from '$lib/types'; // Ensure the Doctor type is imported
  import { DEFAULT_DOCTOR_AVATAR, BACKEND_URL } from '$lib/constants';

  let doctors: Doctor[] = []; // Correctly declare the doctors array

  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:8888/api/doctors');
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      doctors = await response.json();
    } catch (e: unknown) {
      error = (e as Error).message; // Ensure error handling is correct
    } finally {
      loading = false;
    }
  });

  // Helper function to get complete image URL
  function getImageUrl(profileUrl: string | null | undefined): string {
    if (!profileUrl) return DEFAULT_DOCTOR_AVATAR;
    if (profileUrl.startsWith('http')) return profileUrl;
    return `${BACKEND_URL}${profileUrl}`;
  }

  // Add image error handling
  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = DEFAULT_DOCTOR_AVATAR;
  }
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-12">
      <h1 class="text-4xl font-bold text-white tracking-tight">Find Your Doctor</h1>
      <a
        href="/doctors/register"
        class="glass-button-primary"
      >
        Register as Doctor
      </a>
    </div>

    {#if error}
      <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-8">
        <p class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
          </svg>
          {error}
        </p>
      </div>
    {/if}

    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each doctors as doctor}
          <div class="glass-card transform hover:scale-105 transition-all duration-300">
            <div class="relative">
              <img
                src={getImageUrl(doctor.profile_picture_url)}
                alt={doctor.name}
                class="w-full h-48 object-cover rounded-t-xl"
                on:error={handleImageError}
              />
              <div class="absolute top-4 right-4">
                <span class={`px-3 py-1 rounded-full text-sm 
                  ${doctor.is_available ? 'bg-green-500/90' : 'bg-red-500/90'} text-white`}>
                  {doctor.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              {#if doctor.is_verified}
                <div class="absolute bottom-4 right-4 bg-blue-500 p-1.5 rounded-full">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                  </svg>
                </div>
              {/if}
            </div>
            <div class="p-6">
              <h2 class="text-xl font-bold text-white mb-2">Dr. {doctor.name}</h2>
              <p class="text-blue-300 mb-3">{doctor.specialty}</p>
              <div class="flex items-center mb-4">
                <span class="text-yellow-400 mr-1">★</span>
                <span class="text-gray-300">{doctor.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <p class="text-gray-300 line-clamp-2 mb-4">{doctor.bio}</p>
              <div class="flex justify-between items-center mb-6">
                <span class="text-2xl font-bold text-white">${doctor.consultation_fee}</span>
                <span class="text-gray-400">per consultation</span>
              </div>
              <a
                href={`/doctors/${doctor.user_id}`}
                class="block w-full text-center glass-button"
              >
                View Profile
              </a>
            </div>
          </div>
        {/each}
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

  .glass-button {
    @apply px-6 py-3 rounded-lg font-semibold text-white;
    background: rgba(59, 130, 246, 0.5);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease-in-out;
  }

  .glass-button:hover {
    background: rgba(59, 130, 246, 0.7);
    transform: translateY(-1px);
  }

  .glass-button-primary {
    @apply px-6 py-3 rounded-lg font-semibold text-white;
    background: rgba(37, 99, 235, 0.8);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(59, 130, 246, 0.5);
    transition: all 0.2s ease-in-out;
  }

  .glass-button-primary:hover {
    background: rgba(37, 99, 235, 0.9);
    transform: translateY(-1px);
  }

  .glass-panel {
    @apply p-4 rounded-lg;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid;
  }

  :global(body) {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    min-height: 100vh;
  }
</style>
