<!-- // src/lib/components/reviews/ReviewForm.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let doctorId: string;
  
  const dispatch = createEventDispatcher();
  
  let rating = 5;
  let comment = '';
  let loading = false;
  let error = '';

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctor_id: parseInt(doctorId),
          review_type: 'doctor',
          rating,
          comment
        })
      });

      if (!response.ok) throw new Error('Failed to submit review');
      dispatch('submitted');
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  <div class="glass-card max-w-lg w-full mx-4">
    <h2 class="text-xl font-semibold text-white mb-6">Write a Review</h2>
    
    {#if error}
      <div class="bg-red-500/20 text-red-300 p-4 rounded-lg mb-4">
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
        <label for="comment" class="block text-white mb-2">Comment</label>
        <textarea
          id="comment"
          bind:value={comment}
          required
          rows="4"
          class="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
          placeholder="Share your experience..."
        ></textarea>
      </div>

      <div class="flex justify-end space-x-4">
        <button
          type="button"
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          on:click={() => dispatch('cancel')}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="glass-button"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  </div>
</div>