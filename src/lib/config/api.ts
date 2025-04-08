import { BACKEND_URL } from '$lib/constants';

export const API_CONFIG = {
  baseURL: BACKEND_URL,
  endpoints: {
    consultations: `${BACKEND_URL}/api/consultations`,
    consultationDetails: {
      byConsultationId: (consultationId: number | string) => 
        `${BACKEND_URL}/api/consultations/${consultationId}/details`,
      direct: (detailId: number | string) => 
        `${BACKEND_URL}/api/consultation-details/${detailId}`
    },
    chat: `${BACKEND_URL}/api/chat/messages`,
    patients: `${BACKEND_URL}/api/patients`,
    doctors: `${BACKEND_URL}/api/doctors`,
    payments: `${BACKEND_URL}/api/payments`,
    appointments: `${BACKEND_URL}/api/appointments`,
    reviews: `${BACKEND_URL}/api/reviews`,
    auth: `${BACKEND_URL}/api/auth`
  }
};
