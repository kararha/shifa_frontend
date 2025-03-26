import { initI18n } from '$lib/i18n';
import { currentLanguage, changeLanguage } from '$lib/stores/translations';
import { browser } from '$app/environment';

export const load = async () => {
    await initI18n();
    if (browser) {
        // Get stored language preference or default to Arabic
        const storedLang = localStorage.getItem('preferred-language') as 'en' | 'ar';
        const lang = storedLang || 'ar';
        
        // Change language and wait for it to be applied
        await changeLanguage(lang);
    }
    return {};
};
