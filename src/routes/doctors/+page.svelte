<script lang="ts">
  import { onMount } from 'svelte';
  import type { Doctor } from '$lib/types'; // Ensure the Doctor type is imported
  import { DEFAULT_DOCTOR_AVATAR, BACKEND_URL } from '$lib/constants';
  import { t } from '$lib/utils/i18n';
  import { currentLanguage, currentTranslations } from '$lib/stores/translations';

  let doctors: Doctor[] = []; // Correctly declare the doctors array

  let loading = true;
  let error = '';
  let totalDoctors = 0;
  let currentPage = 1;
  let itemsPerPage = 12;

  // Modified onMount with better debug logging
  onMount(async () => {
    try {
      // Fetch all doctors without pagination
      const response = await fetch(`${BACKEND_URL}/api/doctors?limit=1000`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw data:', data);
      
      // Transform and store all doctors
      doctors = data.map((doctor: any) => ({
        ...doctor,
        name: doctor.name || `Doctor ${doctor.user_id}`,
        rating: doctor.rating || 0,
        is_available: doctor.is_available ?? true,
        is_verified: doctor.is_verified ?? false
      }));
      
      totalDoctors = doctors.length;
      console.log(`Total doctors fetched: ${totalDoctors}`);
    } catch (e) {
      console.error('Error fetching doctors:', e);
      error = e instanceof Error ? e.message : 'Failed to fetch doctors';
    } finally {
      loading = false;
    }
  });

  // Add these debug logs
  $: console.log('Current filters:', { searchQuery, selectedSpecialty, sortBy });
  $: console.log('Filtered doctors:', filteredDoctors);

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

  let searchQuery = '';
  let selectedSpecialty = 'all';
  let sortBy = 'rating';

  // Add new filter states
  let priceRange = { min: 0, max: 1000 };
  let showOnlyAvailable = false;
  let minimumRating = 0;

  // Modified filter logic to be more lenient
  $: filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchQuery.toLowerCase().trim();
    const nameMatch = doctor.name?.toLowerCase().includes(searchLower) || false;
    const specialtyMatch = doctor.specialty?.toLowerCase().includes(searchLower) || false;
    const specialtyFilter = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    const priceFilter = doctor.consultation_fee >= priceRange.min && doctor.consultation_fee <= priceRange.max;
    const availabilityFilter = !showOnlyAvailable || doctor.is_available;
    const ratingFilter = (doctor.rating || 0) >= minimumRating;
    
    console.log('Filtering doctor:', {
      doctor,
      nameMatch,
      specialtyMatch,
      specialtyFilter
    });
    
    return (nameMatch || specialtyMatch) && 
           specialtyFilter && 
           priceFilter && 
           availabilityFilter && 
           ratingFilter;
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'price') return a.consultation_fee - b.consultation_fee;
    if (sortBy === 'recent') return new Date(b.joined_date).getTime() - new Date(a.joined_date).getTime();
    return 0;
  });

  // Reset page when filters change
  $: {
    if (searchQuery || selectedSpecialty || sortBy || showOnlyAvailable || minimumRating || priceRange.max) {
      currentPage = 1;
    }
  }

  // Pagination logic
  $: totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  $: paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Navigation functions
  function goToPage(page: number) {
    currentPage = Math.max(1, Math.min(page, totalPages));
    scrollToTop();
  }

  function nextPage() {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }

  // Get unique specialties for filter dropdown
  $: specialties = ['all', ...new Set(doctors.map(d => d.specialty))];

  // Back to top functionality
  let showBackToTop = false;
  
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleScroll() {
    showBackToTop = window.pageYOffset > 300;
  }

  $: translations = $currentTranslations;
</script>

<svelte:window on:scroll={handleScroll}/>

