import { register, init, waitLocale } from 'svelte-i18n';
import { browser } from '$app/environment';

let initialized = false;

export async function initI18n() {
    if (initialized) return;
    
    register('en', () => import('$lib/translations/en.json'));
    register('ar', () => import('$lib/translations/ar.json'));

    init({
        fallbackLocale: 'ar',
        initialLocale: 'ar'
    });

    // Always wait for Arabic locale in both browser and SSR
    await waitLocale('ar');
    
    initialized = true;
}

// Don't initialize for SSR to avoid race conditions
if (!browser) {
    initialized = true;
}
