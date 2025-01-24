<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    interface ServiceType {
        ID: number;
        Name: string;
        Description: string;
        IsHomeCare: boolean;
    }

    let doctorData = {
        specialty: '',
        license_number: '', // Changed from licenseNumber
        experience_years: 0, // Changed from experienceYears
        consultation_fee: 0, // Changed from consultationFee
        service_type_id: 0, // Changed from serviceTypeId
        bio: '',
        qualifications: '',
        achievements: '',
        user_id: '',
        is_available: true, // Changed from isAvailable
        status: 'active'
    };

    let profilePicture: File | null = null;
    let serviceTypes: ServiceType[] = [];
    let serviceTypesError = '';
    let isSubmitting = false;
    let error = '';
    let imagePreview: string | null = null;

    onMount(async () => {
        const userId = localStorage.getItem('tempUserId');
        if (!userId) {
            goto('/register');
            return;
        }
        doctorData.user_id = userId;

        // Debug log for userId
        console.log('User ID from localStorage:', userId);

        // Fetch service types with better error handling
        try {
            const response = await fetch('http://localhost:8888/api/service-types', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            // Debug log for response
            console.log('Service Types Response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch service types: ${response.status}`);
            }

            const text = await response.text(); // Get response as text first
            console.log('Raw response:', text); // Debug log raw response

            try {
                const data = JSON.parse(text);
                console.log('Parsed data:', data); // Debug log parsed data
                
                // Handle both array and object responses
                if (Array.isArray(data)) {
                    serviceTypes = data;
                } else if (data.data && Array.isArray(data.data)) {
                    serviceTypes = data.data;
                } else {
                    throw new Error('Invalid data format');
                }

                console.log('Final serviceTypes:', serviceTypes); // Debug log final data
            } catch (parseError) {
                console.error('JSON Parse error:', parseError);
                throw new Error('Invalid JSON response from server');
            }
        } catch (err) {
            console.error('Service types error:', err);
            serviceTypesError = err instanceof Error ? err.message : 'Failed to load service types';
        }
    });

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            profilePicture = input.files[0];
            // Create preview URL
            imagePreview = URL.createObjectURL(input.files[0]);
        }
    }

    async function handleSubmit(event: Event) {
        event.preventDefault();
        
        // Validate service type
        if (!doctorData.service_type_id) {
            error = 'Please select a service type';
            return;
        }

        isSubmitting = true;

        try {
            const formData = new FormData();

            // Convert IDs to numbers and format data
            const dataToSend = {
                ...doctorData,
                service_type_id: parseInt(doctorData.service_type_id.toString()),
                user_id: parseInt(doctorData.user_id),
                experience_years: parseInt(doctorData.experience_years.toString()),
                consultation_fee: parseFloat(doctorData.consultation_fee.toString())
            };

            // Log the data being sent
            console.log('Data to send:', dataToSend);

            // Append all data to FormData
            Object.entries(dataToSend).forEach(([key, value]) => {
                formData.append(key, value.toString());
            });

            if (profilePicture) {
                formData.append('profile_picture', profilePicture);
            }

            const response = await fetch('http://localhost:8888/api/doctors', {
                method: 'POST',
                body: formData
            });

            // Log the raw response
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || 'Failed to complete doctor registration';
                } catch {
                    errorMessage = responseText || 'Failed to complete doctor registration';
                }
                throw new Error(errorMessage);
            }

            // Success - cleanup and redirect
            localStorage.removeItem('tempUserId');
            if (imagePreview) URL.revokeObjectURL(imagePreview);
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
    <h2 class="text-2xl font-bold mb-6 text-center text-white">Complete Doctor Registration</h2>

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
        </div>
    {/if}

    <form on:submit={handleSubmit} class="space-y-6">
        <!-- Profile Picture Upload -->
        <div class="text-center">
            <div class="mb-4">
                {#if imagePreview}
                    <img src={imagePreview} alt="Profile preview" class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white"/>
                {:else}
                    <div class="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                        <span class="text-gray-500">No image</span>
                    </div>
                {/if}
            </div>
            <label class="cursor-pointer bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all">
                Upload Profile Picture
                <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    on:change={handleFileChange}
                />
            </label>
        </div>

        <!-- Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label for="specialty">Specialty</label>
                <input
                    type="text"
                    id="specialty"
                    bind:value={doctorData.specialty}
                    required
                />
            </div>

            <div>
                <label for="serviceType" class="block mb-2">Service Type *</label>
                {#if serviceTypesError}
                    <p class="text-red-400 text-sm mb-2">{serviceTypesError}</p>
                {/if}
                <select
                    id="serviceType"
                    bind:value={doctorData.service_type_id}
                    class="w-full p-2 rounded bg-white bg-opacity-20 text-white"
                    required
                >
                    <option value={0}>Select a service type</option>
                    {#each serviceTypes as type (type.ID)}
                        <option value={type.ID}>
                            {type.Name} {type.Description ? `(${type.Description})` : ''}
                        </option>
                    {/each}
                </select>
                {#if serviceTypes.length === 0}
                    <p class="text-yellow-400 text-sm mt-1">
                        {serviceTypesError || 'Loading service types...'}
                    </p>
                {/if}
            </div>

            <div>
                <label for="license_number" class="block mb-2">License Number</label>
                <input
                    type="text"
                    id="license_number"
                    bind:value={doctorData.license_number}
                    class="w-full p-2 rounded"
                    required
                />
            </div>

            <div>
                <label for="experience_years" class="block mb-2">Years of Experience</label>
                <input
                    type="number"
                    id="experience_years"
                    bind:value={doctorData.experience_years}
                    class="w-full p-2 rounded"
                    required
                    min="0"
                />
            </div>

            <div>
                <label for="consultation_fee" class="block mb-2">Consultation Fee</label>
                <input
                    type="number"
                    id="consultation_fee"
                    bind:value={doctorData.consultation_fee}
                    class="w-full p-2 rounded"
                    required
                    min="0"
                />
            </div>
        </div>

        <!-- Professional Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label for="qualifications">Qualifications</label>
                <textarea
                    id="qualifications"
                    bind:value={doctorData.qualifications}
                    rows="3"
                    required
                ></textarea>
            </div>

            <div>
                <label for="achievements">Achievements</label>
                <textarea
                    id="achievements"
                    bind:value={doctorData.achievements}
                    rows="3"
                    required
                ></textarea>
            </div>
        </div>

        <!-- Bio -->
        <div>
            <label for="bio">Bio</label>
            <textarea
                id="bio"
                bind:value={doctorData.bio}
                rows="4"
                required
            ></textarea>
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

    input, textarea {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
    }

    input:focus, textarea:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.3);
    }

    label {
        color: rgba(255, 255, 255, 0.9);
    }

    select {
        width: 100%;
        padding: 0.5rem;
        background-color: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 0.375rem;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
        background-size: 1em;
        padding-right: 2.5rem;
    }

    select:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }

    select option {
        background-color: #2d3748;
        color: white;
        padding: 0.5rem;
    }

    textarea {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        width: 100%;
        padding: 0.5rem;
        border-radius: 0.375rem;
    }
</style>