// src/lib/stores/userStore.ts
import { writable } from 'svelte/store';
import type { User } from '$lib/types';
import { api } from '$lib/api';

function createUserStore() {
    const { subscribe, set, update } = writable<{
        users: User[];
        loading: boolean;
        error: string | null;
    }>({
        users: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        fetchUsers: async () => {
            try {
                const response = await api.get<User[]>('/users');
                update(store => ({ ...store, users: response }));
            } catch (error) {
                update(store => ({ ...store, error: (error as Error).message }));
            }
        },
        createUser: async (userData: Partial<User>) => {
            try {
                const response = await api.post<User>('/users', userData);
                update(store => ({
                    ...store, 
                    users: [...store.users, response]
                }));
            } catch (error) {
                update(store => ({ ...store, error: (error as Error).message }));
            }
        }
    };
}

export const userStore = createUserStore();

// Fetch users
try {
    await userStore.fetchUsers();
} catch (error) {
    console.error('Failed to fetch users:', error);
}

// Create user
try {
    await userStore.createUser({ 
        name: 'John Doe',
        email: 'john@example.com',
        // ... other user fields
    });
} catch (error) {
    console.error('Failed to create user:', error);
}