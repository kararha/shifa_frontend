// src/lib/components/reviews/ReviewList.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import ReviewForm from './ReviewForm.svelte';

  interface Review {
    id: number;
    patient_id: number;
    review_type: string;
    doctor_id?: number;
    rating: number;
    comment: string;
    created_at: string;
  }

  export let doctorId: string;
  export let canReview: boolean = false;
  
  let reviews: Review[] = [];
  let loading = true;
  let error = '';
  let showReviewForm = false;

  onMount(async () => {
    if (!doctorId) {
      error = 'Doctor ID is required';
      loading = false;
      return;
    }
    await loadReviews();
  });

  async function loadReviews() {
    if (!doctorId) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews/doctor/${doctorId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      reviews = await response.json();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }

  function handleReviewSubmitted() {
    showReviewForm = false;
    loadReviews();
  }
</script>

<div class="glass-panel mt-8">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-semibold text-white">Reviews</h2>
    {#if canReview}
      <button
        class="glass-button"
        on:click={() => showReviewForm = true}
      >
        Write Review
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="flex justify-center py-4">
      <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="text-red-400 text-center py-4">{error}</div>
  {:else if reviews.length === 0}
    <p class="text-gray-400 text-center py-4">No reviews yet</p>
  {:else}
    <div class="space-y-6">
      {#each reviews as review (review.id)}
        <div class="bg-white/5 rounded-lg p-4" transition:fade>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="flex">
                {#each Array(5) as _, i}
                  <span class={i < review.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                {/each}
              </div>
              <span class="text-gray-400 text-sm">
                {formatDate(review.created_at)}
              </span>
            </div>
          </div>
          <p class="text-white mt-3">{review.comment}</p>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showReviewForm}
  <ReviewForm
    {doctorId}
    on:submitted={handleReviewSubmitted}
    on:cancel={() => showReviewForm = false}
  />
{/if}