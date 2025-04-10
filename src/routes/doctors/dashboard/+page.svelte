<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { BACKEND_URL } from '$lib/constants';
    import DoctorAvailability from '$lib/components/DoctorAvailability.svelte';
    import { goto } from '$app/navigation';
    import { t } from '$lib/utils/i18n';
    import { currentLanguage, currentTranslations } from '$lib/stores/translations';
    import ConsultationChat from '$lib/chat/ConsultationChat.svelte';

    interface Appointment {
        id: number;
        patient_id: number;
        provider_type: string;
        appointment_date: string;
        start_time: string;
        end_time: string;
        status: string;
        cancellation_reason?: string;
        created_at: string;
        updated_at: string;
        doctor_id?: number;
        home_care_provider_id?: number;
    }

    let appointments: Appointment[] = [];
    let loading = true;
    let error: string | null = null;
    let selectedDate = new Date().toISOString().split('T')[0];
    let activeTab: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';

    // Get doctor ID from stored user data
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const doctorId = userData.id;

    // New reactive variables for global listing
    let allAvailabilities = [];
    let loadingAllAvailabilities = true;
    let errorAllAvailabilities: string | null = null;

    // Doctor data (can be replaced with actual data from your API/store)
    let doctor = {
        id: 'doctor-123',
        name: 'Dr. Mohammed Ahmed',
        specialty: 'Cardiologist',
        patients: []
    };

    // Active consultations (in a real app, fetch this from your backend)
    let consultations = [
        {
            id: 'consultation-1',
            patientId: 'patient-1',
            patientName: 'Ahmed Hassan',
            status: 'active',
            startedAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        },
        {
            id: 'consultation-2',
            patientId: 'patient-2',
            patientName: 'Sara Ali',
            status: 'waiting',
            startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            lastUpdate: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
        }
    ];

    // Currently selected consultation
    let selectedConsultation = consultations[0];

    // Function to select a consultation
    function selectConsultation(consultation) {
        selectedConsultation = consultation;
    }

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const timeString = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (isToday) {
            return `Today at ${timeString}`;
        } else if (isYesterday) {
            return `Yesterday at ${timeString}`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }) + ` at ${timeString}`;
        }
    }

    onMount(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (!token || !user) {
            goto('/login');
            return;
        }

        if (user.role !== 'doctor') {
            goto('/login');
            return;
        }

        // Check if doctor is logged in (in a real app)
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userData = localStorage.getItem('user');

        if (isLoggedIn && userData) {
            try {
                const user = JSON.parse(userData);
                if (user.role === 'doctor') {
                    doctor = user;
                } else {
                    // Redirect non-doctors
                    goto('/login');
                }
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        } else {
            // Redirect to login
            goto('/login');
        }
    });

    onMount(async () => {
        await loadAppointments();
        loadAllAvailabilities();
    });

    // Format date for API requests
    function formatDateForApi(date: string): string {
        return new Date(date).toISOString().split('T')[0];
    }

    async function loadAppointments() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                error = 'Authentication token not found';
                goto('/login');
                return;
            }

            const formattedDate = formatDateForApi(selectedDate);
            console.log('Loading appointments for:', {
                doctorId,
                date: formattedDate,
            });

            // Updated URL to use the correct query parameters
            const response = await fetch(
                `${BACKEND_URL}/api/appointments?type=doctor&providerId=${doctorId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received appointments:', data);

            appointments = data.map((apt: Appointment) => ({
                ...apt,
                start_time: apt.start_time?.substring(0, 5) || '',
                end_time: apt.end_time?.substring(0, 5) || '',
                appointment_date: formatDateForApi(apt.appointment_date)
            }));

            error = null;
        } catch (err) {
            console.error('Load appointments error:', err);
            error = err instanceof Error ? err.message : 'Failed to load appointments';
        } finally {
            loading = false;
        }
    }

    async function updateAppointmentStatus(appointmentId: number, newStatus: string, reason?: string) {
        try {
            const token = localStorage.getItem('token');
            const appointment = appointments.find(apt => apt.id === appointmentId);
            if (!appointment) {
                throw new Error('Appointment not found');
            }

            // Format date and times properly and build a full RFC3339 datetime
            const formattedDate = new Date(appointment.appointment_date).toISOString().split('T')[0];
            const fullDate = formattedDate + "T00:00:00Z"; // Append default time

            const formattedStartTime = `${appointment.start_time}:00`;
            const formattedEndTime = `${appointment.end_time}:00`;

            const payload = {
                status: newStatus,
                provider_type: 'doctor',
                patient_id: appointment.patient_id,
                doctor_id: appointment.doctor_id,
                appointment_date: fullDate,
                start_time: formattedStartTime,
                end_time: formattedEndTime
                // Remove or include service_type_id as needed
            };

            if (reason) {
                payload.cancellation_reason = reason;
            }

            const response = await fetch(`${BACKEND_URL}/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update appointment');
            }

            await loadAppointments();
        } catch (err) {
            console.error('Update appointment error:', err);
            error = err instanceof Error ? err.message : 'Failed to update appointment';
        }
    }

    async function handleCancel(appointmentId: number) {
        const reason = window.prompt('Please enter a reason for cancellation:');
        if (reason !== null) { // Only proceed if user didn't click Cancel
            await updateAppointmentStatus(appointmentId, 'cancelled', reason);
        }
    }

    // Function to load availability for this specific doctor
    async function loadAllAvailabilities() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                errorAllAvailabilities = 'Authentication token not found';
                return;
            }
            // Change fetch URL to specific doctor's endpoint using doctorId
            const response = await fetch(`${BACKEND_URL}/api/doctors/${doctorId}/availability`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            // Optionally format times if needed
            allAvailabilities = data.map(slot => ({
                ...slot,
                start_time: new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                end_time: new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            errorAllAvailabilities = null;
        } catch (err) {
            errorAllAvailabilities = err instanceof Error ? err.message : 'Failed to load availabilities';
        } finally {
            loadingAllAvailabilities = false;
        }
    }

    // Reload appointments when date changes
    $: {
        if (selectedDate) {
            console.log('Date changed, reloading appointments:', selectedDate);
            loadAppointments();
        }
    }

    $: filteredAppointments = appointments.filter(apt => {
        const isMatchingTab = 
            (activeTab === 'upcoming' && ['scheduled', 'pending'].includes(apt.status)) ||
            (activeTab === 'completed' && apt.status === 'completed') ||
            (activeTab === 'cancelled' && apt.status === 'cancelled');

        const isMatchingDate = apt.appointment_date === selectedDate;
        return isMatchingTab && isMatchingDate;
    });

    function formatTime(time: string): string {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    $: translations = $currentTranslations;
</script>

<div class="dashboard-page">
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Doctor Dashboard</h1>
      <div class="doctor-info">
        <span class="doctor-name">{doctor.name}</span>
        <span class="doctor-specialty">{doctor.specialty}</span>
      </div>
    </header>

    <div class="dashboard-grid">
      <!-- Left Sidebar: Appointments Management -->
      <div class="dashboard-section appointments-section glass-panel">
        <h2 class="section-title">Appointments</h2>
        
        <!-- Date Selector -->
        <div class="flex-row date-selector">
          <input
            type="date"
            bind:value={selectedDate}
            class="glass-input"
          />
        </div>

        <!-- Tabs -->
        <div class="tab-buttons">
          {#each ['upcoming', 'completed', 'cancelled'] as tab}
            <button
              class="tab-button"
              class:active={activeTab === tab}
              on:click={() => activeTab = tab as 'upcoming' | 'completed' | 'cancelled'}
            >
              {$currentTranslations.doctorDashboard.appointments.tabs[tab]}
            </button>
          {/each}
        </div>
        
        <!-- Appointments List -->
        <div class="appointments-container">
          {#if loading}
            <div class="loading-container">
              <div class="spinner"></div>
              <span>Loading appointments...</span>
            </div>
          {:else if error}
            <div class="error-message">
              <p>{$currentTranslations.doctorDashboard.appointments.error}</p>
            </div>
          {:else if filteredAppointments.length === 0}
            <div class="empty-message">
              <p>{$currentTranslations.doctorDashboard.appointments.noAppointments}</p>
            </div>
          {:else}
            <div class="appointments-list">
              {#each filteredAppointments as appointment}
                <div class="appointment-card">
                  <div class="appointment-header">
                    <h3 class="patient-name">{appointment.patient_name || 'Patient'}</h3>
                    <span class="status-badge status-{appointment.status}">
                      {appointment.status}
                    </span>
                  </div>
                  <div class="appointment-time">
                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </div>
                  <div class="appointment-type">
                    {appointment.type || 'Regular consultation'}
                  </div>
                  {#if appointment.notes}
                    <div class="appointment-notes">{appointment.notes}</div>
                  {/if}
                  {#if ['scheduled', 'pending'].includes(appointment.status)}
                    <div class="appointment-actions">
                      <button
                        class="action-button complete-button"
                        on:click={() => updateAppointmentStatus(appointment.id, 'completed')}
                      >
                        Complete
                      </button>
                      <button
                        class="action-button cancel-button"
                        on:click={() => handleCancel(appointment.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Middle Section: Consultations & Chat -->
      <div class="dashboard-section chat-section glass-panel">
        <div class="consultation-header">
          <h2 class="section-title">Active Consultations</h2>
        </div>
        
        <div class="chat-layout">
          <div class="consultation-list">
            {#each consultations as consultation}
              <div 
                class="consultation-item"
                class:active={selectedConsultation?.id === consultation.id}
                on:click={() => selectConsultation(consultation)}
              >
                <div class="consultation-info">
                  <div class="patient-name">{consultation.patientName}</div>
                  <div class="flex-row space-between">
                    <div class="consultation-time">
                      {formatDate(consultation.startedAt)}
                    </div>
                    <div class="status-indicator" class:active={consultation.status === 'active'}>
                      {consultation.status}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
            
            {#if consultations.length === 0}
              <div class="empty-message">
                <p>No active consultations at the moment.</p>
              </div>
            {/if}
          </div>
          
          <div class="chat-area">
            {#if selectedConsultation}
              <div class="selected-consultation-header">
                <h3>Consultation with {selectedConsultation.patientName}</h3>
                <div class="selected-consultation-meta">
                  <span>Started: {formatDate(selectedConsultation.startedAt)}</span>
                </div>
              </div>
              
              <div class="chat-wrapper">
                <ConsultationChat 
                  consultationId={selectedConsultation.id} 
                  userRole="doctor"
                  doctorId={doctor.id}
                  doctorName={doctor.name}
                />
              </div>
              
              <div class="patient-info-panel">
                <h4>Patient Information</h4>
                <div class="patient-info-content">
                  <p><strong>Name:</strong> {selectedConsultation.patientName}</p>
                  <p><strong>ID:</strong> {selectedConsultation.id}</p>
                </div>
              </div>
            {:else}
              <div class="empty-message centered">
                <p>Select a consultation from the list to begin</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Right Sidebar: Availability Management -->
      <div class="dashboard-section availability-section glass-panel">
        <h2 class="section-title">Availability</h2>
        
        {#if loadingAllAvailabilities}
          <div class="loading-container">
            <div class="spinner small"></div>
            <span>Loading availability...</span>
          </div>
        {:else if errorAllAvailabilities}
          <div class="error-message">
            <p>{errorAllAvailabilities}</p>
          </div>
        {:else if allAvailabilities.length === 0}
          <div class="empty-message">
            <p>No availability slots found.</p>
          </div>
        {:else}
          <div class="availability-list">
            {#each allAvailabilities as slot}
              <div class="availability-slot">
                <div class="slot-day">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.day_of_week]}</div>
                <div class="slot-time">{slot.start_time} - {slot.end_time}</div>
              </div>
            {/each}
          </div>
        {/if}
        
        <!-- Simplified availability management -->
        <div class="availability-manager">
          <h4 class="subsection-title">Add Availability</h4>
          <DoctorAvailability {doctorId} />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-page {
    min-height: 100vh;
    background: rgba(13, 15, 48, 0.95);
    padding: 2rem 1rem;
  }
  
  .dashboard-container {
    max-width: 1800px;
    margin: 0 auto;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(123, 157, 255, 0.2);
  }
  
  .dashboard-header h1 {
    font-size: 2rem;
    margin: 0;
    color: white;
    text-shadow: 0 0 15px rgba(123, 157, 255, 0.4);
  }
  
  .doctor-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .doctor-name {
    font-weight: bold;
    font-size: 1.2rem;
    color: white;
  }
  
  .doctor-specialty {
    font-size: 0.9rem;
    color: rgba(123, 157, 255, 0.9);
  }
  
  .dashboard-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }
  
  .dashboard-section {
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    min-height: 400px; /* Minimum height for sections */
    max-height: 600px; /* Maximum height for sections */
  }
  
  .glass-panel {
    background: rgba(13, 15, 48, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(123, 157, 255, 0.2);
    box-shadow: 0 8px 32px rgba(13, 15, 48, 0.2);
    margin-bottom: 1.5rem;
  }
  
  .section-title {
    font-size: 1.4rem;
    color: white;
    margin: 0 0 1rem 0;
    padding: 1.25rem;
    border-bottom: 1px solid rgba(123, 157, 255, 0.2);
  }
  
  .subsection-title {
    font-size: 1.1rem;
    color: white;
    margin: 1rem 0;
  }
  
  .flex-row {
    display: flex;
    align-items: center;
  }
  
  .space-between {
    justify-content: space-between;
  }
  
  /* Appointments Section */
  .appointments-section {
    display: flex;
    flex-direction: column;
  }
  
  .date-selector {
    padding: 0 1.25rem 1rem;
  }
  
  .glass-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(123, 157, 255, 0.3);
    border-radius: 8px;
    color: white;
    padding: 0.75rem 1rem;
    width: 100%;
  }
  
  .glass-input:focus {
    outline: none;
    border-color: rgba(123, 157, 255, 0.5);
    box-shadow: 0 0 0 2px rgba(123, 157, 255, 0.1);
  }
  
  .tab-buttons {
    display: flex;
    padding: 0 1.25rem 1rem;
    gap: 0.5rem;
  }
  
  .tab-button {
    padding: 0.5rem 1rem;
    background: rgba(123, 157, 255, 0.1);
    border: 1px solid rgba(123, 157, 255, 0.2);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .tab-button:hover {
    background: rgba(123, 157, 255, 0.2);
  }
  
  .tab-button.active {
    background: rgba(123, 157, 255, 0.3);
    border-color: rgba(123, 157, 255, 0.4);
  }
  
  .appointments-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 1.25rem 1.25rem;
  }
  
  .appointments-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .appointment-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }
  
  .appointment-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    border-color: rgba(123, 157, 255, 0.2);
  }
  
  .appointment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .appointment-time {
    font-size: 0.9rem;
    color: rgba(123, 157, 255, 0.9);
    margin-bottom: 0.25rem;
  }
  
  .appointment-type {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.5rem;
  }
  
  .appointment-notes {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
    padding: 0.5rem;
    border-radius: 8px;
    margin: 0.5rem 0;
  }
  
  .appointment-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  
  .action-button {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .complete-button {
    background: rgba(16, 185, 129, 0.2);
    color: rgb(16, 185, 129);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  
  .complete-button:hover {
    background: rgba(16, 185, 129, 0.3);
  }
  
  .cancel-button {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(239, 68, 68);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  .cancel-button:hover {
    background: rgba(239, 68, 68, 0.3);
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .status-scheduled { 
    background: rgba(59, 130, 246, 0.2);
    color: rgb(147, 197, 253);
  }
  
  .status-completed { 
    background: rgba(16, 185, 129, 0.2);
    color: rgb(16, 185, 129);
  }
  
  .status-cancelled { 
    background: rgba(239, 68, 68, 0.2);
    color: rgb(239, 68, 68);
  }
  
  .status-pending { 
    background: rgba(245, 158, 11, 0.2);
    color: rgb(245, 158, 11);
  }
  
  /* Chat Section */
  .chat-section {
    overflow: hidden;
  }
  
  .consultation-header {
    border-bottom: 1px solid rgba(123, 157, 255, 0.2);
  }
  
  .chat-layout {
    display: flex;
    flex-direction: column;
    height: calc(100% - 70px);
  }
  
  .consultation-list {
    max-height: 200px; /* Adjusted for vertical layout */
    overflow-y: auto;
    padding: 0 1.25rem 1rem;
    border-bottom: 1px solid rgba(123, 157, 255, 0.2);
  }
  
  .consultation-item {
    padding: 0.75rem;
    border-radius: 10px;
    margin-bottom: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }
  
  .consultation-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(123, 157, 255, 0.2);
  }
  
  .consultation-item.active {
    background: rgba(123, 157, 255, 0.1);
    border-color: rgba(123, 157, 255, 0.3);
  }
  
  .consultation-time {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .status-indicator {
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: rgba(245, 158, 11, 0.2);
    color: rgb(245, 158, 11);
  }
  
  .status-indicator.active {
    background: rgba(16, 185, 129, 0.2);
    color: rgb(16, 185, 129);
  }
  
  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 1.25rem;
  }
  
  .selected-consultation-header {
    margin-bottom: 1rem;
  }
  
  .selected-consultation-header h3 {
    font-size: 1.2rem;
    margin: 0 0 0.5rem 0;
    color: white;
  }
  
  .selected-consultation-meta {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .chat-wrapper {
    flex: 1;
    min-height: 250px; /* Slightly reduced min-height */
    margin-bottom: 1rem;
  }
  
  .patient-info-panel {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 1rem;
  }
  
  .patient-info-panel h4 {
    font-size: 1rem;
    margin: 0 0 0.75rem 0;
    color: white;
  }
  
  .patient-info-content {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  /* Availability Section */
  .availability-section {
    display: flex;
    flex-direction: column;
  }
  
  .availability-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .availability-slot {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 0.75rem;
    border: 1px solid rgba(123, 157, 255, 0.1);
  }
  
  .slot-day {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: white;
  }
  
  .slot-time {
    font-size: 0.9rem;
    color: rgba(123, 157, 255, 0.9);
  }
  
  .availability-manager {
    padding: 1.25rem;
    border-top: 1px solid rgba(123, 157, 255, 0.2);
  }
  
  /* Utility Classes */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(123, 157, 255, 0.3);
    border-radius: 50%;
    border-top-color: rgba(123, 157, 255, 0.8);
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  .spinner.small {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    color: rgb(252, 165, 165);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.2);
    margin: 1rem 0;
  }
  
  .empty-message {
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    padding: 2rem 0;
  }
  
  .empty-message.centered {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  
  /* Responsive Adjustments */
  @media (max-width: 1400px) {
    .dashboard-grid {
      /* Keep the same column layout at all screen sizes */
    }
    
    .availability-section {
      grid-column: span 1; /* No need to span columns anymore */
      height: auto;
    }
  }
  
  @media (max-width: 1024px) {
    .dashboard-grid {
      /* Keep the same column layout at all screen sizes */
    }
    
    .dashboard-section {
      height: auto;
      min-height: 350px; /* Slightly reduced min-height for mobile */
      max-height: 500px; /* Reduced max-height for mobile */
    }
    
    .availability-section {
      grid-column: span 1;
    }
    
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .doctor-info {
      align-items: flex-start;
    }
  }
  
  @media (max-width: 640px) {
    .dashboard-page {
      padding: 1rem 0.5rem;
    }
    
    .dashboard-header h1 {
      font-size: 1.5rem;
    }
    
    .section-title {
      font-size: 1.2rem;
      padding: 1rem;
    }
    
    .tab-buttons {
      flex-wrap: wrap;
    }
    
    .tab-button {
      flex: 1 0 calc(50% - 0.5rem);
      text-align: center;
      padding: 0.5rem;
    }
    
    .appointment-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .consultation-time {
      font-size: 0.75rem;
    }
  }
</style>
