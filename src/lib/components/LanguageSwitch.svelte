<script lang="ts">
import { currentLanguage, changeLanguage } from '$lib/stores/translations';

function toggleLanguage() {
    const newLang = $currentLanguage === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
}
</script>

<button
    class="lang-switch"
    on:click={toggleLanguage}
    aria-label="Switch language"
>
    {$currentLanguage === 'en' ? 'العربية' : 'English'}
</button>

<style>
    .lang-switch {
        padding: 0.5rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .lang-switch:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
    }
</style>
