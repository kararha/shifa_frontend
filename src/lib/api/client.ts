import { authStore } from '../stores/authStore';  // Update this import
import { get } from 'svelte/store';

export const BASE_URL = 'http://localhost:8888/api';

export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

export const API_ENDPOINTS = {
    APPOINTMENTS: 'home-care-visits',  // Update to match Go backend
    PAYMENTS: 'transactions',          // Update to match Go backend
    DOCTORS: 'doctors',
    PATIENTS: 'patients',
    USERS: 'users'
} as const;

export class ApiClient {
    private static async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const token = get(authStore).token;
        // Remove any leading slashes to prevent double slashes
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        const url = `${BASE_URL}/${cleanEndpoint}`;
        
        console.log(`Fetching API endpoint:`, { url, token: !!token });

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'Authorization': token ? `Bearer ${token}` : '',
                    ...options.headers,
                }
            });

            // Handle 404s gracefully
            if (response.status === 404) {
                console.warn(`Endpoint ${endpoint} not found, using fallback`);
                if (endpoint.includes('home-care-visits')) {
                    return { data: [] as T };
                }
                if (endpoint.includes('transactions')) {
                    return { data: [] as T };
                }
                throw new Error(`Endpoint not found: ${endpoint}`);
            }

            const text = await response.text();
            console.log(`Response for ${endpoint}:`, {
                status: response.status,
                body: text
            });

            let data;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                console.warn(`Invalid JSON for ${endpoint}:`, text);
                return { data: [] as T };
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${text}`);
            }

            return { data: Array.isArray(data) ? data : (data?.data || data) };
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            return { data: [] as T }; // Return empty array on error
        }
    }

    static get<T>(endpoint: string) {
        return this.fetch<T>(endpoint);
    }

    static post<T>(endpoint: string, data: any) {
        return this.fetch<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static put<T>(endpoint: string, data: any) {
        return this.fetch<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static delete(endpoint: string) {
        return this.fetch(endpoint, { method: 'DELETE' });
    }
}

export const api = ApiClient;
