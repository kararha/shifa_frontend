<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';
    import MedicalHistoryList from '$lib/components/MedicalHistoryList.svelte';

    let patient: any = null;
    let loading = true;
    let error: string | null = null;
    let showEditModal = false;

    onMount(async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');

            console.log('Token:', token);
            console.log('User data:', userData);

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${BACKEND_URL}/api/patients/${$page.params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load patient data');
            }

            patient = await response.json();
            console.log('Patient data loaded:', patient);

        } catch (err) {
            console.error('Error:', err);
            error = err instanceof Error ? err.message : 'Failed to load patient';
            
            // Redirect to login if authentication fails
            if (err instanceof Error && err.message.includes('authentication')) {
                localStorage.clear();
                window.location.href = '/login';
            }
        } finally {
            loading = false;
        }
    });
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    {#if loading}
        <div class="flex justify-center items-center h-64" transition:fade>
            <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    {:else if error}
        <div class="glass-panel bg-red-500/10 border-red-500/20 text-red-200 mb-8" transition:fade>
            <p>{error}</p>
            <button class="glass-button mt-4" on:click={() => window.location.href = '/login'}>
                Return to Login
            </button>
        </div>
    {:else if patient}
        <div class="max-w-7xl mx-auto" transition:fade>
            <!-- Header Section -->
            <div class="glass-card mb-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-3xl font-bold text-white">Patient Profile</h1>
                    <button class="glass-button" on:click={() => showEditModal = true}>
                        Edit Profile
                    </button>
                </div>

                <!-- Basic Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-4">
                        <div>
                            <h2 class="text-xl font-semibold text-white mb-4">Personal Information</h2>
                            <div class="space-y-2">
                                <p class="text-gray-300">Name: <span class="text-white">{patient.name}</span></p>
                                <p class="text-gray-300">Email: <span class="text-white">{patient.email}</span></p>
                                <p class="text-gray-300">Phone: <span class="text-white">{patient.phone}</span></p>
                                <p class="text-gray-300">Date of Birth: <span class="text-white">
                                    {new Date(patient.date_of_birth).toLocaleDateString()}
                                </span></p>
                                <p class="text-gray-300">Gender: <span class="text-white">{patient.gender}</span></p>
                                <p class="text-gray-300">Blood Type: <span class="text-white">{patient.blood_type}</span></p>
                            </div>
                        </div>

                        <div>
                            <h2 class="text-xl font-semibold text-white mb-4">Emergency Contact</h2>
                            <div class="space-y-2">
                                <p class="text-gray-300">Name: <span class="text-white">{patient.emergency_contact_name}</span></p>
                                <p class="text-gray-300">Phone: <span class="text-white">{patient.emergency_contact_phone}</span></p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h2 class="text-xl font-semibold text-white mb-4">Medical Information</h2>
                            <div class="space-y-2">
                                <div class="glass-panel">
                                    <h3 class="text-white font-semibold mb-2">Medical History</h3>
                                    <p class="text-gray-300">{patient.medical_history || 'No medical history recorded'}</p>
                                </div>
                                <div class="glass-panel">
                                    <h3 class="text-white font-semibold mb-2">Allergies</h3>
                                    <p class="text-gray-300">{patient.allergies || 'No allergies recorded'}</p>
                                </div>
                                <div class="glass-panel">
                                    <h3 class="text-white font-semibold mb-2">Current Medications</h3>
                                    <p class="text-gray-300">{patient.current_medications || 'No current medications'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Additional Sections (e.g., Appointments, Medical Records) can be added here -->
            <!-- Medical History Section -->
            <MedicalHistoryList patientId={$page.params.id} />
        </div>
    {/if}
</div>

<style>
    .glass-card {
        @apply p-6 rounded-xl;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .glass-panel {
        @apply p-4 rounded-lg mb-4;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .glass-button {
        @apply px-4 py-2 rounded-lg text-white font-semibold;
        background: rgba(59, 130, 246, 0.5);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(59, 130, 246, 0.3);
        transition: all 0.2s ease-in-out;
    }

    .glass-button:hover {
        background: rgba(59, 130, 246, 0.7);
        transform: translateY(-1px);
    }
</style>
