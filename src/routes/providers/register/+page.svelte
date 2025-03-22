<script lang="ts">
    import { onMount } from 'svelte';
    import type { ServiceType } from '$lib/types';
    import { z } from 'zod';

    let loading = false;
    let errorMessage = '';
    let serviceTypes: ServiceType[] = [];
    let userId = '';
    
    // Update providerData structure to match backend model
    const providerData = {
        user_id: null as number | null,
        service_type_id: null as number | null,
        experience_years: 0,
        qualifications: '',
        bio: '',
        profile_picture_url: '',  // Added to match model
        hourly_rate: 0,
        rating: 0,               // Added to match model
        is_verified: false,      // Added to match model
        is_available: true,      // Added to match model
        status: 'active',        // Added to match model
        latitude: null as number | null,
        longitude: null as number | null
    };

    onMount(async () => {
        try {
            // Get stored credentials
            userId = localStorage.getItem('tempUserId');
            const token = localStorage.getItem('token');

            if (!userId) {
                throw new Error('User ID not found');
            }
            
            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Update the API endpoint path with proper headers
            const response = await fetch(`http://localhost:8888/api/service-types`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load service types: ${response.statusText}`);
            }

            const result = await response.json();
            serviceTypes = Array.isArray(result) ? result : result.data || [];

        } catch (error) {
            console.error('Initialization error:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
            
            // Clear invalid session data
            localStorage.removeItem('tempUserId');
            localStorage.removeItem('token');
            
            // Redirect to registration with error message
            window.location.href = '/register?error=session_expired';
        }
    });

    async function handleSubmit() {
        try {
            loading = true;
            errorMessage = '';
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Authentication token missing');
            }

            // Prepare request payload with proper type conversions
            const payload = {
                ...providerData,
                user_id: parseInt(userId),
                service_type_id: parseInt(providerData.service_type_id as unknown as string),
                experience_years: parseInt(providerData.experience_years as unknown as string),
                hourly_rate: parseFloat(providerData.hourly_rate as unknown as string),
                // Only include coordinates if they are provided
                ...(providerData.latitude && { latitude: parseFloat(providerData.latitude as unknown as string) }),
                ...(providerData.longitude && { longitude: parseFloat(providerData.longitude as unknown as string) })
            };

            console.log('Sending provider data:', payload);

            const response = await fetch('http://localhost:8888/api/providers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log('Registration response:', result);

            if (!response.ok) {
                throw new Error(result.message || 'Registration failed');
            }

            // Clear temporary storage
            localStorage.removeItem('tempUserId');
            localStorage.removeItem('token');

            // Redirect to login
            window.location.href = '/login?registered=true';

        } catch (error) {
            console.error('Registration error:', error);
            errorMessage = error instanceof Error ? error.message : 'Registration failed';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto glass-card">
        <h2 class="text-2xl font-bold text-center text-white mb-8">
            Complete Your Provider Profile
        </h2>

        {#if errorMessage}
            <div class="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {errorMessage}
            </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
            <div>
                <label for="service_type" class="block text-sm font-medium text-white">
                    Service Type
                </label>
                <select
                    id="service_type"
                    bind:value={providerData.service_type_id}
                    required
                    class="mt-1 block w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                >
                    <option value="">Select a service type</option>
                    {#each serviceTypes as type}
                        <option value={type.ID}>{type.Name}</option>
                    {/each}
                </select>
            </div>

            <div>
                <label for="experience" class="block text-sm font-medium text-white">
                    Years of Experience
                </label>
                <input
                    type="number"
                    id="experience"
                    bind:value={providerData.experience_years}
                    required
                    min="0"
                    class="mt-1 block w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                />
            </div>

            <div>
                <label for="qualifications" class="block text-sm font-medium text-white">
                    Qualifications
                </label>
                <textarea
                    id="qualifications"
                    bind:value={providerData.qualifications}
                    required
                    rows="3"
                    class="mt-1 block w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                ></textarea>
            </div>

            <div>
                <label for="bio" class="block text-sm font-medium text-white">
                    Bio
                </label>
                <textarea
                    id="bio"
                    bind:value={providerData.bio}
                    required
                    rows="3"
                    class="mt-1 block w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                ></textarea>
            </div>

            <div>
                <label for="hourly_rate" class="block text-sm font-medium text-white">
                    Hourly Rate ($)
                </label>
                <input
                    type="number"
                    id="hourly_rate"
                    bind:value={providerData.hourly_rate}
                    required
                    min="0"
                    step="0.01"
                    class="mt-1 block w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                />
            </div>

            <!-- Optional location fields -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="latitude" class="block text-sm font-medium text-white">
                        Latitude (optional)
                    </label>
                    <input
                        type="number"
                        id="latitude"
                        bind:value={providerData.latitude}
                        step="any"
                        placeholder="e.g. 40.7128"
                        class="mt-1 block w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                    />
                </div>
                <div>
                    <label for="longitude" class="block text-sm font-medium text-white">
                        Longitude (optional)
                    </label>
                    <input
                        type="number"
                        id="longitude"
                        bind:value={providerData.longitude}
                        step="any"
                        placeholder="e.g. -74.0060"
                        class="mt-1 block w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                class="w-full bg-blue-500/80 hover:bg-blue-500/90 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
                {loading ? 'Registering...' : 'Complete Registration'}
            </button>
        </form>
    </div>
</div>

<style>
    .glass-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }

    input::placeholder,
    textarea::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }

    input:focus,
    textarea:focus,
    select:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.15);
    }

    select option {
        background: #1a1a1a;
        color: white;
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
        .glass-card {
            padding: 1.5rem;
        }
    }
</style>