<!-- Corner SVG Decorations -->
<div class="corner-decoration top-left">
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <!-- Stethoscope -->
    <path d="M40 70c0-16.6 13.4-30 30-30V20c-27.6 0-50 22.4-50 50h20zm30-30c16.6 0 30 13.4 30 30h20c0-27.6-22.4-50-50-50v20zm30 30c0 16.6-13.4 30-30 30v20c27.6 0 50-22.4 50-50h-20zM70 100c-16.6 0-30-13.4-30-30H20c0 27.6 22.4 50 50 50v-20z" 
          stroke="url(#gradient-1)" stroke-width="2"/>
    <circle cx="85" cy="35" r="10" stroke="url(#gradient-1)" stroke-width="2"/>
  </svg>
</div>

<div class="corner-decoration top-right">
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <!-- Medical Cross -->
    <path d="M50 20h20v30h30v20H70v30H50V70H20V50h30V20z" 
          stroke="url(#gradient-2)" stroke-width="2"/>
  </svg>
</div>

<div class="corner-decoration bottom-left">
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <!-- Heart Rate Monitor -->
    <path d="M20 60h20l10-10 20 40 10-60 10 40 10-10h20" 
          stroke="url(#gradient-3)" stroke-width="2" fill="none"/>
  </svg>
</div>

<div class="corner-decoration bottom-right">
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <!-- Medical Staff (Caduceus) -->
    <path d="M60 20v80M40 30c20-10 40 10 40 0c0-10-20-10-40 0zM40 40c20-10 40 10 40 0c0-10-20-10-40 0z" 
          stroke="url(#gradient-4)" stroke-width="2"/>
    <path d="M50 95c-10-10 20-40 20-55M70 95c10-10-20-40-20-55" 
          stroke="url(#gradient-4)" stroke-width="2"/>
  </svg>
</div>

<!-- Gradient Definitions -->
<svg width="0" height="0">
  <defs>
    <linearGradient id="gradient-1" gradientTransform="rotate(45)">
      <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="gradient-2" gradientTransform="rotate(135)">
      <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#DB2777" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="gradient-3" gradientTransform="rotate(225)">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="gradient-4" gradientTransform="rotate(315)">
      <stop offset="0%" stop-color="#9333EA" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#E11D48" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
</svg>

