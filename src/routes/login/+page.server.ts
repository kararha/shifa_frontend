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
    default: async ({ request, fetch }) => {
        try {
            const data = await request.formData();
            const email = data.get('email')?.toString();
            const password = data.get('password')?.toString();

            if (!email || !password) {
                return fail(400, { error: 'Missing email or password' });
            }

            console.log('Making login request to:', `${PUBLIC_API_URL}/api/auth/login`);

            const response = await fetch(`${PUBLIC_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            console.log('Login response:', result);

            if (!response.ok) {
                console.error('Login failed:', result.error);
                return fail(response.status, { error: result.error || 'Login failed' });
            }

            // Validate response structure
            if (!result.user || !result.token) {
                console.error('Invalid response structure:', result);
                return fail(500, { error: 'Invalid server response' });
            }

            return {
                success: true,
                data: {
                    user: result.user,
                    token: result.token
                }
            };
        } catch (error) {
            console.error('Server error:', error);
            return fail(500, { error: 'Server error occurred' });
        }
    }
} satisfies Actions;
