import { get } from 'svelte/store';
import { currentLanguage } from '$lib/store/i18n';
import { translateText } from '$lib/services/translation';
import type { TranslationQueue } from '$lib/services/translationQueue';

const TRANSLATABLE_FIELDS = [
  'name', 'description', 'bio', 'qualifications', 
  'specialty', 'title', 'address', 'notes'
];

async function translateObject(obj: any, targetLang: 'en' | 'ar'): Promise<any> {
  const translatedObj = { ...obj };

  try {
    await Promise.all(
      Object.entries(obj).map(async ([key, value]) => {
        if (typeof value === 'string' && TRANSLATABLE_FIELDS.includes(key)) {
          console.debug(`Translating field "${key}"`);
          translatedObj[key] = await translateText(value, targetLang);
        } else if (Array.isArray(value)) {
          translatedObj[key] = await Promise.all(
            value.map(item => 
              typeof item === 'string' 
                ? translateText(item, targetLang)
                : translateObject(item, targetLang)
            )
          );
        } else if (value && typeof value === 'object') {
          translatedObj[key] = await translateObject(value, targetLang);
        }
      })
    );

    return translatedObj;
  } catch (error) {
    console.error('Translation error for object:', error);
    return obj; // Return original on error
  }
}

export async function fetchWithTranslation<T>(url: string, options?: RequestInit): Promise<T> {
  console.debug(`Fetching with translation: ${url}`);
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  const currentLang = get(currentLanguage);
  
  console.debug(`Translating response to ${currentLang}`);

  try {
    if (Array.isArray(data)) {
      return Promise.all(
        data.map(item => translateObject(item, currentLang))
      ) as Promise<T>;
    }
    
    return translateObject(data, currentLang) as Promise<T>;
  } catch (error) {
    console.error('Translation failed:', error);
    return data; // Return original data if translation fails
  }
}

// Add rate limiting helper
let lastTranslationTime = 0;
const RATE_LIMIT_DELAY = 500; // 500ms between translations

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastTranslation = now - lastTranslationTime;
  
  if (timeSinceLastTranslation < RATE_LIMIT_DELAY) {
    await new Promise(resolve => 
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastTranslation)
    );
  }
  
  lastTranslationTime = Date.now();
}
