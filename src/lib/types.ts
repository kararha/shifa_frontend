export interface Doctor {
  user_id: number;
  name?: string;
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
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}
