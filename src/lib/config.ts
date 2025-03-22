export const API_BASE_URL = 'http://localhost:8888';

// Development flag for additional logging
export const DEV_MODE = process.env.NODE_ENV === 'development';

// API endpoints
export const API_ENDPOINTS = {
    SERVICE_TYPES: '/api/service-types',
    PROVIDERS: '/api/providers',
    AUTH: '/api/auth'
};