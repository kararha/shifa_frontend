<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let patientData = {
        user_id: '',
        name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    };

    let isSubmitting = false;
    let error = '';

    onMount(() => {
        const userId = localStorage.getItem('tempUserId');
        if (!userId) {
            goto('/register');
            return;
        }
        patientData.user_id = userId;
    });

    async function handleSubmit(event: Event) {
        event.preventDefault();
        isSubmitting = true;

        try {
            // Format date to match backend expectation
            const formattedData = {
                ...patientData,
                user_id: parseInt(patientData.user_id),
                date_of_birth: new Date(patientData.date_of_birth).toISOString()
            };

            const response = await fetch('http://localhost:8888/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to complete patient registration');
            }

            // Clean up and redirect
            localStorage.removeItem('tempUserId');
            await goto('/login?registered=true');

        } catch (err) {
            console.error('Registration error:', err);
            error = err instanceof Error ? err.message : 'Registration failed';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="max-w-2xl mx-auto p-6 glass-card mt-10">
    <h2 class="text-2xl font-bold mb-6 text-center text-white">Complete Patient Registration</h2>

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
        </div>
    {/if}

    <form on:submit={handleSubmit} class="space-y-6">
        <!-- Personal Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label for="date_of_birth" class="block mb-2">Date of Birth *</label>
                <input
                    type="date"
                    id="date_of_birth"
                    bind:value={patientData.date_of_birth}
                    class="w-full p-2 rounded"
                    required
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>

            <div>
                <label for="gender" class="block mb-2">Gender *</label>
                <select
                    id="gender"
                    bind:value={patientData.gender}
                    class="w-full p-2 rounded bg-white bg-opacity-20 text-white"
                    required
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div>
                <label for="phone" class="block mb-2">Phone Number *</label>
                <input
                    type="tel"
                    id="phone"
                    bind:value={patientData.phone}
                    class="w-full p-2 rounded"
                    required
                    
                    title="Please enter a valid phone number"
                />
            </div>

            <div class="md:col-span-2">
                <label for="address" class="block mb-2">Address *</label>
                <textarea
                    id="address"
                    bind:value={patientData.address}
                    rows="3"
                    class="w-full p-2 rounded"
                    required
                ></textarea>
            </div>
        </div>

        <!-- Emergency Contact -->
        <div class="border-t border-white/10 pt-6">
            <h3 class="text-lg font-semibold text-white mb-4">Emergency Contact</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="emergency_contact_name" class="block mb-2">Contact Name *</label>
                    <input
                        type="text"
                        id="emergency_contact_name"
                        bind:value={patientData.emergency_contact_name}
                        class="w-full p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label for="emergency_contact_phone" class="block mb-2">Contact Phone *</label>
                    <input
                        type="tel"
                        id="emergency_contact_phone"
                        bind:value={patientData.emergency_contact_phone}
                        class="w-full p-2 rounded"
                        required
                        
                        title="Please enter a valid phone number"
                    />
                </div>
            </div>
        </div>

        <button
            type="submit"
            class="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            disabled={isSubmitting}
        >
            {isSubmitting ? 'Completing Registration...' : 'Complete Registration'}
        </button>
    </form>
</div>

<style>
    .glass-card {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    input, textarea, select {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
    }

    input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.3);
    }

    label {
        color: rgba(255, 255, 255, 0.9);
    }

    select option {
        background-color: #2d3748;
        color: white;
        padding: 0.5rem;
    }

    /* Make date input text white */
    input[type="date"] {
        color-scheme: dark;
    }

    /* Placeholder styling */
    ::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }
</style>
