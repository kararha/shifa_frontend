<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';

    export let entityId: string;
    export let entityType: 'doctor' | 'home-care-provider';
    export let submitParams: any = null;
    export let hideWriteReview = false;  // Add this prop
    
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

            const endpoint = entityType === 'doctor' 
                ? `${BACKEND_URL}/api/reviews/doctor/${entityId}`
                : `${BACKEND_URL}/api/reviews/provider/${entityId}`;

            console.log('Loading reviews from:', endpoint);

            const response = await fetch(endpoint);
            
            if (!response.ok) {
                if (response.status === 404) {
                    reviews = [];
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            reviews = Array.isArray(data) ? data : [data];
            
            // Filter reviews for the correct entity
            reviews = reviews.filter(review => 
                entityType === 'doctor' 
                    ? review.doctor_id === parseInt(entityId)
                    : review.home_care_provider_id === parseInt(entityId)
            );
            
            console.log('Loaded reviews:', reviews);
            error = null;

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
            
            if (!token) throw new Error('Please login to submit a review');
            if (!userData.id) throw new Error('User information not found');

            const entityIdInt = parseInt(entityId);
            if (isNaN(entityIdInt)) throw new Error('Invalid ID format');

            // Create the correct review data based on entity type
            const reviewData = {
                review_type: entityType === 'doctor' ? 'consultation' : 'home_care',
                rating: newReview.rating,
                comment: newReview.comment,
                patient_id: userData.id,
                // Use conditional field based on entityType
                ...(entityType === 'doctor' 
                    ? { doctor_id: parseInt(entityId) }
                    : { home_care_provider_id: parseInt(entityId) }
                ),
                ...submitParams
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

<div class="glass-card p-6" transition:fade>
    <!-- Header with stats -->
    <div class="mb-8">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-white">Reviews & Ratings</h2>
            {#if !hideWriteReview}
                <button 
                    class="glass-button"
                    on:click={() => showReviewForm = !showReviewForm}
                >
                    {showReviewForm ? 'Cancel' : 'Write Review'}
                </button>
            {/if}
        </div>
        
        {#if reviews.length > 0}
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="glass-panel text-center p-4">
                    <div class="text-2xl font-bold text-white mb-1">
                        {reviews.length}
                    </div>
                    <div class="text-sm text-gray-400">Total Reviews</div>
                </div>
                <div class="glass-panel text-center p-4">
                    <div class="text-2xl font-bold text-yellow-400 mb-1">
                        {(reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length || 0).toFixed(1)}
                    </div>
                    <div class="text-sm text-gray-400">Average Rating</div>
                </div>
                <div class="glass-panel text-center p-4">
                    <div class="text-2xl font-bold text-green-400 mb-1">
                        {reviews.filter(r => r.rating >= 4).length}
                    </div>
                    <div class="text-sm text-gray-400">High Ratings</div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Review Form -->
    {#if showReviewForm}
        <form class="glass-panel space-y-4 mb-8" on:submit|preventDefault={submitReview}>
            <div>
                <label class="block text-gray-300 mb-2">Rating</label>
                <div class="flex space-x-2">
                    {#each Array(5) as _, i}
                        <button
                            type="button"
                            class="text-2xl transition-transform hover:scale-110"
                            on:click={() => newReview.rating = i + 1}
                        >
                            <span class={i < newReview.rating ? 'text-yellow-400' : 'text-gray-500'}>
                                ★
                            </span>
                        </button>
                    {/each}
                </div>
            </div>

            <div>
                <label class="block text-gray-300 mb-2">Your Review</label>
                <textarea
                    bind:value={newReview.comment}
                    required
                    rows="3"
                    placeholder="Share your experience..."
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
            </div>

            <button type="submit" class="glass-button-primary w-full">
                Submit Review
            </button>
        </form>
    {/if}

    <!-- Reviews List -->
    {#if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200">
            {error}
        </div>
    {:else if loading}
        <div class="flex justify-center">
            <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    {:else if reviews.length === 0}
        <div class="text-center py-8">
            <div class="text-gray-400 mb-4">No reviews yet</div>
            <p class="text-gray-500 text-sm">Be the first to share your experience!</p>
        </div>
    {:else}
        <div class="space-y-6">
            {#each reviews as review}
                <div class="glass-panel hover:bg-white/5 transition-colors">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span class="text-blue-300 text-lg">
                                    {review.patient_id.toString()[0].toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div class="flex-grow">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="flex">
                                    {#each Array(5) as _, i}
                                        <span class={i < review.rating ? 'text-yellow-400' : 'text-gray-600'}>
                                            ★
                                        </span>
                                    {/each}
                                </div>
                                <span class="text-sm text-gray-400">
                                    {formatDate(review.created_at)}
                                </span>
                            </div>
                            <p class="text-gray-300">{review.comment}</p>
                        </div>
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

    .glass-panel {
        @apply rounded-lg;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    textarea::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }
</style>
