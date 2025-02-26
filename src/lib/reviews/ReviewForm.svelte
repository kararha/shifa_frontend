<!-- src/lib/components/reviews/ReviewForm.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { BACKEND_URL } from '$lib/constants';

  export let doctorId: string | undefined = undefined;
  export let providerId: string | undefined = undefined;
  const dispatch = createEventDispatcher();

  let rating = 5;
  let comment = '';
  let loading = false;
  let error: string | null = null;

  async function handleSubmit() {
    try {
      loading = true;
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      if (!token || !userData.id) {
        throw new Error('Please login to submit a review');
      }

      const reviewData = {
        patient_id: userData.id,
        rating,
        comment: comment.trim(),
        // Set the correct fields based on entity type
        review_type: doctorId ? 'consultation' : 'home_care',
        doctor_id: doctorId ? parseInt(doctorId) : null,
        home_care_provider_id: providerId ? parseInt(providerId) : null
      };

      console.log('Submitting review:', reviewData);

      const response = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      dispatch('submit');
    } catch (err) {
      console.error('Review error:', err);
      error = err instanceof Error ? err.message : 'Failed to submit review';
    } finally {
      loading = false;
    }
  }
</script>

<!-- Modal template -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" transition:fade>
  <div class="glass-card max-w-lg w-full mx-4 p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold text-white">Write a Review</h2>
      <button
        class="text-gray-400 hover:text-white"
        on:click={() => dispatch('close')}
        aria-label="Close review form"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {#if error}
      <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-4" transition:fade>
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <div>
        <label for="rating" class="block text-white mb-2">Rating</label>
        <div class="flex space-x-2" id="rating" role="radiogroup">
          {#each Array(5) as _, i}
            <button
              type="button"
              class="text-2xl focus:outline-none"
              class:text-yellow-400={i < rating}
              class:text-gray-600={i >= rating}
              on:click={() => rating = i + 1}
            >
              ★
            </button>
          {/each}
        </div>
      </div>

      <div>
        <label for="comment" class="block text-white mb-2">Your Review</label>
        <textarea
          id="comment"
          bind:value={comment}
          required
          rows="4"
          class="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
          placeholder="Share your experience..."
        ></textarea>
      </div>

      <div class="flex justify-end space-x-4">
        <button
          type="button"
          class="glass-button"
          on:click={() => dispatch('close')}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="glass-button-primary"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  /* Reuse existing glass styles from other components */
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
  }

  .glass-button, .glass-button-primary {
    @apply px-6 py-2 rounded-lg font-semibold transition-all duration-200;
  }

  .glass-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
  }

  .glass-button-primary {
    background: rgba(37, 99, 235, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.5);
    color: white;
  }

  .glass-button:hover, .glass-button-primary:hover {
    transform: translateY(-1px);
  }
</style>
