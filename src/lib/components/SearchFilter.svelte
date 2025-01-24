<!-- src/lib/components/SearchFilter.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Filter } from '$lib/types';
  
  export let filter: Filter;
  
  const dispatch = createEventDispatcher<{
    filterChange: Filter;
  }>();

  const specialties = [
    'General Care',
    'Elder Care',
    'Pediatric Care',
    'Physical Therapy',
    'Occupational Therapy',
    'Speech Therapy',
    'Mental Health',
    'Post-Surgery Care'
  ];

  let searchTerm = '';
  let debouncedSearch: NodeJS.Timeout;

  function handleInputChange() {
    clearTimeout(debouncedSearch);
    debouncedSearch = setTimeout(() => {
      dispatch('filterChange', filter);
    }, 300);
  }

  function resetFilters() {
    filter = {
      serviceTypeID: '',
      minRating: 0,
      maxHourlyRate: 1000,
      specialty: '',
      availability: undefined
    };
    searchTerm = '';
    dispatch('filterChange', filter);
  }
</script>

<div class="space-y-6">
  <!-- Search Bar -->
  <div class="relative">
    <input
      type="text"
      bind:value={searchTerm}
      on:input={handleInputChange}
      placeholder="Search providers by name or specialty..."
      class="w-full py-3 px-4 pr-10 rounded-lg"
    />
    <svg
      class="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>

  <!-- Filters Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Specialty Filter -->
    <div>
      <label for="specialty" class="block text-sm font-medium text-gray-300 mb-2">
        Specialty
      </label>
      <select
        id="specialty"
        bind:value={filter.specialty}
        on:change={handleInputChange}
        class="w-full"
      >
        <option value="">All Specialties</option>
        {#each specialties as specialty}
          <option value={specialty}>{specialty}</option>
        {/each}
      </select>
    </div>

    <!-- Minimum Rating Filter -->
    <div>
      <label for="minRating" class="block text-sm font-medium text-gray-300 mb-2">
        Minimum Rating
      </label>
      <input
        id="minRating"
        type="range"
        bind:value={filter.minRating}
        on:input={handleInputChange}
        min="0"
        max="5"
        step="0.5"
        class="w-full"
      />
      <div class="text-sm text-gray-300 mt-1">
        {filter.minRating} stars or higher
      </div>
    </div>

    <!-- Max Hourly Rate Filter -->
    <div>
      <label for="maxHourlyRate" class="block text-sm font-medium text-gray-300 mb-2">
        Max Hourly Rate
      </label>
      <input
        id="maxHourlyRate"
        type="number"
        bind:value={filter.maxHourlyRate}
        on:input={handleInputChange}
        min="0"
        step="5"
        class="w-full"
      />
    </div>

    <!-- Availability Filter -->
    <div>
      <label for="availability" class="block text-sm font-medium text-gray-300 mb-2">
        Availability
      </label>
      <select
        id="availability"
        bind:value={filter.availability}
        on:change={handleInputChange}
        class="w-full"
      >
        <option value={undefined}>All Providers</option>
        <option value={true}>Available Now</option>
        <option value={false}>All Providers</option>
      </select>
    </div>
  </div>

  <!-- Reset Button -->
  <div class="flex justify-end">
    <button
      on:click={resetFilters}
      class="text-sm text-gray-300 hover:text-white transition-colors duration-200"
    >
      Reset Filters
    </button>
  </div>
</div>
