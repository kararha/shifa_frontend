<!-- src/routes/providers/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import ProviderCard from '$lib/components/ProviderCard.svelte';
  import SearchFilter from '$lib/components/SearchFilter.svelte';
  import { DEFAULT_DOCTOR_AVATAR } from '$lib/constants';

  interface Provider {
    user_id: number;
    service_type_id: number;
    experience_years: number;
    qualifications: string;
    bio: string;
    profile_picture_url: string;
    hourly_rate: number;
    rating: number;
    is_verified: boolean;
    is_available: boolean;
    status: string;
    latitude: number;
    longitude: number;
    name: string;
    specialty: string;
    availability: {
      isAvailable: boolean;
    };
  }

  interface Filter {
    serviceTypeID: string;
    minRating: number;
    maxHourlyRate: number;
    specialty?: string;
    availability?: string[];
  }

  let providers: Provider[] = [];
  let loading = true;
  let error: string | null = null;
  let filter: Filter = {
    serviceTypeID: '',
    minRating: 0,
    maxHourlyRate: 1000,
    specialty: '',
    availability: []
  };

  async function loadProviders() {
    loading = true;
    error = null;
    
    try {
      const params = new URLSearchParams();
      if (filter.serviceTypeID) params.append('service_type_id', filter.serviceTypeID);
      if (filter.minRating) params.append('min_rating', filter.minRating.toString());
      if (filter.maxHourlyRate) params.append('max_hourly_rate', filter.maxHourlyRate.toString());
      if (filter.specialty) params.append('specialty', filter.specialty);
      if (filter.availability !== undefined) params.append('available', filter.availability.toString());
      
      const response = await fetch(`http://localhost:8888/api/providers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      
      const data = await response.json();
      providers = data.map((item: Provider) => ({
        user_id: item.user_id,
        name: item.qualifications?.split('.')[0] || 'Healthcare Provider',
        profile_picture_url: item.profile_picture_url || DEFAULT_DOCTOR_AVATAR,
        rating: item.rating,
        hourlyRate: item.hourly_rate,
        experienceYears: item.experience_years,
        specialty: item.qualifications,
        bio: item.bio,
        is_verified: item.is_verified,
        availability: {
          isAvailable: item.is_available
        }
      }));

    } catch (err) {
      console.error('Error loading providers:', err);
      error = err instanceof Error ? err.message : 'Failed to load providers';
    } finally {
      loading = false;
    }
  }

  function handleFilterChange(event: CustomEvent<Filter>) {
    filter = event.detail;
    loadProviders();
  }

  onMount(() => {
    loadProviders();
  });

  // Add image handling function
  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = DEFAULT_DOCTOR_AVATAR;
  }
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-12">
      <h1 class="text-4xl font-bold text-white tracking-tight">Find Your Provider</h1>
      <a
        href="/providers/register"
        class="glass-button-primary"
      >
        Register as Provider
      </a>
    </div>

    <!-- Search and Filter Section -->
    <div class="glass-card mb-8" transition:fade>
      <SearchFilter {filter} on:filterChange={handleFilterChange} />
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
        {#each providers as provider (provider.user_id)}
          <div class="glass-card transform hover:scale-105 transition-all duration-300">
            <div class="relative">
              <img
                src={provider.profile_picture_url}
                alt={provider.name}
                class="w-full h-48 object-cover rounded-t-xl"
                on:error={handleImageError}
              />
              <div class="absolute top-4 right-4">
                <span class={`px-3 py-1 rounded-full text-sm 
                  ${provider.availability.isAvailable ? 'bg-green-500/90' : 'bg-red-500/90'} text-white`}>
                  {provider.availability.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              {#if provider.is_verified}
                <div class="absolute bottom-4 right-4 bg-blue-500 p-1.5 rounded-full">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                  </svg>
                </div>
              {/if}
            </div>
            <div class="p-6">
              <h2 class="text-xl font-bold text-white mb-2">{provider.name}</h2>
              <p class="text-blue-300 mb-3">{provider.specialty}</p>
              <div class="flex items-center mb-4">
                <span class="text-yellow-400 mr-1">★</span>
                <span class="text-gray-300">{provider.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <p class="text-gray-300 line-clamp-2 mb-4">{provider.bio}</p>
              <div class="flex justify-between items-center mb-6">
                <span class="text-2xl font-bold text-white">${provider.hourly_rate}</span>
                <span class="text-gray-400">per hour</span>
              </div>
              <a
                href={`/providers/${provider.user_id}`}
                class="block w-full text-center glass-button"
              >
                View Profile
              </a>
            </div>
          </div>
        {/each}

        {#if providers.length === 0}
          <div class="col-span-full glass-card py-16 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p class="text-gray-300 text-lg mb-6">No providers found matching your criteria</p>
            <button 
              class="glass-button"
              on:click={() => {
                filter = {
                  serviceTypeID: '',
                  minRating: 0,
                  maxHourlyRate: 1000,
                  specialty: '',
                  availability: undefined
                };
                loadProviders();
              }}
            >
              Reset Filters
            </button>
          </div>
        {/if}
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

  :global(.glass-card input),
  :global(.glass-card select) {
    @apply bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2;
  }

  :global(.glass-card input:focus),
  :global(.glass-card select:focus) {
    @apply outline-none border-white/30 bg-white/20;
  }

  :global(body) {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    min-height: 100vh;
  }
</style>