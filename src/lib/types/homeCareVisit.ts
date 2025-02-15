export interface HomeCareVisit {
    id?: number;
    patient_id: number;
    provider_id: number;
    address: string;
    latitude: number;
    longitude: number;
    duration_hours: number;
    special_requirements: string;
    status: string;
}

export interface HomeCareVisitFilter {
    patient_id?: number;
    provider_id?: number;
    status?: string;
}
