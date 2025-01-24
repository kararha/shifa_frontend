import type { RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { baseUserSchema, patientSchema, doctorSchema } from '$lib/validation';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json() as { role?: string };
        let parsedData;

        switch (data.role) {
            case 'patient':
                parsedData = patientSchema.parse(data);
                break;
            case 'doctor':
                parsedData = doctorSchema.parse(data);
                break;
            default:
                parsedData = baseUserSchema.parse(data);
        }

        // Mock user registration logic
        console.log('Parsed registration data:', parsedData);
        // Simulate saving user data
        const userId = 'generated-user-id'; // Simulated user ID

        return new Response(JSON.stringify({ 
            message: 'Registration successful',
            userId 
        }), { 
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ 
                error: 'Validation failed',
                details: error.errors 
            }), { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        return new Response(JSON.stringify({ 
            error: 'Internal server error' 
        }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
