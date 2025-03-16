import { browser } from '$app/environment';

const LIBRETRANSLATE_API = 'https://translate.argosopentech.com';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  translations: { [key: string]: string };
  timestamp: number;
}

// Use localStorage for persistent cache in browser
const cache = browser ? new Map<string, CacheEntry>(
  JSON.parse(localStorage.getItem('translationCache') || '[]')
) : new Map();

export async function translateText(text: string, targetLang: 'en' | 'ar', sourceLang?: string): Promise<string> {
  if (!text?.trim()) return '';

  console.debug(`Translation request: "${text}" to ${targetLang}`);
  
  // Detect if text is already in target language
  if (isArabic(text) && targetLang === 'ar') {
    console.debug('Text already in Arabic, skipping translation');
    return text;
  }
  
  const cacheKey = `${text}_${targetLang}`;
  const cached = cache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
    console.debug('Using cached translation');
    return cached.translations[targetLang];
  }

  try {
    console.debug('Fetching translation from API');
    const response = await fetch(`${LIBRETRANSLATE_API}/translate`, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: sourceLang || detectLanguage(text),
        target: targetLang,
        format: 'text'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.debug(`Translated text: "${data.translatedText}"`);
    
    // Update cache
    cache.set(cacheKey, {
      translations: { [targetLang]: data.translatedText },
      timestamp: Date.now()
    });

    if (browser) {
      localStorage.setItem('translationCache', JSON.stringify([...cache]));
    }

    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

function isArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
}

function detectLanguage(text: string): string {
  return isArabic(text) ? 'ar' : 'en';
}
