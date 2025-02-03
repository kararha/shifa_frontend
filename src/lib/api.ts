export const BASE_URL = 'http://localhost:8888/api';

export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

export const API_ENDPOINTS = {
    appointments: '/appointments',
    users: '/users',
    doctors: '/doctors',
    patients: '/patients',
    payments: '/payments',
    auth: '/auth',
    serviceTypes: '/service-types',
    reviews: '/reviews',
    medicalHistories: '/medical-histories',
    consultations: '/consultations',
    notifications: '/notifications'
} as const;

export async function fetchWithAuth<T>(endpoint: keyof typeof API_ENDPOINTS, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    const url = `${BASE_URL}${API_ENDPOINTS[endpoint]}`;
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                ...options.headers,
            }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new Error(`Expected JSON response but got ${contentType}`);
        }

        const text = await response.text();
        let data = null;
        
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse response:', text);
            throw new Error('Invalid JSON response');
        }

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        // Your Go backend returns arrays directly, so wrap them in our response format
        return {
            data: Array.isArray(data) ? data : (data.data || data),
            message: data.message
        };
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
}

export async function checkServerStatus(): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/doctors`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        return response.status === 200;
    } catch (error) {
        console.error('Server check failed:', error);
        return false;
    }
}
