import { initializeLanguage } from '$lib/i18n';

export const load = () => {
    initializeLanguage();
    return {};
};

export const ssr = false;
