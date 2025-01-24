<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';

    export let entityId: string;
    export let entityType: 'doctor' | 'home-care-provider';
    
    interface Review {
        id: number;
        patient_id: number;
        rating: number;
        comment: string;
        created_at: string;
        review_type: string;
    }

    let reviews: Review[] = [];
    let loading = true;
    let error: string | null = null;
    let showReviewForm = false;
    let newReview = {
        rating: 5,
        comment: ''
    };

    onMount(async () => {
        await loadReviews();
    });

    async function loadReviews() {
        try {
            console.log('Loading reviews for:', entityType, entityId); // Debug log

            const endpoint = entityType === 'doctor' 
                ? `${BACKEND_URL}/api/reviews/doctor/${entityId}`
                : `${BACKEND_URL}/api/reviews/home-care-provider/${entityId}`;

            console.log('Fetching from:', endpoint); // Debug log

            const response = await fetch(endpoint);
            const data = await response.json();
            console.log('Reviews data:', data); // Debug log

            if (!response.ok) throw new Error('Failed to load reviews');
            reviews = Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('Review loading error:', err); // Debug log
            error = err instanceof Error ? err.message : 'Failed to load reviews';
        } finally {
            loading = false;
        }
    }

    async function submitReview() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please login to submit a review');
            }

            const response = await fetch(`${BACKEND_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    review_type: entityType,
                    [entityType === 'doctor' ? 'doctor_id' : 'home_care_provider_id']: entityId,
                    rating: newReview.rating,
                    comment: newReview.comment
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit review');
            }

            await loadReviews();
            showReviewForm = false;
            newReview = { rating: 5, comment: '' };
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to submit review';
        }
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString();
    }
</script>

<div class="glass-card p-6 space-y-6" transition:fade>
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold text-white">Reviews</h2>
        <button 
            class="glass-button"
            on:click={() => showReviewForm = !showReviewForm}
        >
            {showReviewForm ? 'Cancel' : 'Write Review'}
        </button>
    </div>

    {#if showReviewForm}
        <form class="glass-panel space-y-4" on:submit|preventDefault={submitReview}>
            <div>
                <label class="block text-gray-300 mb-2">Rating</label>
                <div class="flex space-x-2">
                    {#each Array(5) as _, i}
                        <button
                            type="button"
                            class="text-2xl"
                            on:click={() => newReview.rating = i + 1}
                        >
                            {i < newReview.rating ? '★' : '☆'}
                        </button>
                    {/each}
                </div>
            </div>

            <div>
                <label class="block text-gray-300 mb-2">Comment</label>
                <textarea
                    bind:value={newReview.comment}
                    required
                    rows="3"
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                ></textarea>
            </div>

            <button type="submit" class="glass-button-primary">
                Submit Review
            </button>
        </form>
    {/if}

    {#if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200">
            {error}
        </div>
    {:else if loading}
        <div class="flex justify-center">
            <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    {:else if reviews.length === 0}
        <p class="text-center text-gray-400">No reviews yet</p>
    {:else}
        <div class="space-y-4">
            {#each reviews as review}
                <div class="glass-panel">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="flex items-center mb-2">
                                {#each Array(5) as _, i}
                                    <span class="text-yellow-400">
                                        {i < review.rating ? '★' : '☆'}
                                    </span>
                                {/each}
                            </div>
                            <p class="text-gray-300">{review.comment}</p>
                        </div>
                        <span class="text-sm text-gray-400">
                            {formatDate(review.created_at)}
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .glass-button-primary {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: rgba(37, 99, 235, 0.8);
        border: 1px solid rgba(59, 130, 246, 0.5);
        border-radius: 0.5rem;
        color: white;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.2s ease-in-out;
    }

    .glass-button {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: rgba(59, 130, 246, 0.5);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 0.5rem;
        color: white;
        font-size: 0.875rem;
        transition: all 0.2s ease-in-out;
    }

    button:hover {
        background: rgba(59, 130, 246, 0.7);
        transform: translateY(-1px);
    }
</style>
