import type { RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { API_BASE_URL } from '$lib/config';

// Basic user schema for first registration step
const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.enum(['doctor', 'patient', 'home_care_provider', 'admin'])
});

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();
        const validatedData = userSchema.parse(data);

        // First step: Create user
        const userResponse = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedData)
        });

        if (!userResponse.ok) {
            const error = await userResponse.text();
            return new Response(error, { status: userResponse.status });
        }

        const userData = await userResponse.json();

        // Include token in response
        return new Response(JSON.stringify({
            success: true,
            message: 'User registered successfully',
            user: userData.user,
            token: userData.token // Make sure backend provides this
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({
                error: 'Validation failed',
                details: error.errors
            }), { status: 400 });
        }

        return new Response(JSON.stringify({
            error: 'Registration failed'
        }), { status: 500 });
    }
};
