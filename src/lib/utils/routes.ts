type UserRole = 'admin' | 'doctor' | 'patient' | 'home_care_provider';

export const roleRoutes: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    doctor: '/doctors',
    patient: '/patients',
    home_care_provider: '/providers'
};

export const getRouteForRole = (role: string): string => {
    return roleRoutes[role as UserRole] || '/login';
};
