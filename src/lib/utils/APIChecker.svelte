<script lang="ts">
  import { onMount } from 'svelte';
  import { BACKEND_URL } from '$lib/constants';
  
  export let apiEndpoint: string = '';
  let status: 'checking' | 'available' | 'unavailable' = 'checking';
  let responseText = '';
  let error = '';
  
  onMount(async () => {
    if (!apiEndpoint) {
      apiEndpoint = `${BACKEND_URL}/health`;
    }
    
    try {
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });
      
      responseText = await response.text();
      status = response.ok ? 'available' : 'unavailable';
    } catch (e) {
      status = 'unavailable';
      error = e instanceof Error ? e.message : 'Unknown error';
    }
  });
</script>

<div class="api-status-checker">
  <h3>API Status Check</h3>
  <p>Endpoint: {apiEndpoint}</p>
  
  {#if status === 'checking'}
    <p>Checking API availability...</p>
  {:else if status === 'available'}
    <p class="text-green-500">API is available</p>
    <details>
      <summary>Response</summary>
      <pre class="text-xs bg-gray-800 p-2 rounded">{responseText}</pre>
    </details>
  {:else}
    <p class="text-red-500">API is unavailable</p>
    {#if error}
      <p class="text-red-400">Error: {error}</p>
    {/if}
    <details>
      <summary>Response</summary>
      <pre class="text-xs bg-gray-800 p-2 rounded">{responseText}</pre>
    </details>
  {/if}
</div>

<style>
  .api-status-checker {
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  pre {
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
