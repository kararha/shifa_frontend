import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { translations as defaultTranslations } from '../i18n/translations';

export type SupportedLanguages = 'en' | 'ar' | 'fr' | 'es';

export const currentLanguage = writable<SupportedLanguages>('en');
export const translations = writable(defaultTranslations);

// Create a derived store for current translations
export const currentTranslations = derived(
  [translations, currentLanguage],
  ([$translations, $currentLang]) => $translations[$currentLang] || $translations.en
);

// Initialize translations
export function initializeTranslations(): void {
  if (!browser) return;
  
  try {
    // Get stored language preference
    const storedLang = localStorage.getItem('preferred-language');
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs: SupportedLanguages[] = ['en', 'ar', 'fr', 'es'];
    
    // Determine language
    const lang = storedLang && supportedLangs.includes(storedLang as SupportedLanguages)
      ? storedLang as SupportedLanguages
      : supportedLangs.includes(browserLang as SupportedLanguages)
        ? browserLang as SupportedLanguages
        : 'en';
    
    changeLanguage(lang);
  } catch (error) {
    console.error('Failed to initialize translations:', error);
    changeLanguage('en');
  }
}

// Language change handler
export function changeLanguage(lang: SupportedLanguages): void {
  if (!browser) return;

  try {
    // Update language
    currentLanguage.set(lang);
    localStorage.setItem('preferred-language', lang);
    document.documentElement.lang = lang;
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  } catch (error) {
    console.error('Language change error:', error);
  }
}
