import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const userCookie = cookies.get('user');
    
    console.log('Admin layout user cookie:', userCookie);
    
    if (!userCookie) {
        throw redirect(303, '/login');
    }

    const user = JSON.parse(userCookie);
    
    console.log('Admin layout user role:', user.role);
    
    if (user.role !== 'admin') {
        throw redirect(303, '/login');
    }

    return {
        user
    };
};
