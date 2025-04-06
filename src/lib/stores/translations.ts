import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import arTranslations from '../translations/ar.json';
import enTranslations from '../translations/en.json';

export type Language = 'en' | 'ar';

export interface TranslationStore {
  currentLanguage: Language;
  translations: Record<string, any>;
}

// Initialize with both translation sets
const translations = {
  en: enTranslations,
  ar: arTranslations
};

function createTranslationStore() {
  const initialLang = browser ? 
    (localStorage.getItem('language') as Language || 'ar') : 'ar';

  const { subscribe, set, update } = writable<TranslationStore>({
    currentLanguage: initialLang,
    translations: translations[initialLang]
  });

  const translationStore = {
    subscribe,
    setLanguage: (lang: Language) => {
      update(state => ({
        currentLanguage: lang,
        translations: translations[lang]
      }));
      if (browser) {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('language', lang);
      }
    },
    toggleLanguage: () => {
      update(state => {
        const newLang = state.currentLanguage === 'ar' ? 'en' : 'ar';
        if (browser) {
          document.documentElement.lang = newLang;
          document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
          localStorage.setItem('language', newLang);
        }
        return {
          currentLanguage: newLang,
          translations: translations[newLang]
        };
      });
    }
  };

  return translationStore;
}

export const i18n = createTranslationStore();

export const currentLanguage = derived(
  i18n,
  $store => $store.currentLanguage
);

// Add the missing currentTranslations export
export const currentTranslations = derived(
  i18n,
  $store => $store.translations
);

// Create a reactive translation function
export const t = derived(
  i18n,
  ($store) => (key: string, params?: Record<string, string | number>) => {
    let text = key.split('.').reduce((obj, k) => obj?.[k], $store.translations) || key;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, String(value));
      });
    }
    
    return text;
  }
);

// Add the missing changeLanguage function
export function changeLanguage(language: Language): void {
  if (!['en', 'ar'].includes(language)) {
    console.error(`Unsupported language: ${language}`);
    return;
  }
  
  // Update the store
  i18n.setLanguage(language);
  
  // Store the preference in localStorage if in browser
  if (browser) {
    localStorage.setItem('language', language);
    
    // Update document direction based on language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }
}
