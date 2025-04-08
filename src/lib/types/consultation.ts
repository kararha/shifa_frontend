export interface Consultation {
    id?: number;
    patient_id: number;
    doctor_id: number;
    status: 'requested' | 'in_progress' | 'completed' | 'cancelled';
    started_at?: string;
    completed_at?: string;
    fee: number;
    is_paid?: boolean;
    created_at?: string;
    updated_at?: string;
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

// Align with the consultation_details table structure exactly
export interface ConsultationDetails {
    id?: number;
    consultation_id: number;
    request_details?: string;
    symptoms?: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    // Note: The database schema doesn't have follow_up_date, but we'll keep it for frontend use
    follow_up_date?: string;
    created_at?: string;
    updated_at?: string;
}