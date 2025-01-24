// src/lib/api/appointmentApi.ts
import { apiClient } from '../utils/api';

export interface Appointment {
    id?: number;
    patientId: number;
    doctorId: number;
    date: string;
    time: string;
    status: string;
}

export async function createAppointment(appointment: Appointment) {
    return apiClient('/appointments', {
        method: 'POST',
        body: JSON.stringify(appointment)
    });
}

export async function getAppointment(id: number) {
    return apiClient(`/appointments/${id}`);
}

export async function updateAppointment(id: number, appointment: Partial<Appointment>) {
    return apiClient(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(appointment)
    });
}

export async function deleteAppointment(id: number) {
    return apiClient(`/appointments/${id}`, {
        method: 'DELETE'
    });
}

export async function listAppointments(params?: Record<string, string>) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient(`/appointments?${queryString}`);
}