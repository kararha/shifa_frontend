import { translateText } from './translation';

interface TranslationJob {
  text: string;
  targetLang: 'en' | 'ar';
  field: string;
  id: string;
}

class TranslationQueue {
  private queue: TranslationJob[] = [];
  private processing = false;
  private cache = new Map<string, { ar: string; en: string }>();

  async addToQueue(text: string, field: string, id: string): Promise<void> {
    // Skip if already in cache
    const cacheKey = `${id}_${field}`;
    if (this.cache.has(cacheKey)) {
      return;
    }

    // Add translation jobs for both languages
    this.queue.push(
      { text, targetLang: 'ar', field, id },
      { text, targetLang: 'en', field, id }
    );

    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const job = this.queue.shift();

    try {
      const translated = await translateText(job.text, job.targetLang);
      
      // Cache the result
      const cacheKey = `${job.id}_${job.field}`;
      const existing = this.cache.get(cacheKey) || { ar: '', en: '' };
      this.cache.set(cacheKey, {
        ...existing,
        [job.targetLang]: translated
      });

    } catch (error) {
      console.error('Translation failed:', error);
    }

    // Process next job
    setTimeout(() => this.processQueue(), 1000); // Rate limiting
  }

  getTranslation(id: string, field: string): { ar: string; en: string } | null {
    const cacheKey = `${id}_${field}`;
    return this.cache.get(cacheKey) || null;
  }
}

export const translationQueue = new TranslationQueue();
