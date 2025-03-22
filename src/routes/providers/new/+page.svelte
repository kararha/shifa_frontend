<!-- // src/routes/register/provider/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  interface ServiceType {
    id: number;
    name: string;
  }

  let currentStep = 1;
  let loading = false;
  let errorMessage = '';
  let serviceTypes: ServiceType[] = [];
  
  // User form data
  let userData = {
    email: '',
    password: '',
    name: '',
    role: 'home_care_provider'
  };
  
  // Provider form data
  let providerData = {
    id: '',
    experience_years: '',
    qualifications: '',
    bio: '',
    hourly_rate: '',
    latitude: '',
    longitude: '',
    service_type_id: '',
    user_id: ''
  };

  onMount(async () => {
    try {
      // Get stored user ID
      const userId = localStorage.getItem('tempUserId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        throw new Error('Registration session expired');
      }

      providerData.user_id = userId;

      // Updated service types fetch
      const response = await fetch(`http://localhost:8888/api/api/service-types`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load service types: ${response.statusText}`);
      }

      const result = await response.json();
      serviceTypes = Array.isArray(result) ? result : result.data || [];

      console.log('Loaded service types:', serviceTypes);

    } catch (error) {
      console.error('Error:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
    }
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    errorMessage = '';

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(providerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete registration');
      }

      // Clear temporary storage
      localStorage.removeItem('tempUserId');
      localStorage.removeItem('token');

      // Redirect to login
      window.location.href = '/login?registered=true';

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Registration failed';
    } finally {
      loading = false;
    }
  }

  function nextStep() {
    if (currentStep < 2) currentStep++;
  }

  function prevStep() {
    if (currentStep > 1) currentStep--;
  }
</script>

<div class="min-h-screen  py-12 px-4 sm:px-6 lg:px-8 mt-10">
  <div class="blob"></div>
  <div class="max-w-md mx-auto glass-card rounded-lg shadow-md overflow-hidden">
    <div class="px-6 py-8">
      <h2 class="text-2xl font-bold text-center text-white mb-8">
        Home Care Provider Registration
      </h2>

      {#if errorMessage}
        <div class="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {errorMessage}
        </div>
      {/if}

      <div class="mb-8">
        <div class="flex justify-between">
          <div class={`h-1 w-1/2 ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div class={`h-1 w-1/2 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
        </div>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        {#if currentStep === 1}
          <!-- Step 1: Basic Information -->
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-white">Full Name</label>
              <input
                type="text"
                id="name"
                bind:value={userData.name}
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-white">Email</label>
              <input
                type="email"
                id="email"
                bind:value={userData.email}
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-white">Password</label>
              <input
                type="password"
                id="password"
                bind:value={userData.password}
                required
                minlength="8"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        {:else}
          <!-- Step 2: Provider Information -->
          <div class="space-y-4">
            <div>
              <label for="service_type" class="block text-sm font-medium text-white">Service Type</label>
              <select
                id="service_type"
                bind:value={providerData.service_type_id}
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a service type</option>
                {#each serviceTypes as type}
                  <option value={type.id}>{type.name}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="experience" class="block text-sm font-medium text-white">Years of Experience</label>
              <input
                type="number"
                id="experience"
                bind:value={providerData.experience_years}
                required
                min="0"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label for="qualifications" class="block text-sm font-medium text-white">Qualifications</label>
              <textarea
                id="qualifications"
                bind:value={providerData.qualifications}
                required
                rows="3"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div>
              <label for="bio" class="block text-sm font-medium text-white">Bio</label>
              <textarea
                id="bio"
                bind:value={providerData.bio}
                required
                rows="3"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div>
              <label for="hourly_rate" class="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
              <input
                type="number"
                id="hourly_rate"
                bind:value={providerData.hourly_rate}
                required
                min="0"
                step="0.01"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        {/if}

        <div class="flex justify-between mt-8">
          {#if currentStep > 1}
            <button
              type="button"
              on:click={prevStep}
              class="bg-gray-200 text-white px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Previous
            </button>
          {:else}
            <div></div>
          {/if}

          {#if currentStep < 2}
            <button
              type="button"
              on:click={nextStep}
              class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Next
            </button>
          {:else}
            <button
              type="submit"
              disabled={loading}
              class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          {/if}
        </div>
      </form>
    </div>
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

  .glass-button {
    @apply px-6 py-2 rounded-lg font-semibold text-white;
    background: rgba(59, 130, 246, 0.5);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease-in-out;
  }

  .glass-button:hover {
    background: rgba(59, 130, 246, 0.7);
    transform: translateY(-1px);
  }

  :global(.glass-card input),
  :global(.glass-card select) {
    @apply bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2;
  }

  :global(.glass-card input:focus),
  :global(.glass-card select:focus) {
    @apply outline-none border-white/30 bg-white/20;
  }
</style>