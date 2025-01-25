<!-- // src/routes/notifications/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import type { Notification } from '$lib/types';
    import NotificationForm from '$lib/components/notifications/NotificationForm.svelte';
    import NotificationList from '$lib/components/notifications/NotificationList.svelte';
    import { notificationStore } from '$lib/stores/notificationStore';

    let notifications: Notification[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            await notificationStore.fetchNotifications();
            notifications = $notificationStore.notifications;
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    async function createNotification(notificationData: Partial<Notification>) {
        try {
            await notificationStore.createNotification(notificationData);
        } catch (err) {
            error = err.message;
        }
    }
</script>

{#if loading}
    <p>Loading notifications...</p>
{:else if error}
    <p>Error: {error}</p>
{:else}
    <div class="notifications-page">
        <h1>Notifications</h1>
        <NotificationForm on:submit={createNotification} />
        <NotificationList {notifications} />
    </div>
{/if}

<!-- // src/lib/stores/notificationStore.ts -->
import { writable } from 'svelte/store';
import type { Notification } from '$lib/types';
import { api } from '$lib/api';

function createNotificationStore() {
    const { subscribe, set, update } = writable({
        notifications: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        fetchNotifications: async () => {
            try {
                const response = await api.get('/notifications');
                update(store => ({ ...store, notifications: response.data }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        createNotification: async (notificationData: Partial<Notification>) => {
            try {
                const response = await api.post('/notifications', notificationData);
                update(store => ({
                    ...store, 
                    notifications: [...store.notifications, response.data]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const notificationStore = createNotificationStore();