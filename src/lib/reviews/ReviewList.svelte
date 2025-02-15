<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';

    export let entityId: string;
    export let entityType: 'doctor' | 'home-care-provider';
    
    interface Review {
        id: number;
        patient_id: number;
        review_type: string;
        consultation_id?: number;
        home_care_visit_id?: number;
        doctor_id?: number;
        home_care_provider_id?: number;
        rating: number;
        comment: string;
        created_at: string;
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

    $: {
        console.log('ReviewList component - Received props:', { entityId, entityType });
        if (!entityId) {
            console.error('ReviewList: entityId is missing');
        } else {
            console.log('ReviewList received entityId:', entityId, 'type:', entityType);
        }
    }

    async function loadReviews() {
        try {
            if (!entityId) {
                throw new Error('Entity ID is required');
            }

            // Match the exact backend route structure from Go code
            const endpoint = entityType === 'doctor' 
                ? `${BACKEND_URL}/api/reviews/doctor/${entityId}`
                : `${BACKEND_URL}/api/reviews/home-care-provider/${entityId}`;

            console.log('Loading reviews with:', {
                entityType,
                entityId,
                endpoint
            });

            const response = await fetch(endpoint, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            let text;
            try {
                text = await response.text();
                console.log('Raw server response:', text);

                // Handle empty response
                if (!text || text.trim() === '') {
                    reviews = [];
                    return;
                }

                const data = JSON.parse(text);

                if (!response.ok) {
                    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
                }

                // Handle the array response
                reviews = Array.isArray(data) ? data : [data];
                error = null;

            } catch (parseError) {
                console.error('Response parsing error:', parseError);
                console.error('Raw response:', text);
                throw new Error('Failed to parse server response');
            }

        } catch (err) {
            console.error('Review loading error:', err);
            error = err instanceof Error ? err.message : 'Failed to load reviews';
            reviews = [];
        } finally {
            loading = false;
        }
    }

    // Add a function to map entity type to review type
    function getReviewType(type: 'doctor' | 'home-care-provider'): 'consultation' | 'home_care' {
        return type === 'doctor' ? 'consultation' : 'home_care';
    }

    async function submitReview() {
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!token) {
                throw new Error('Please login to submit a review');
            }

            if (!userData.id) {
                throw new Error('User information not found');
            }

            const entityIdInt = parseInt(entityId);
            if (isNaN(entityIdInt)) {
                throw new Error('Invalid ID format');
            }

            // Create the correct review data based on entity type
            const reviewData = {
                review_type: getReviewType(entityType),
                rating: newReview.rating,
                comment: newReview.comment,
                patient_id: userData.id,
                ...(entityType === 'doctor' 
                    ? { doctor_id: entityIdInt }
                    : { home_care_provider_id: entityIdInt }
                )
            };

            console.log('Submitting review data:', reviewData);

            const response = await fetch(`${BACKEND_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reviewData)
            });

            const rawText = await response.text();
            console.log('Raw response:', rawText);
            
            try {
                const data = JSON.parse(rawText);
                if (!response.ok) {
                    console.error('Server error response:', data);
                    throw new Error(data.error || data.message || 'Failed to submit review');
                }
                
                await loadReviews();
                showReviewForm = false;
                newReview = { rating: 5, comment: '' };
            } catch (parseError) {
                console.error('Response parsing error:', parseError, 'Raw response:', rawText);
                throw new Error('Invalid server response');
            }
        } catch (err) {
            console.error('Review submission error:', err);
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
