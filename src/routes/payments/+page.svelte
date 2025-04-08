<!-- // src/routes/payments/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { BACKEND_URL } from '$lib/constants';
    import { fade, fly } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import Icon from '@iconify/svelte';

    interface Payment {
        id: number;
        amount: number;
        status: string;
        payment_date: string | null;
        refund_date: string | null;
        consultation_id?: number;
        home_care_visit_id?: number;
    }

    interface Appointment {
        id: number;
        patient_id: number;
        doctor_id?: number;
        home_care_provider_id?: number;
        provider_type: string;
        appointment_date: string;
        status: string;
    }

    let payments: Payment[] = [];
    let appointments: Appointment[] = [];
    let loading = true;
    let error = '';
    let showPaymentMethod = false;
    let currentAppointmentForPayment: Appointment | null = null;
    let paymentAmount = '';
    let processingPayment = false;

    onMount(async () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!token || !user) {
            goto('/login');
            return;
        }
        
        await loadData(user.id, token);
    });

    async function loadData(userId: number, token: string) {
        try {
            loading = true;
            error = '';

            // Since we don't have an appointments endpoint, we'll fetch payments directly
            // and reconstruct appointment data as needed
            console.log('Fetching payments for user:', userId);
            
            // Fetch all user's consultation payments
            const consultationPaymentsUrl = `${BACKEND_URL}/api/payments/user/${userId}/consultations`;
            console.log('Fetching consultation payments from:', consultationPaymentsUrl);
            
            // Fetch all user's home care visit payments
            const visitPaymentsUrl = `${BACKEND_URL}/api/payments/user/${userId}/home-care-visits`;
            console.log('Fetching home care visit payments from:', visitPaymentsUrl);
            
            try {
                const [consultationRes, visitRes] = await Promise.all([
                    fetch(consultationPaymentsUrl, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }).then(res => res.ok ? res.json() : []),
                    fetch(visitPaymentsUrl, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }).then(res => res.ok ? res.json() : [])
                ]);
                
                // Combine all payments
                payments = [...consultationRes, ...visitRes].filter(p => p !== null);
                console.log('User payments:', payments);
                
                // Extract appointment information from payments
                // This is a simplified approach since we don't have direct appointment data
                appointments = payments.map(payment => {
                    return {
                        id: payment.consultation_id || payment.home_care_visit_id,
                        patient_id: userId,
                        doctor_id: payment.consultation_id ? payment.doctor_id : undefined,
                        home_care_provider_id: payment.home_care_visit_id ? payment.provider_id : undefined,
                        provider_type: payment.consultation_id ? 'doctor' : 'provider',
                        appointment_date: payment.service_date || payment.payment_date,
                        status: 'completed'
                    };
                });
                
            } catch (e) {
                console.error('Error fetching payments:', e);
                error = 'Failed to load payment data. Please try again later.';
            }
        } catch (e) {
            console.error('Error loading payment data:', e);
            error = e instanceof Error ? e.message : 'An unknown error occurred';
        } finally {
            loading = false;
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'paid':
                return 'text-green-600 bg-green-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            case 'refunded':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const requestRefund = async (paymentId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            const response = await fetch(`${BACKEND_URL}/api/payments/${paymentId}/refund`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to process refund');
            }
            
            // Refresh the payments list
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            await loadData(user.id, token);
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to process refund request';
        }
    };

    const openPaymentModal = (appointment: Appointment) => {
        currentAppointmentForPayment = appointment;
        // Set a default payment amount
        paymentAmount = appointment.provider_type === 'doctor' ? '100' : '50';
        showPaymentMethod = true;
    };

    const closePaymentModal = () => {
        showPaymentMethod = false;
        currentAppointmentForPayment = null;
    };

    const processPayment = async () => {
        if (!currentAppointmentForPayment || !paymentAmount) return;
        
        try {
            processingPayment = true;
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Authentication required');
            }
            
            const paymentData = {
                amount: parseFloat(paymentAmount),
                status: 'completed',
                payment_date: new Date().toISOString(),
                ...(currentAppointmentForPayment.provider_type === 'doctor' 
                    ? { consultation_id: currentAppointmentForPayment.id } 
                    : { home_care_visit_id: currentAppointmentForPayment.id })
            };
            
            const response = await fetch(`${BACKEND_URL}/api/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Payment processing failed');
            }
            
            // Refresh the data
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            await loadData(user.id, token);
            closePaymentModal();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Payment processing failed';
        } finally {
            processingPayment = false;
        }
    };

    // Get pending appointments (those without a payment)
    $: pendingAppointments = appointments.filter(appointment => {
        // Check if there's no payment for this appointment
        const hasPayment = payments.some(payment => 
            (payment.consultation_id === appointment.id) || 
            (payment.home_care_visit_id === appointment.id)
        );
        return !hasPayment && ['completed', 'scheduled'].includes(appointment.status);
    });

    $: hasPayments = payments.length > 0;
    $: hasPendingAppointments = pendingAppointments.length > 0;
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-8">
        <div class="glass-card">
            <h1 class="text-3xl font-bold text-white mb-2">Payment History</h1>
            <p class="text-gray-300 mb-6">Manage your payments and view transaction history</p>

            {#if error}
                <div class="bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-3 rounded mb-6" transition:fade>
                    <p>{error}</p>
                </div>
            {/if}

            {#if loading}
                <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                    <p class="mt-4 text-white">Loading your payment history...</p>
                </div>
            {:else if hasPayments}
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-700">
                        <thead>
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    ID
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Payment Date
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Refund Date
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
                            {#each payments as payment}
                                <tr class="bg-white/5 hover:bg-white/10">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                        #{payment.id}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                        ${payment.amount.toFixed(2)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusColor(payment.status)}">
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {formatDate(payment.payment_date)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {formatDate(payment.refund_date)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {#if (payment.status === 'completed' || payment.status === 'paid') && !payment.refund_date}
                                            <button
                                                class="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md"
                                                on:click={() => requestRefund(payment.id)}
                                            >
                                                Request Refund
                                            </button>
                                        {:else}
                                            <span class="text-gray-500">No actions available</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}

            <!-- Show instructions for making payments when no payments exist -->
            {#if !loading && !hasPayments && !hasPendingAppointments}
                <div class="glass-panel text-center py-10" in:fade>
                    <div class="flex flex-col items-center">
                        <Icon icon="mdi:cash-multiple" class="text-6xl text-blue-400 mb-4" />
                        <h3 class="text-xl font-semibold text-white mb-2">No Payment History</h3>
                        <p class="text-gray-300 mb-6 max-w-md mx-auto">
                            You don't have any payment history yet. Payments will appear here after you book and pay for appointments.
                        </p>
                        <a href="/doctors" class="glass-button">
                            Book an Appointment
                        </a>
                    </div>
                </div>
            {/if}

            <!-- Show pending appointments that need payment -->
            {#if !loading && hasPendingAppointments}
                <div class="mt-10" in:fade>
                    <h2 class="text-xl font-semibold text-white mb-4">Pending Payments</h2>
                    <p class="text-gray-300 mb-6">
                        The following appointments require payment:
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each pendingAppointments as appointment}
                            <div class="glass-panel">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="text-white font-semibold">
                                            {appointment.provider_type === 'doctor' ? 'Doctor Consultation' : 'Home Care Visit'}
                                        </h3>
                                        <p class="text-gray-300 text-sm">
                                            Date: {new Date(appointment.appointment_date).toLocaleDateString()}
                                        </p>
                                        <p class="text-gray-300 text-sm">
                                            Status: <span class="px-2 py-0.5 rounded-full text-xs {getStatusColor(appointment.status)}">{appointment.status}</span>
                                        </p>
                                    </div>
                                    <button
                                        class="glass-button-primary"
                                        on:click={() => openPaymentModal(appointment)}
                                    >
                                        Pay Now
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- Payment Method Modal -->
{#if showPaymentMethod && currentAppointmentForPayment}
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" transition:fade>
        <div class="glass-card max-w-md w-full relative" in:fly={{ y: 20, duration: 300 }}>
            <button
                class="absolute top-4 right-4 text-gray-400 hover:text-white"
                on:click={closePaymentModal}
                disabled={processingPayment}
            >
                <Icon icon="mdi:close" class="text-xl" />
            </button>

            <h2 class="text-xl font-bold text-white mb-4">Make Payment</h2>
            
            <p class="text-gray-300 mb-6">
                Complete your payment for 
                {currentAppointmentForPayment.provider_type === 'doctor' 
                    ? 'doctor consultation' 
                    : 'home care service'} 
                on {new Date(currentAppointmentForPayment.appointment_date).toLocaleDateString()}.
            </p>

            <div class="space-y-4">
                <div>
                    <label for="amount" class="block text-sm font-medium text-gray-300 mb-1">
                        Amount ($)
                    </label>
                    <input
                        type="number"
                        id="amount"
                        bind:value={paymentAmount}
                        min="1"
                        step="0.01"
                        class="glass-input w-full"
                        required
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">
                        Payment Method
                    </label>
                    <div class="grid grid-cols-2 gap-3 mt-2">
                        <div class="bg-white/10 p-3 rounded-lg flex items-center border border-white/20 cursor-pointer hover:bg-white/15">
                            <Icon icon="logos:visa" class="mr-2" />
                            <span class="text-white">Credit Card</span>
                        </div>
                        <div class="bg-white/10 p-3 rounded-lg flex items-center border border-white/20 cursor-pointer hover:bg-white/15">
                            <Icon icon="logos:paypal" class="mr-2" />
                            <span class="text-white">PayPal</span>
                        </div>
                    </div>
                </div>

                <button
                    class="w-full glass-button-primary py-3 mt-4"
                    on:click={processPayment}
                    disabled={processingPayment}
                >
                    {#if processingPayment}
                        <span class="flex items-center justify-center">
                            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Processing...
                        </span>
                    {:else}
                        Pay ${paymentAmount}
                    {/if}
                </button>
                
                <p class="text-gray-400 text-xs text-center mt-4">
                    Your payment information is secure and encrypted.
                </p>
            </div>
        </div>
    </div>
{/if}

<style>
    .glass-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .glass-panel {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1.5rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .glass-button {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .glass-button:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .glass-button-primary {
        background: rgba(59, 130, 246, 0.5);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .glass-button-primary:hover {
        background: rgba(59, 130, 246, 0.7);
    }

    .glass-input {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 0.5rem 1rem;
        color: white;
        width: 100%;
    }

    .glass-input:focus {
        outline: none;
        border-color: rgba(59, 130, 246, 0.5);
    }
</style>