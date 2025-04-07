import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

export const actions = {
    default: async ({ request, fetch, cookies }) => {
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

            // Set cookies for server-side authentication
            cookies.set('token', result.token, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            
            // Set user data in cookie for server components
            cookies.set('user', JSON.stringify(result.user), {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            // Add admin redirect flag to return data for client-side handling
            if (result.user.role === 'admin') {
                console.log('Admin user detected, preparing client redirect');
                // Return success with redirect info instead of throwing redirect
                return {
                    success: true,
                    user: result.user,
                    token: result.token,
                    refresh_token: result.refresh_token,
                    adminRedirect: true
                };
            }

            // Return a consistent data structure for non-admin users
            return {
                success: true,
                user: result.user,
                token: result.token,
                refresh_token: result.refresh_token
            };
        } catch (error) {
            console.error('Server error:', error);
            return fail(500, { error: 'Server error occurred' });
        }
    }
} satisfies Actions;
