export function formatNumber(num: number, locale: 'en' | 'ar'): string {
    if (locale === 'ar') {
        // Convert to Arabic numerals
        return new Intl.NumberFormat('ar-SA').format(num);
    }
    return num.toString();
}

export function formatDate(date: Date, locale: 'en' | 'ar'): string {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

export function formatCurrency(amount: number, locale: 'en' | 'ar'): string {
    const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: 'SAR'
    });
    return formatter.format(amount);
}
