import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { locale } from 'svelte-i18n';

type Language = 'en' | 'ar';

// Set the default language to Arabic
export const currentLanguage: Writable<Language> = writable('ar');
export const documentDirection: Writable<'ltr' | 'rtl'> = writable('ltr');

// Initialize language based on browser or stored preference
export function initializeLanguage() {
    // Check localStorage first
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang) {
        setLanguage(storedLang);
        return;
    }

    // Force Arabic as default
    setLanguage('ar');
}

export async function setLanguage(lang: Language) {
    currentLanguage.set(lang);
    documentDirection.set(lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', lang);
    
    // Set locale and wait for translations
    locale.set(lang);
    await waitLocale(lang);
}
