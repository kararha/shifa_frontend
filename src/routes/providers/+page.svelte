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

  // Add scroll animations
  let scrollY: number;
  let innerHeight: number;
  
  $: {
    if (typeof window !== 'undefined') {
      scrollY = window.scrollY;
      innerHeight = window.innerHeight;
    }
  }
</script>

<!-- Corner SVG Decorations -->
<div class="corner-decoration top-left">
  <svg width="120" height="120" viewBox="0 0 24 24" class="heart-pulse">
    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    <circle cx="12" cy="12" r="8" class="pulse" fill="none" stroke="currentColor"/>
  </svg>
</div>

<div class="corner-decoration top-right">
  <svg width="120" height="120" viewBox="0 0 24 24" class="stethoscope">
    <path fill="currentColor" d="M19 8C19.56 8 20 8.43 20 9C20 9.55 19.55 10 19 10C18.43 10 18 9.55 18 9C18 8.43 18.43 8 19 8M2 2V11C2 13.96 4.19 16.5 7.14 16.91C7.76 19.92 10.42 22 13.5 22C17.09 22 20 19.09 20 15.5V11.81C21.16 11.39 22 10.29 22 9C22 7.34 20.66 6 19 6C17.34 6 16 7.34 16 9C16 10.29 16.84 11.4 18 11.81V15.41C18 17.91 16 19.91 13.5 19.91C11.5 19.91 9.82 18.7 9.22 16.9C12 16.3 14 13.8 14 11V2H10V5H12V11C12 13.21 10.21 15 8 15C5.79 15 4 13.21 4 11V5H6V2H2Z"/>
  </svg>
</div>

<div class="corner-decoration bottom-left">
  <svg width="120" height="120" viewBox="0 0 24 24" class="medicine">
    <path fill="currentColor" d="M6 3H18C19.1 3 20 3.9 20 5V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V5C4 3.9 4.9 3 6 3M6 5V19H18V5H6M8 7H16V9H8V7M8 11H16V13H8V11M8 15H13V17H8V15Z"/>
  </svg>
</div>

<div class="corner-decoration bottom-right">
  <svg width="120" height="120" viewBox="0 0 24 24" class="home-care">
    <path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
    <path fill="currentColor" d="M12,5.5L18,11V19H16V13H8V19H6V11L12,5.5"/>
  </svg>
</div>

<div class="page-container provider-layout">
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
      <div class="filter-section" transition:fade>
        <SearchFilter {filter} on:filterChange={handleFilterChange} />
      </div>

      {#if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-8">
          <p class="flex items-center">
            {error}
          </p>
        </div>
      {/if}

      {#if loading}
        <div class="flex justify-center items-center h-64">
          <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="provider-grid">
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
                    ✓
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
</div>

<style>
  .glass-card {
    @apply overflow-hidden rounded-xl;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    transform: translateZ(0);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-card:hover {
    transform: translateZ(50px) scale(1.02);
    box-shadow: 
      0 20px 40px rgba(13, 15, 48, 0.3),
      0 0 20px rgba(123, 157, 255, 0.2);
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

  .corner-decoration {
    position: fixed;
    width: 120px;
    height: 120px;
    pointer-events: none;
    color: rgba(59, 130, 246, 0.5);
    filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.3));
  }

  .top-left {
    top: 2rem;
    left: 2rem;
    animation: float-tl 6s ease-in-out infinite;
  }

  .top-right {
    top: 2rem;
    right: 2rem;
    animation: float-tr 7s ease-in-out infinite;
  }

  .bottom-left {
    bottom: 2rem;
    left: 2rem;
    animation: float-bl 8s ease-in-out infinite;
  }

  .bottom-right {
    bottom: 2rem;
    right: 2rem;
    animation: float-br 5s ease-in-out infinite;
  }

  @keyframes float-tl {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(10px, 15px) rotate(5deg); }
  }

  @keyframes float-tr {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(-10px, 10px) rotate(-5deg); }
  }

  @keyframes float-bl {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(15px, -10px) rotate(5deg); }
  }

  @keyframes float-br {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(-5px, -15px) rotate(-5deg); }
  }

  .heart-pulse .pulse {
    stroke-width: 2;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.5; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(0.95); opacity: 0.5; }
  }

  .stethoscope {
    animation: rotate3d 8s ease-in-out infinite;
  }

  .medicine {
    animation: rotate3d-reverse 8s ease-in-out infinite;
  }

  .home-care {
    animation: glow 4s ease-in-out infinite;
  }

  @keyframes rotate3d {
    0%, 100% { transform: perspective(1000px) rotateY(0deg); }
    50% { transform: perspective(1000px) rotateY(15deg); }
  }

  @keyframes rotate3d-reverse {
    0%, 100% { transform: perspective(1000px) rotateY(0deg); }
    50% { transform: perspective(1000px) rotateY(-15deg); }
  }

  @keyframes glow {
    0%, 100% { filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.3)); }
    50% { filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.5)); }
  }

  :global(body) {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    min-height: 100vh;
    overflow-x: hidden;
  }
</style>