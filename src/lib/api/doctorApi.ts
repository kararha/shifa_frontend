// src/lib/api/doctorApi.ts
import { apiClient } from '../utils/api';

export interface Doctor {
    id?: number;
    userId: number;
    specialization: string;
    qualifications: string[];
    availability: {
        days: string[];
        startTime: string;
        endTime: string;
    };
    consultationFee: number;
}

export async function createDoctor(doctor: Doctor) {
    return apiClient('/doctors', {
        method: 'POST',
        body: JSON.stringify(doctor)
    });
}

export async function listDoctors(filters?: {
    specialization?: string;
    availability?: string;
}) {
    const queryParams = new URLSearchParams(filters);
    return apiClient(`/doctors?${queryParams}`);
}

export async function getDoctor(id: number) {
    return apiClient(`/doctors/${id}`);
}

export async function updateDoctor(id: number, doctorData: Partial<Doctor>) {
    return apiClient(`/doctors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(doctorData)
    });
}