<div class="page-container provider-layout">
  <div class="min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Responsive Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {$t('doctorsPage.title')}
        </h1>
        <a
          href="/doctors/register"
          class="glass-button-primary w-full sm:w-auto text-center"
        >
          {$t('doctorsPage.registerButton')}
        </a>
      </div>

      <!-- Enhanced Responsive Filter Section -->
      <div class="glass-panel mb-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder={$t('doctorsPage.search.placeholder')}
            class="glass-input w-full col-span-1 sm:col-span-2 lg:col-span-1"
          />
          <select bind:value={selectedSpecialty} class="glass-select w-full">
            <option value="all">{$t('doctorsPage.filters.allSpecialties')}</option>
            {#each specialties as specialty}
              <option value={specialty}>{specialty}</option>
            {/each}
          </select>
          <select bind:value={sortBy} class="glass-select w-full">
            <option value="rating">{$t('doctorsPage.filters.sortOptions.rating')}</option>
            <option value="price">{$t('doctorsPage.filters.sortOptions.price')}</option>
            <option value="recent">{$t('doctorsPage.filters.sortOptions.recent')}</option>
          </select>

          <!-- Responsive Filter Controls -->
          <div class="flex flex-wrap gap-4 col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <div class="flex items-center gap-2 min-w-[150px]">
              <input type="checkbox" 
                    bind:checked={showOnlyAvailable} 
                    class="glass-checkbox"
                    id="available-only"/>
              <label for="available-only" class="text-white whitespace-nowrap">
                {$t('doctorsPage.filters.availableOnly')}
              </label>
            </div>

            <div class="flex items-center gap-2 min-w-[150px]">
              <label class="text-white whitespace-nowrap">{$t('doctorsPage.filters.minRating')}:</label>
              <select bind:value={minimumRating} class="glass-select flex-1">
                {#each [0, 1, 2, 3, 4] as rating}
                  <option value={rating}>{rating}+ ★</option>
                {/each}
              </select>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full min-w-[200px]">
              <label class="text-white whitespace-nowrap text-sm sm:text-base">
                {$t('doctorsPage.filters.priceRange')}:
              </label>
              <div class="flex items-center gap-2 w-full">
                <input type="range" 
                      bind:value={priceRange.max} 
                      min="0" 
                      max="1000" 
                      step="10"
                      class="glass-range flex-1 w-full"/>
                <span class="text-white min-w-[60px] text-right text-sm sm:text-base">
                  {$t('doctorsPage.filters.currency')} {priceRange.max}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {#if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-8">
          <p>{$t('doctorsPage.error.loading')}</p>
        </div>
      {/if}

      {#if loading}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {#each Array(4) as _}
            <div class="glass-card animate-pulse">
              <div class="h-48 bg-gray-700/50 rounded-t-xl"></div>
              <div class="p-6">
                <div class="h-6 bg-gray-700/50 rounded mb-4"></div>
                <div class="h-4 bg-gray-700/50 rounded w-2/3 mb-4"></div>
                <div class="h-4 bg-gray-700/50 rounded w-1/2"></div>
              </div>
            </div>
          {/each}
        </div>
      <!-- Empty State -->
      {:else if filteredDoctors.length === 0}
        <div class="glass-panel text-center py-12">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-xl text-gray-200 mb-2">No doctors found</h3>
          <p class="text-gray-400">Try adjusting your search or filters</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {#each paginatedDoctors as doctor (doctor.user_id)}
            <div class="glass-card transform hover:scale-105 transition-all duration-300
                        hover:shadow-xl hover:shadow-blue-500/20">
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
                    {doctor.is_available ? 
                      $t('doctorsPage.status.available') : 
                      $t('doctorsPage.status.unavailable')}
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
                <div class="flex gap-2 mb-4">
                  {#if doctor.years_experience}
                    <span class="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
                      {doctor.years_experience}+ years
                    </span>
                  {/if}
                  <span class="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
                    {doctor.specialty}
                  </span>
                </div>
                <div class="flex justify-between items-center mb-6">
                  <span class="text-2xl font-bold text-white">{$t('doctorsPage.filters.currency')} {doctor.consultation_fee}</span>
                  <span class="text-gray-400">{$t('doctorsPage.doctor.perConsultation')}</span>
                </div>
                <a
                  href={`/doctors/${doctor.user_id}`}
                  class="block w-full text-center glass-button"
                >
                  {$t('doctorsPage.doctor.viewProfile')}
                </a>
              </div>
            </div>
          {/each}
        </div>

        <!-- Enhanced Pagination UI -->
        {#if filteredDoctors.length > itemsPerPage}
          <div class="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <div class="flex gap-2">
              <button 
                class="glass-button px-3 sm:px-4 py-2" 
                on:click={prevPage}
                disabled={currentPage === 1}
              >
                <span class="hidden sm:inline">{$t('doctorsPage.pagination.previous')}</span>
                <span class="sm:hidden">←</span>
              </button>
              
              <div class="flex gap-1 sm:gap-2">
                <!-- Simplified pagination for mobile -->
                {#if window.innerWidth < 640}
                  <span class="text-white py-2">
                    {$t('doctorsPage.pagination.page')} {currentPage} {$t('doctorsPage.pagination.of')} {totalPages}
                  </span>
                {:else}
                  {#if currentPage > 2}
                    <button class="glass-button px-4 py-2" on:click={() => goToPage(1)}>1</button>
                    {#if currentPage > 3}
                      <span class="text-white px-2 py-2">...</span>
                    {/if}
                  {/if}
                  
                  {#each Array.from({length: Math.min(3, totalPages)}, (_, i) => {
                    const page = currentPage + i - 1;
                    return page;
                  }).filter(page => page > 0 && page <= totalPages) as page}
                    <button
                      class="glass-button px-4 py-2 {currentPage === page ? 'bg-blue-600/50' : ''}"
                      on:click={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  {/each}
                  
                  {#if currentPage < totalPages - 1}
                    {#if currentPage < totalPages - 2}
                      <span class="text-white px-2 py-2">...</span>
                    {/if}
                    <button 
                      class="glass-button px-4 py-2" 
                      on:click={() => goToPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  {/if}
                {/if}
              </div>

              <button 
                class="glass-button px-3 sm:px-4 py-2" 
                on:click={nextPage}
                disabled={currentPage === totalPages}
              >
                <span class="hidden sm:inline">{$t('doctorsPage.pagination.next')}</span>
                <span class="sm:hidden">→</span>
              </button>
            </div>
            
            <span class="text-white text-sm sm:text-base">
              {$t('doctorsPage.searchResults.foundCount', { values: { count: filteredDoctors.length } })}
            </span>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Back to Top Button -->
{#if showBackToTop}
  <button
    class="fixed bottom-8 right-8 p-4 rounded-full glass-button-primary
           transform hover:scale-110 transition-all duration-300"
    on:click={scrollToTop}
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
    </svg>
  </button>
{/if}

<style>
  .glass-card {
    @apply overflow-hidden rounded-xl;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-card:hover {
    transform: translateY(-5px);
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

  .glass-input {
    @apply px-4 py-2 rounded-lg text-white bg-transparent;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .glass-select {
    @apply px-4 py-2 rounded-lg text-white bg-transparent;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    min-width: 150px;
  }

  .glass-select option {
    @apply bg-gray-800 text-white;
  }

  .glass-checkbox {
    @apply w-4 h-4 rounded;
    accent-color: rgb(59, 130, 246);
  }

  .glass-range {
    @apply rounded-lg h-2;
    accent-color: rgb(59, 130, 246);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    width: 100%;
  }

  .glass-range::-webkit-slider-thumb {
    @apply w-4 h-4 rounded-full;
    -webkit-appearance: none;
    background: rgb(59, 130, 246);
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.5);
  }

  .glass-range::-moz-range-thumb {
    @apply w-4 h-4 rounded-full;
    background: rgb(59, 130, 246);
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.5);
  }

  /* Add responsive adjustments for the range input */
  @media (max-width: 640px) {
    .glass-range {
      @apply h-1.5;
    }
    
    .glass-range::-webkit-slider-thumb {
      @apply w-3 h-3;
    }
    
    .glass-range::-moz-range-thumb {
      @apply w-3 h-3;
    }
  }

  .corner-decoration {
    position: fixed;
    pointer-events: none;
    z-index: -1;
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.2));
    opacity: 0.6;
  }

  .top-left {
    top: 20px;
    left: 20px;
    animation: rotate-float 20s linear infinite;
  }

  .top-right {
    top: 20px;
    right: 20px;
    animation: float 15s ease-in-out infinite;
  }

  .bottom-left {
    bottom: 20px;
    left: 20px;
    animation: float 18s ease-in-out infinite reverse;
  }

  .bottom-right {
    bottom: 20px;
    right: 20px;
    animation: rotate-float 25s linear infinite reverse;
  }

  @keyframes rotate-float {
    0% {
      transform: rotate(0deg) translate(0, 0);
    }
    25% {
      transform: rotate(90deg) translate(10px, -10px);
    }
    50% {
      transform: rotate(180deg) translate(0, 0);
    }
    75% {
      transform: rotate(270deg) translate(-10px, 10px);
    }
    100% {
      transform: rotate(360deg) translate(0, 0);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(-10px, 10px);
    }
  }

  :global(body) {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Add responsive styles */
  @media (max-width: 640px) {
    .glass-card {
      @apply mx-auto max-w-sm;
    }

    .glass-input,
    .glass-select,
    .glass-button {
      @apply text-sm;
    }

    .corner-decoration {
      @apply w-16 h-16;
      opacity: 0.3;
    }
  }

  @media (max-width: 480px) {
    .glass-panel {
      @apply p-3;
    }

    .corner-decoration {
      display: none;
    }
  }

  /* Add smooth transitions for layout changes */
  .grid {
    transition: grid-template-columns 0.3s ease-in-out;
  }

  .glass-card {
    @apply w-full;
    max-width: 100%;
  }
</style>
