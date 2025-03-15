import { setLanguage } from '$lib/store/i18n';

export function detectUserLanguage(): 'en' | 'ar' {
    const storedLang = localStorage.getItem('language');
    if (storedLang === 'ar' || storedLang === 'en') {
        return storedLang;
    }
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ar' ? 'ar' : 'en';
}

export { setLanguage };