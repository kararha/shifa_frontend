// src/routes/reviews/+page.svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import type { Review } from '$lib/types';
    import ReviewForm from '$lib/components/reviews/ReviewForm.svelte';
    import ReviewList from '$lib/components/reviews/ReviewList.svelte';
    import { reviewStore } from '$lib/stores/reviewStore';

    let reviews: Review[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            await reviewStore.fetchReviews();
            reviews = $reviewStore.reviews;
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    async function createReview(reviewData: Partial<Review>) {
        try {
            await reviewStore.createReview(reviewData);
        } catch (err) {
            error = err.message;
        }
    }
</script>

{#if loading}
    <p>Loading reviews...</p>
{:else if error}
    <p>Error: {error}</p>
{:else}
    <div class="reviews-page">
        <h1>Reviews</h1>
        <ReviewForm on:submit={createReview} />
        <ReviewList {reviews} />
    </div>
{/if}

// src/lib/types.ts (add to existing file)
export interface Review {
    id?: number;
    doctorId: number;
    patientId: number;
    rating: number;
    comment: string;
}

// src/lib/stores/reviewStore.ts
import { writable } from 'svelte/store';
import type { Review } from '$lib/types';
import { api } from '$lib/api';

function createReviewStore() {
    const { subscribe, set, update } = writable({
        reviews: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        fetchReviews: async () => {
            try {
                const response = await api.get('/reviews');
                update(store => ({ ...store, reviews: response.data }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        createReview: async (reviewData: Partial<Review>) => {
            try {
                const response = await api.post('/reviews', reviewData);
                update(store => ({
                    ...store, 
                    reviews: [...store.reviews, response.data]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const reviewStore = createReviewStore();