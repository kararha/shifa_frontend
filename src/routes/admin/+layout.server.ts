import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, request }) => {
    const userCookie = cookies.get('user');
    
    console.log('Admin layout user cookie:', userCookie);
    console.log('Request cookies:', request.headers.get('cookie'));
    
    // If no cookie, just return an empty object and let the client-side do the redirect
    if (!userCookie) {
        console.log('No user cookie found, will check on client side');
        return {
            user: null,
            serverAuth: false
        };
    }

    try {
        const user = JSON.parse(userCookie);
        
        console.log('Admin layout user role:', user.role);
        
        if (user.role !== 'admin') {
            console.log('User is not admin, redirecting from server');
            throw redirect(303, '/login');
        }

        return {
            user,
            serverAuth: true
        };
    } catch (error) {
        if (error instanceof Response) throw error;
        console.error('Error parsing user cookie:', error);
        return {
            user: null,
            serverAuth: false
        };
    }
};
