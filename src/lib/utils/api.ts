// src/lib/utils/api.ts
import { get } from 'svelte/store';
import { authStore } from '../stores/authStore';

export const BASE_URL = 'http://localhost:8888/api';

export async function apiClient(endpoint: string, options: RequestInit = {}) {
    const token = get(authStore).token;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorBody}`);
    }

    return response.json();
}