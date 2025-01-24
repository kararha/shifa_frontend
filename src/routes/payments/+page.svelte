<!-- // src/routes/payments/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { BACKEND_URL } from '$lib/constants';

    interface Payment {
        id: number;
        amount: number;
        status: string;
        payment_date: string | null;
        refund_date: string | null;
        consultation_id: number;
        home_care_visit_id: number;
    }

    let payments: Payment[] = [];
    let loading = true;
    let error = '';

    onMount(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/payments`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch payments');
            payments = await response.json();
        } catch (e) {
            error = e instanceof Error ? e.message : 'An unknown error occurred';
        } finally {
            loading = false;
        }
    });

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
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
            const response = await fetch(`${BACKEND_URL}/api/payments/${paymentId}/refund`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to request refund');
            // Refresh the payments list
            window.location.reload();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to process refund request';
        }
    };
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-blue-900 mb-8">Payment History</h1>

    {#if loading}
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
        </div>
    {:else if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
        </div>
    {:else if payments.length === 0}
        <div class="text-center py-8 text-gray-500">
            No payments found
        </div>
    {:else}
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Date
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Refund Date
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {#each payments as payment}
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                #{payment.id}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${payment.amount.toFixed(2)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusColor(payment.status)}">
                                    {payment.status}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(payment.payment_date)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(payment.refund_date)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {#if payment.status === 'completed' && !payment.refund_date}
                                    <button
                                        class="text-red-600 hover:text-red-900"
                                        on:click={() => requestRefund(payment.id)}
                                    >
                                        Request Refund
                                    </button>
                                {:else}
                                    <span class="text-gray-400">No actions available</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>