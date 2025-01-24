import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

interface LoginResponse {
    token: string;
    refresh_token: string;
    user: {
        id: number;
        email: string;
        name: string;
        role: string;
    };
    message?: string;
    error?: string;
}

export const actions = {
    default: async ({ request, fetch, cookies }) => {
        try {
            const data = await request.formData();
            const email = data.get('email')?.toString();
            const password = data.get('password')?.toString();

            if (!email || !password) {
                return fail(400, { error: 'Missing email or password' });
            }

            const response = await fetch(`${PUBLIC_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result: LoginResponse = await response.json();

            if (!response.ok) {
                return fail(response.status, { error: result.error || 'Login failed' });
            }

            // Set cookies on successful login
            cookies.set('token', result.token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            cookies.set('user', JSON.stringify(result.user), {
                path: '/',
                httpOnly: false // Allow JS access
            });

            console.log('Cookies set:', {
                token: result.token,
                user: result.user
            });

            // Return success with user data for client-side redirect
            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            return fail(500, { error: 'Server error occurred' });
        }
    }
} satisfies Actions;
