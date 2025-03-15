import { currentLanguage } from '$lib/store/i18n';
import { get } from 'svelte/store';
import en from '$lib/translations/en.json';
import ar from '$lib/translations/ar.json';
import { t as svelteT } from 'svelte-i18n';
import { register, init, getLocaleFromNavigator, waitLocale } from 'svelte-i18n'; // Ensure waitLocale is imported

type TranslationKey = string;

const translations = {
    en,
    ar
};

register('en', () => import('$lib/translations/en.json'));
register('ar', () => import('$lib/translations/ar.json'));

export function setLanguage(locale: string) {
  init({
    fallbackLocale: 'en',
    initialLocale: locale || getLocaleFromNavigator(),
  });
  waitLocale(); // Ensure waitLocale is called
}

export const t = svelteT;

export function formatDate(date: Date): string {
    const lang = get(currentLanguage);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

export function formatNumber(num: number): string {
    const lang = get(currentLanguage);
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(num);
}

export function formatCurrency(amount: number): string {
    const lang = get(currentLanguage);
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: 'SAR'
    }).format(amount);
}
