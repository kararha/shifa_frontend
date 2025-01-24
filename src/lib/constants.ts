export const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
export const DEFAULT_DOCTOR_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';

// Backend URL for profile images
export const BACKEND_URL = 'http://localhost:8888';

// Add better fetch with timeout and error handling
export async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const timeout = 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      }
    });
    clearTimeout(id);

    if (!response.ok) {
      const text = await response.text();
      console.error('Server error:', text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (e) {
    clearTimeout(id);
    console.error('Fetch error:', e);
    throw e;
  }
}
