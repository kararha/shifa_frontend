export const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8888',
    prefix: '/api',
    endpoints: {
        consultations: '/api/consultations',
        auth: '/api/auth',
        users: '/api/users',
        homeCareVisits: '/api/home-care-visits',  // Updated to match backend route
        appointments: '/api/appointments'
    }
};
