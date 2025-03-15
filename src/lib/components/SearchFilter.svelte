<!-- src/lib/components/SearchFilter.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let filter: any;
  const dispatch = createEventDispatcher();
  let keyword = filter.specialty || '';

  function onSearch() {
    dispatch('filterChange', { ...filter, specialty: keyword });
  }
</script>

<div class="search-container">
  <input
    type="text"
    placeholder="Search providers..."
    bind:value={keyword}
    on:keyup={(e) => e.key === 'Enter' && onSearch()}
  />
  <button on:click={onSearch}>Search</button>
</div>

<style>
  .search-container {
    display: flex;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.75rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }
  input {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 0.25rem;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 1rem;
  }
  input::placeholder {
    color: #ccc;
  }
  button {
    padding: 0.5rem 1rem;
    background: #2563eb;
    border: none;
    border-radius: 0.25rem;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
  }
  button:hover {
    background: #1e40af;
  }
</style>
