<script lang="ts">
    import { i18n, currentLanguage } from '$lib/i18n';
    import { browser } from '$app/environment';

    function handleToggle() {
        i18n.toggleLanguage();
        if (browser) {
            window.location.reload();
        }
    }
</script>

<button 
    class="lang-switch" 
    on:click={handleToggle}
    aria-label={$currentLanguage === 'en' ? 'Switch to Arabic' : 'Switch to English'}>
    {$currentLanguage === 'en' ? 'العربية' : 'English'}
</button>

<style>
    .lang-switch {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .lang-switch:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
    }

    @media (max-width: 768px) {
        .lang-switch {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
        }
    }
</style>
