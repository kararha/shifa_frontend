<script lang="ts">
    import { page } from '$app/stores';
    import ReviewList from '$lib/reviews/ReviewList.svelte';
    // ...existing imports...

    // Get the ID from the URL params
    $: providerId = $page.params.id;
    
    // Add validation and logging
    $: if (providerId) {
        console.log('Provider ID from URL:', providerId);
    }
</script>

<!-- ...existing code... -->

<div class="mt-8">
    <ReviewList 
        entityId={providerId}
        entityType="home-care-provider"
    />
</div>

<!-- ...existing code... -->
