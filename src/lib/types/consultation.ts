export interface Consultation {
    id?: number;
    patient_id: number;
    doctor_id: number;
    status: string;
    started_at?: string;
    completed_at?: string;
    fee: number;
}

export interface ConsultationFilter {
    patient_id?: number;
    doctor_id?: number;
    status?: string;
    start_date_from?: string;
    start_date_to?: string;
    completed_date_from?: string;
    completed_date_to?: string;
}