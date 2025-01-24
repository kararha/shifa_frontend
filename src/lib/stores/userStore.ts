// src/lib/stores/userStore.ts
import { writable } from 'svelte/store';
import type { User } from '$lib/types';
import { api } from '$lib/api';

function createUserStore() {
    const { subscribe, set, update } = writable({
        users: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        fetchUsers: async () => {
            try {
                const response = await api.get('/users');
                update(store => ({ ...store, users: response.data }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        createUser: async (userData: Partial<User>) => {
            try {
                const response = await api.post('/users', userData);
                update(store => ({
                    ...store, 
                    users: [...store.users, response.data]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const userStore = createUserStore();