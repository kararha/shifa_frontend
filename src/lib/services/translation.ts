const LIBRETRANSLATE_API = 'https://translate.argosopentech.com';  // Free LibreTranslate instance

// Simple in-memory cache
const translationCache = new Map<string, { [key: string]: string }>();

export async function translateText(text: string, targetLang: 'en' | 'ar', sourceLang?: string): Promise<string> {
  if (!text?.trim()) return '';

  // Generate cache key
  const cacheKey = `${text}_${targetLang}`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)[targetLang];
  }

  try {
    const response = await fetch(`${LIBRETRANSLATE_API}/translate`, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: sourceLang || 'auto',
        target: targetLang,
        format: 'text'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    const translatedText = data.translatedText;

    // Cache the result
    translationCache.set(cacheKey, {
      [targetLang]: translatedText
    });

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}
