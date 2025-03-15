import { initI18n } from '$lib/i18n';

export const load = async () => {
    await initI18n();
    return {};
};
