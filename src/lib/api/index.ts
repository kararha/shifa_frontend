import type { User } from '$lib/types';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const BASE_URL = '/api'; // Uses Vite proxy configuration

async function handleResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        if (response.status === 401) {
            // Handle unauthorized access
            if (browser) {
                goto('/login');
            }
        }
        throw new Error(data.error || 'API Error');
    }

    return data;
}

export const api = {
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        return handleResponse(response);
    },

    async post<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    async login(email: string, password: string) {
        return this.post('/auth/login', { email, password });
    },

    async register(userData: Partial<User>) {
        return this.post('/auth/register', userData);
    },

    // New methods for the backend API
    async createDoctor(doctor: any) {
        return this.post('/doctors', doctor);
    },

    async listDoctors(filters?: any) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.get(`/doctors?${queryParams}`);
    },

    async getDoctor(id: number) {
        return this.get(`/doctors/${id}`);
    },

    async updateDoctor(id: number, doctorData: any) {
        return this.post(`/doctors/${id}`, doctorData);
    },

    async createAppointment(appointment: any) {
        return this.post('/appointments', appointment);
    },

    async getAppointment(id: number) {
        return this.get(`/appointments/${id}`);
    },

    async updateAppointment(id: number, appointment: any) {
        return this.post(`/appointments/${id}`, appointment);
    },

    async deleteAppointment(id: number) {
        return this.post(`/appointments/${id}`, { method: 'DELETE' });
    },

    async listAppointments(params?: any) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/appointments?${queryString}`);
    }
};
