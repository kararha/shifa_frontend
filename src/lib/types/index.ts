export interface User {
    id: number;
    name: string;
    email: string;
    role: 'patient' | 'doctor' | 'admin';
    profile_picture_url?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface Patient {
    user_id: number;
    name: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    address: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    medical_histories?: MedicalHistory[];
}

export interface Doctor {
    id: number;
    user_id: number;
    name: string;
    specialty: string;
    service_type_id: number;
    license_number: string;
    experience_years: number;
    qualifications: string;
    achievements: string;
    bio: string;
    profile_picture_url: string;
    consultation_fee: number;
    rating: number;
    is_verified: boolean;
    is_available: boolean;
    status: string;
    service_type: ServiceType;
}

export interface Appointment {
    id: number;
    doctor_id: number;
    patient_id: number;
    appointment_datetime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    reason: string;
    doctor?: Doctor;
    patient?: Patient;
}

export interface MedicalHistory {
    id: number;
    patient_id: number;
    condition: string;
    diagnosis: string;
    treatment: string;
    date_diagnosed: string;
    medications: string;
    notes: string;
}

export interface Review {
    id: number;
    reviewer_id: number;
    doctor_id: number;
    rating: number;
    comment: string;
    created_at: string;
}

export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    consultation_id: number;
    content: string;
    created_at: string;
    is_read: boolean;
}

export interface Consultation {
    id: number;
    appointment_id: number;
    start_time: string;
    end_time?: string;
    notes: string;
    status: 'active' | 'completed' | 'cancelled';
    doctor?: Doctor;
    patient?: Patient;
}

export interface ServiceType {
    ID: number;
    Name: string;
    Description: string;
    IsHomeCare: boolean;
}

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}
