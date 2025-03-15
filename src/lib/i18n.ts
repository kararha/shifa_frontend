import { register, init, waitLocale, getLocaleFromNavigator } from 'svelte-i18n';
import { browser } from '$app/environment';

let initialized = false;

export async function initI18n() {
    if (initialized) return;
    
    register('en', () => import('$lib/translations/en.json'));
    register('ar', () => import('$lib/translations/ar.json'));

    init({
        fallbackLocale: 'ar',
        initialLocale: browser ? getLocaleFromNavigator() : 'ar'
    });

    if (browser) {
        await waitLocale('ar');
    }

    initialized = true;
}

// Initialize immediately for SSR
if (!browser) {
    initI18n();
}
