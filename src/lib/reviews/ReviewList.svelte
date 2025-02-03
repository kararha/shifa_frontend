<!-- // src/lib/components/reviews/ReviewList.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';
    import ReviewForm from './ReviewForm.svelte';

    export let doctorId: string;
    let showReviewForm = false;
    let reviews = [];
    let loading = true;
    let error = null;

    // Check if user is a patient
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const isPatient = userData.role === 'patient';

    // Debug log
    console.log('ReviewList init:', { doctorId, isPatient, userRole: userData.role });

    async function loadReviews() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/reviews/doctor/${doctorId}`);
            console.log('Reviews endpoint:', `${BACKEND_URL}/api/reviews/doctor/${doctorId}`);
            
            const text = await response.text();
            console.log('Raw response:', text);
            
            if (!response.ok) {
                throw new Error(text);
            }
            
            reviews = text ? JSON.parse(text) : [];
        } catch (err) {
            console.error('Reviews error:', err);
            error = 'Failed to load reviews';
        } finally {
            loading = false;
        }
    }

    function handleReviewSubmitted() {
        showReviewForm = false;
        loadReviews();
    }

    onMount(loadReviews);
</script>

<!-- Simplified review section -->
<div class="review-section glass-panel mt-8">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-white">Reviews</h2>
        {#if isPatient}
            <button
                type="button"
                class="review-button px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                on:click={() => showReviewForm = true}
            >
                Write Review
            </button>
        {/if}
    </div>

    <!-- Display reviews -->
    {#if loading}
        <div class="flex justify-center py-4">
            <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    {:else if error}
        <div class="text-red-400 text-center py-4">{error}</div>
    {:else if reviews.length === 0}
        <p class="text-gray-400 text-center py-4">No reviews yet</p>
    {:else}
        <div class="space-y-4">
            {#each reviews as review (review.id)}
                <div class="bg-white/5 rounded-lg p-4">
                    <div class="flex items-center space-x-2">
                        <div class="flex">
                            {#each Array(5) as _, i}
                                <span class={i < review.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                            {/each}
                        </div>
                        <span class="text-gray-400 text-sm">
                            {new Date(review.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <p class="text-white mt-2">{review.comment}</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Update ReviewForm usage -->
{#if showReviewForm}
    <ReviewForm
        {doctorId}
        on:submit={() => {
            showReviewForm = false;
            loadReviews();
        }}
        on:close={() => showReviewForm = false}
    />
{/if}

<style>
    .glass-panel {
        padding: 1.5rem;
        border-radius: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    button {
        background: rgba(37, 99, 235, 0.8);
        border: 1px solid rgba(59, 130, 246, 0.5);
        transition: all 0.2s ease-in-out;
    }

    button:hover {
        background: rgba(37, 99, 235, 0.9);
        transform: translateY(-1px);
    }

    .review-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 1 !important;
        visibility: visible !important;
        min-width: 120px !important;
        font-weight: 600 !important;
    }

    .review-section :global(button) {
        opacity: 1 !important;
        visibility: visible !important;
    }
</style>