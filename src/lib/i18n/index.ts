import { i18n, currentLanguage, t, changeLanguage, currentTranslations } from '../stores/translations';

// Re-export all necessary items
export { i18n, currentLanguage, t, changeLanguage, currentTranslations };

// Add a function to initialize language settings
export function initializeLanguage(): void {
  // This can be called in the layout file to ensure language settings
  // are correctly applied when the app loads
  const htmlElement = document.documentElement;
  const currentLang = localStorage.getItem('language') || 'ar';
  
  // Set HTML attributes
  htmlElement.lang = currentLang;
  htmlElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  
  // Update the store
  changeLanguage(currentLang as 'en' | 'ar');
}