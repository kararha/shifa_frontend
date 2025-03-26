import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { register, init, getLocaleFromNavigator, waitLocale } from 'svelte-i18n';

export type SupportedLanguages = 'en' | 'ar';

export const currentLanguage = writable<SupportedLanguages>('ar');
export const documentDirection = derived(
    currentLanguage,
    $lang => $lang === 'ar' ? 'rtl' : 'ltr'
);

// Initialize translations with both languages
register('en', () => import('$lib/translations/en.json'));
register('ar', () => import('$lib/translations/ar.json'));

// Create a derived store for current translations
export const currentTranslations = derived(
    currentLanguage,
    ($currentLang, set) => {
        const loadTranslations = async () => {
            try {
                const module = await import(`$lib/translations/${$currentLang}.json`);
                set(module.default);
            } catch (error) {
                console.error('Failed to load translations:', error);
            }
        };
        loadTranslations();
    }
);

export function initializeTranslations() {
    if (!browser) return;
    
    const storedLang = localStorage.getItem('preferred-language') as SupportedLanguages;
    if (storedLang) {
        changeLanguage(storedLang);
    } else {
        changeLanguage('ar');
    }
}

// Language change handler
export async function changeLanguage(lang: SupportedLanguages): Promise<void> {
    if (!browser) return;

    try {
        // Update language
        currentLanguage.set(lang);
        
        // Update HTML attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        
        // Store preference
        localStorage.setItem('preferred-language', lang);
        
        // Initialize i18n
        init({
            fallbackLocale: 'ar',
            initialLocale: lang
        });
        
        // Wait for locale to be loaded
        await waitLocale(lang);
        
    } catch (error) {
        console.error('Language change error:', error);
    }
}
