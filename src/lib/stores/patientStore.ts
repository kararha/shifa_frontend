import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Patient } from '$lib/types';
import { authStore } from './authStore';
import { goto } from '$app/navigation';
import { API_BASE_URL } from '$lib/config';

function createPatientStore() {
    const { subscribe, set, update } = writable<{ patients: Patient[] }>({ patients: [] });

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

    const parseResponse = async (response: Response) => {
        try {
            const text = await response.text();
            console.log('Raw response:', text);
            
            if (!text) {
                throw new Error('Empty response from server');
            }

            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                console.error('Response text:', text);
                throw new Error('Invalid JSON response from server');
            }
        } catch (e) {
            console.error('Response parsing error:', e);
            throw new Error('Failed to read server response');
        }
    };

    return {
        subscribe,
        fetchPatients: async () => {
            try {
                const response = await fetch('/api/patients', {
                    headers: getHeaders(),
                    credentials: 'include',
                });
                
                if (response.status === 401) {
                    authStore.logout();
                    goto('/login');
                    throw new Error('401');
                }

                const data = await parseResponse(response);
                
                if (!response.ok) {
                    throw new Error(data?.message || 'Failed to fetch patients');
                }
                
                set({ patients: Array.isArray(data) ? data : [] });
            } catch (error: any) {
                console.error('Error fetching patients:', error);
                throw error;
            }
        },
        fetchPatient: async (userId: string) => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/patients/${userId}`, {
                    headers: getHeaders(),
                });

                if (!response.ok) {
                    const error = await parseResponse(response);
                    throw new Error(error?.message || 'Failed to fetch patient');
                }

                const data = await parseResponse(response);
                const patient = Array.isArray(data) ? data[0] : data;
                
                if (!patient) {
                    throw new Error('Patient not found');
                }

                update(state => ({
                    patients: [...state.patients.filter(p => p.user_id.toString() !== userId), patient]
                }));
                return patient;
            } catch (error) {
                console.error('Error fetching patient:', error);
                throw error;
            }
        },
        createPatient: async (patientData: Partial<Patient>) => {
            try {
                const response = await fetch('/api/patients', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(patientData),
                });

                if (!response.ok) {
                    const error = await parseResponse(response);
                    throw new Error(error.message || 'Failed to create patient');
                }

                const newPatient = await parseResponse(response);
                update(state => ({
                    patients: [...state.patients, newPatient]
                }));
                return newPatient;
            } catch (error) {
                console.error('Error creating patient:', error);
                throw error;
            }
        }
    };
}

export const patientStore = browser ? createPatientStore() : null;
