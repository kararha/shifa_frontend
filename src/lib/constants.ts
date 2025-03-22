export const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
export const DEFAULT_DOCTOR_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';

// Backend URL for profile images
export const BACKEND_URL = 'http://localhost:8888';

export const API_VERSION = 'v1';
export const API_ENDPOINTS = {
    DOCTORS: '/v1/doctors',
    PATIENTS: '/v1/patients',
    APPOINTMENTS: '/v1/appointments',
    TRANSACTIONS: '/v1/transactions',
    AUTH: '/v1/auth',
    USERS: '/v1/users'
} as const;

export interface FileUploadResponse {
    url: string;
    message: string;
}

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

// Add a helper function to get complete profile picture URL
export function getProfilePictureUrl(url: string | null | undefined): string {
    if (!url) return DEFAULT_AVATAR;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
}
