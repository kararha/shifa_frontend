import { writable } from 'svelte/store';
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

function createPaymentStore() {
  const { subscribe, set, update } = writable<Payment[]>([]);

  return {
    subscribe,
    createPayment: async (paymentData: Partial<Payment>) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) throw new Error('Failed to create payment');
        const payment = await response.json();
        
        update(payments => [...payments, payment]);
        return payment;
      } catch (error) {
        console.error('Payment creation failed:', error);
        throw error;
      }
    },

    requestRefund: async (paymentId: number) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/payments/${paymentId}/refund`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to process refund');
        const updatedPayment = await response.json();
        
        update(payments => 
          payments.map(p => p.id === paymentId ? updatedPayment : p)
        );
        return updatedPayment;
      } catch (error) {
        console.error('Refund request failed:', error);
        throw error;
      }
    },

    loadPayments: async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/payments`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to load payments');
        const payments = await response.json();
        set(payments);
      } catch (error) {
        console.error('Failed to load payments:', error);
        throw error;
      }
    }
  };
}

export const paymentStore = createPaymentStore();
