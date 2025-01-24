// src/routes/chat/+page.svelte
<script lang="ts">
    import { onMount } from ' svelte';
    import type { ChatMessage } from '$lib/types';
    import ChatMessageForm from '$lib/components/chat/ChatMessageForm.svelte';
    import ChatMessageList from '$lib/components/chat/ChatMessageList.svelte';
    import { chatMessageStore } from '$lib/stores/chatMessageStore';

    let messages: ChatMessage[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            await chatMessageStore.fetchMessages();
            messages = $chatMessageStore.messages;
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    async function sendMessage(messageData: Partial<ChatMessage>) {
        try {
            await chatMessageStore.sendMessage(messageData);
        } catch (err) {
            error = err.message;
        }
    }
</script>

{#if loading}
    <p>Loading chat messages...</p>
{:else if error}
    <p>Error: {error}</p>
{:else}
    <div class="chat-page">
        <h1>Chat Messages</h1>
        <ChatMessageForm on:submit={sendMessage} />
        <ChatMessageList {messages} />
    </div>
{/if}

// src/lib/types.ts (add to existing file)
export interface ChatMessage {
    id?: number;
    consultationId: number;
    senderId: number;
    content: string;
    timestamp: string;
    isRead: boolean;
}

// src/lib/stores/chatMessageStore.ts
import { writable } from 'svelte/store';
import type { ChatMessage } from '$lib/types';
import { api } from '$lib/api';

function createChatMessageStore() {
    const { subscribe, set, update } = writable({
        messages: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        fetchMessages: async () => {
            try {
                const response = await api.get('/chat/messages');
                update(store => ({ ...store, messages: response.data }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        },
        sendMessage: async (messageData: Partial<ChatMessage>) => {
            try {
                const response = await api.post('/chat/messages', messageData);
                update(store => ({
                    ...store, 
                    messages: [...store.messages, response.data]
                }));
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
            }
        }
    };
}

export const chatMessageStore = createChatMessageStore();