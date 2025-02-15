// src/lib/utils/api.ts
import { authStore } from '$lib/stores/authStore';
import { API_CONFIG } from '$lib/config/api';
import { get } from 'svelte/store';

interface APIError extends Error {
  status?: number;
  data?: any;
  responseText?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = get(authStore);
  const defaultHeaders: {
    'Content-Type': string;
    'Accept': string;
    'Authorization'?: string; // Make Authorization optional
  } = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (auth.token) {
    defaultHeaders['Authorization'] = `Bearer ${auth.token}`;
  }

  const requestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, requestOptions);

  let response: Response;
  let responseText: string = '';

  try {
    response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, requestOptions);

    console.log(`Response Status: ${response.status}`);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    responseText = await response.text();
    console.log('Raw Response Text:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = responseText ? JSON.parse(responseText) : {};
      } catch (jsonError) {
        console.error('Failed to parse error response as JSON', jsonError, responseText);
        errorData = { message: 'Failed to parse error response' };
      }

      const error = new Error(errorData?.error || errorData?.message || 'API request failed') as APIError;
      error.status = response.status;
      error.data = errorData;
      error.responseText = responseText;
      throw error;
    }

    if (response.headers.get('Content-Type')?.includes('application/json')) {
      return responseText ? JSON.parse(responseText) as T : ({} as T);
    } else {
      console.warn('Non-JSON response received, returning raw text');
      return responseText as any;
    }

  } catch (error) {
    const apiError = error as APIError;
    console.error('API Request Failed:', apiError);
    apiError.responseText = responseText;
    throw apiError;
  }
}