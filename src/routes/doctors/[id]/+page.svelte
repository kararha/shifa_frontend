<!-- src/routes/doctors/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import AppointmentForm from '$lib/components/appointments/AppointmentForm.svelte';
  import ReviewList from '$lib/reviews/ReviewList.svelte'; // Fix import path
  import ConsultationForm from '$lib/consultations/ConsultationForm.svelte';
  import ReviewForm from '$lib/reviews/ReviewForm.svelte';
  import 'tailwindcss/tailwind.css';
  import { DEFAULT_DOCTOR_AVATAR, BACKEND_URL } from '$lib/constants';

  interface Doctor {
    id: number;
    user_id: number;
    name: string;
    specialty: string;
    service_type_id: number;
    license_number: string;
    experience_years: number;
    qualifications: string;
    achievements: string;
    bio: string;
    profile_picture_url: string;
    consultation_fee: number;
    rating: number;
    is_verified: boolean;
    is_available: boolean;
    status: string;
    created_at: string;
    service_type: {
      ID: number;
      Name: string;
      Description: string;
    };
    average_rating?: number;
    total_reviews?: number;
  }

  let doctor: Doctor | null = null;
  let loading = true; // Change initial loading state to true
  let error = '';
  let showAppointmentModal = false;
  let showConsultationModal = false;
  let showReviewModal = false;
  let imageError = false;
  let isOwnProfile = false;

  onMount(async () => {
    try {
      console.log('Fetching doctor with ID:', $page.params.id);
      
      // Use BACKEND_URL from constants instead of hardcoded URL
      const response = await fetch(`${BACKEND_URL}/api/doctors/${$page.params.id}`);
      console.log('Doctor API response:', response); // Debug log
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to fetch doctor details: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Doctor data:', data); // Debug log
      
      if (!data) {
        throw new Error('No doctor data received');
      }

      doctor = data;
      loading = false; // Set loading to false after data is set

      if (doctor?.profile_picture_url) {
        const img = new Image();
        img.onerror = () => {
          imageError = true;
        };
        img.src = doctor.profile_picture_url;
      } else {
        imageError = true;
      }

      // Check if this is the doctor's own profile
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      console.log('Doctor profile loaded:', {
        doctorId: $page.params.id,
        userData: localStorage.getItem('user')
      });

      // Set isOwnProfile
      isOwnProfile = userData.role === 'doctor' && userData.id === doctor?.user_id;

    } catch (e) {
      error = (e as Error).message;
      console.error('Error fetching doctor:', e);
    } finally {
      loading = false;
    }
  });

  function getImageUrl(profileUrl: string | null | undefined): string {
    if (!profileUrl) return DEFAULT_DOCTOR_AVATAR;
    if (profileUrl.startsWith('http')) return profileUrl;
    return `${BACKEND_URL}${profileUrl}`;
  }

  $: displayImage = (!doctor?.profile_picture_url || imageError) 
    ? DEFAULT_DOCTOR_AVATAR 
    : getImageUrl(doctor.profile_picture_url);
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
  {#if error}
    <div class="max-w-4xl mx-auto mb-6" transition:fade>
      <div class="bg-red-50 border-l-4 border-red-400 p-4">
        <p class="text-sm text-red-700">{error}</p>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  {:else if doctor}
    <div class="max-w-7xl mx-auto glass-card" transition:fade>
      <!-- Header Section -->
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="flex items-center">
          <div class="relative">
            <img
              src={displayImage}
              alt={doctor?.name || 'Doctor'}
              class="w-32 h-32 rounded-full object-cover border-4 border-white"
              on:error={() => {
                imageError = true;
              }}
            />
            {#if doctor.is_verified}
              <span class="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full">
                <svg class="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a 1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
              </span>
            {/if}
          </div>
          <div class="ml-6">
            <h1 class="text-3xl font-bold text-white">Dr. {doctor.name}</h1>
            <p class="text-xl text-blue-300">{doctor.specialty}</p>
            {#if doctor.average_rating}
              <div class="flex items-center mt-2">
                <div class="flex">
                  {#each Array(5) as _, i}
                    <span class={i < Math.round(doctor.average_rating) ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                  {/each}
                </div>
                <span class="text-white ml-2">
                  {doctor.average_rating.toFixed(1)} ({doctor.total_reviews} reviews)
                </span>
              </div>
            {/if}
          </div>
        </div>
        <div class="mt-4 md:mt-0 flex flex-col items-end">
          <span class="text-2xl font-bold text-white">${doctor.consultation_fee}/consultation</span>
          <span class={`px-3 py-1 rounded-full text-sm mt-2 
            ${doctor.is_available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {doctor.is_available ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {#if isOwnProfile}
        <div class="flex justify-end mb-4">
          <a 
            href="/doctors/dashboard"
            class="dashboard-link"
          >
            View Dashboard
          </a>
        </div>
      {/if}

      <!-- Main Content -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Left Column -->
        {#if doctor}
          <div class="col-span-2 space-y-6">
            <div class="glass-panel">
              <h2 class="text-xl font-semibold text-white mb-4">About</h2>
              <p class="text-gray-300">{doctor.bio}</p>
            </div>

            <div class="glass-panel">
              <h2 class="text-xl font-semibold text-white mb-4">Qualifications</h2>
              <p class="text-gray-300">{doctor.qualifications}</p>
            </div>

            <div class="glass-panel">
              <h2 class="text-xl font-semibold text-white mb-4">Achievements</h2>
              <p class="text-gray-300">{doctor.achievements}</p>
            </div>
          </div>
        {/if}

        <!-- Right Column -->
        <div class="space-y-6">
          <div class="glass-panel">
            <h2 class="text-xl font-semibold text-white mb-4">Professional Info</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-400">Experience</span>
                <span class="text-white">{doctor.experience_years} years</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">License</span>
                <span class="text-white">{doctor.license_number}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Service Type</span>
                <span class="text-white">{doctor.service_type?.Name || 'N/A'}</span>
              </div>
            </div>
          </div>

          <button
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 
              transition-colors duration-200 font-semibold text-lg shadow-lg disabled:opacity-50"
            disabled={!doctor.is_available}
            on:click={() => showAppointmentModal = true}
          >
            Book Appointment
          </button>

          <button
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 
              transition-colors duration-200 font-semibold text-lg shadow-lg disabled:opacity-50"
            disabled={!doctor.is_available}
            on:click={() => showConsultationModal = true}
          >
            Start Consultation
          </button>
        </div>
      </div>

      <!-- Reviews Section -->
      {#if doctor?.id}
        <div class="mt-8 glass-panel">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-white">Reviews</h2>
            {#if !isOwnProfile}
              <button
                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
                on:click={() => showReviewModal = true}
              >
                Write a Review
              </button>
            {/if}
          </div>
          <ReviewList 
            entityId={doctor.id.toString()}
            entityType="doctor"
          />
        </div>
      {/if}

    </div>

    <AppointmentForm
      bind:show={showAppointmentModal}
      doctorId={parseInt($page.params.id)}
      doctorName={doctor.name}
      on:appointmentCreated={() => {
        showAppointmentModal = false;
      }}
    />

    <ConsultationForm
      bind:show={showConsultationModal}
      doctorId={$page.params.id}
      doctorName={doctor.name}
      consultationFee={doctor.consultation_fee}
      on:consultationCreated={() => {
        showConsultationModal = false;
      }}
    />

    {#if showReviewModal}
      <ReviewForm
        doctorId={doctor.id.toString()}
        on:submit={() => showReviewModal = false}
        on:close={() => showReviewModal = false}
      />
    {/if}
  {/if}
</div>

<style>
  .glass-card {
    padding: 1.5rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  .glass-panel {
    padding: 1rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dashboard-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: rgba(37, 99, 235, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.5);
    border-radius: 0.5rem;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    transition: all 0.2s ease-in-out;
  }

  .dashboard-link:hover {
    background: rgba(37, 99, 235, 0.9);
    transform: translateY(-1px);
  }

  :global(.glass-card input),
  :global(.glass-card select) {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
  }

  :global(.glass-card input:focus),
  :global(.glass-card select:focus) {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.15);
  }

  :global(body) {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    min-height: 100vh;
  }

  .glass-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: rgba(59, 130, 246, 0.5);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 0.5rem;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    transition: all 0.2s ease-in-out;
  }

  .glass-button:hover {
    background: rgba(59, 130, 246, 0.7);
    transform: translateY(-1px);
  }

  .glass-button-primary {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: rgba(37, 99, 235, 0.8);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(59, 130, 246, 0.5);
    border-radius: 0.5rem;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    text-decoration: none;
    transition: all 0.2s ease-in-out;
  }

  .glass-button-primary:hover {
    background: rgba(37, 99, 235, 0.9);
    transform: translateY(-1px);
  }

  :global(.review-section button) {
    opacity: 1 !important;
    visibility: visible !important;
    display: block !important;
  }

  :global(.review-button) {
    display: inline-block !important;
    background-color: rgb(37, 99, 235) !important;
    color: white !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.5rem !important;
    font-weight: 600 !important;
  }
</style>