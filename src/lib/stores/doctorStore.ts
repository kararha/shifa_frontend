import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { authStore } from './authStore';
import { goto } from '$app/navigation';

function createDoctorStore() {
    const { subscribe, set, update } = writable<{ doctors: any[] }>({ doctors: [] });

    const getHeaders = () => {
        const { token } = get(authStore);
        if (!token) {
            throw new Error('401');
        }
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    return {
        subscribe,
        fetchDoctor: async (doctorId: string) => {
            try {
                console.log('Attempting to fetch doctor:', doctorId);
                // Updated API path to match Go backend
                const response = await fetch(`/api/doctor/profile/${doctorId}`, {
                    headers: getHeaders(),
                    credentials: 'include'
                });

                console.log('Response status:', response.status);
                const text = await response.text();
                console.log('Raw response:', text);

                if (response.status === 404) {
                    throw new Error('Doctor profile not found');
                }

                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }

                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Parse error:', e);
                    throw new Error('Invalid response format');
                }

                const doctor = Array.isArray(data) ? data[0] : data;
                
                update(state => ({
                    doctors: [...state.doctors.filter(d => d.user_id?.toString() !== doctorId), doctor]
                }));

                return doctor;
            } catch (error) {
                console.error('Doctor fetch error:', error);
                throw error;
            }
        }
    };
}

export const doctorStore = browser ? createDoctorStore() : null;
