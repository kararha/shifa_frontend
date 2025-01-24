import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const userCookie = cookies.get('user');
    
    console.log('Doctor layout user cookie:', userCookie);
    
    if (!userCookie) {
        console.log('No user cookie found, redirecting to login.');
        throw redirect(303, '/login');
    }

    const user = JSON.parse(userCookie);
    
    console.log('Doctor layout user role:', user.role);
    
    if (user.role !== 'doctor') {
        console.log('User role is not doctor, redirecting to login.');
        throw redirect(303, '/login');
    }

    return {
        user
    };
};
