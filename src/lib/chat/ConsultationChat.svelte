<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { BACKEND_URL } from '$lib/constants';
  import { fade } from 'svelte/transition';
  import Icon from '@iconify/svelte';
  import { t } from '$lib/i18n';
  
  export let consultationId: number;
  export let userId: number;
  export let userRole: 'patient' | 'doctor';
  export let isPaid: boolean = true; // Use this property to determine if chat is fully functional
  
  interface ChatMessage {
    id: number;
    consultation_id: number;
    sender_type: 'doctor' | 'patient';
    sender_id: number;
    message: string;
    sent_at: string;
    is_read: boolean;
  }
  
  let messages: ChatMessage[] = [];
  let newMessage = '';
  let loading = true;
  let error = '';
  let chatContainer: HTMLElement;
  let unreadCount = 0;
  
  // Auto-scroll chat to bottom when messages change
  $: if (chatContainer && messages.length) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }
  
  onMount(async () => {
    await loadMessages();
    
    // Set up a polling mechanism for new messages
    // In a production environment, you might want to use WebSockets instead
    const intervalId = setInterval(async () => {
      await checkForNewMessages();
    }, 5000); // Poll every 5 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  });
  
  async function loadMessages() {
    try {
      loading = true;
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log(`Loading messages for consultation ID: ${consultationId}`);
      console.log(`API URL: ${BACKEND_URL}/api/chat/messages?consultation_id=${consultationId}`);
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/chat/messages?consultation_id=${consultationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Log response status for debugging
        console.log('API response status:', response.status);
        
        // If the API returns a 404, it might mean no messages yet, which is not an error
        if (response.status === 404) {
          console.log('No messages found for this consultation - this is normal for new chats');
          messages = [];
          return;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load messages. Status: ${response.status}. Response: ${errorText}`);
        }
        
        messages = await response.json();
        console.log(`Loaded ${messages.length} messages`);
        
        if (messages.length > 0) {
          markUnreadMessages();
        }
      } catch (apiError) {
        console.error('API fetch error:', apiError);
        throw new Error(`Error loading messages: ${apiError.message}`);
      }
    } catch (e) {
      console.error('Error loading messages:', e);
      error = e instanceof Error ? e.message : 'Failed to load messages';
    } finally {
      loading = false;
    }
  }
  
  async function checkForNewMessages() {
    try {
      if (messages.length === 0) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Get the timestamp of the latest message to fetch only newer ones
      const latestMessageTime = messages.length > 0 
        ? new Date(messages[messages.length - 1].sent_at).toISOString()
        : new Date(0).toISOString();
      
      const response = await fetch(
        `${BACKEND_URL}/api/chat/messages?consultation_id=${consultationId}&since=${latestMessageTime}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) return;
      
      const newMessages = await response.json();
      if (newMessages.length > 0) {
        messages = [...messages, ...newMessages];
        markUnreadMessages();
      }
    } catch (e) {
      console.error('Error checking for new messages:', e);
    }
  }
  
  async function markUnreadMessages() {
    // Mark messages from other sender as read
    const unreadMessages = messages.filter(
      msg => !msg.is_read && msg.sender_type !== userRole
    );
    
    if (unreadMessages.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      for (const message of unreadMessages) {
        await fetch(`${BACKEND_URL}/api/chat/messages/${message.id}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Update local message status
        message.is_read = true;
      }
    } catch (e) {
      console.error('Error marking messages as read:', e);
    }
  }
  
  async function getUnreadCount() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${BACKEND_URL}/api/chat/unread-count?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      unreadCount = data.count;
    } catch (e) {
      console.error('Error getting unread count:', e);
    }
  }
  
  async function sendMessage() {
    if (!newMessage.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const messageData = {
        consultation_id: consultationId,
        sender_type: userRole,
        sender_id: userId,
        message: newMessage.trim(),
        sent_at: new Date().toISOString(),
        is_read: false
      };
      
      // Optimistic UI update with a temporary ID
      const tempId = Date.now();
      messages = [...messages, {...messageData, id: tempId}];
      newMessage = '';
      
      const response = await fetch(`${BACKEND_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const savedMessage = await response.json();
      
      // Replace the temporary message with the saved one
      messages = messages.map(msg => 
        msg.id === tempId ? savedMessage : msg
      );
      
    } catch (e) {
      console.error('Error sending message:', e);
      error = e instanceof Error ? e.message : 'Failed to send message';
      // Remove the failed message from the UI
      messages = messages.filter(msg => typeof msg.id === 'number');
    }
  }
  
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }
  
  // Group messages by date for better UI organization
  $: groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.sent_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
</script>

<div class="flex flex-col h-full">
  <!-- Chat Header -->
  <div class="bg-white/10 backdrop-filter backdrop-blur-lg p-4 rounded-t-lg border-b border-white/10">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-white">
        {userRole === 'patient' ? $t('chat.withDoctor', 'Chat with Doctor') : $t('chat.withPatient', 'Chat with Patient')}
      </h3>
      
      {#if unreadCount > 0}
        <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          {unreadCount} {$t('chat.unread', 'unread')}
        </span>
      {/if}
    </div>
  </div>
  
  {#if userRole === 'doctor' && !isPaid}
    <div class="bg-yellow-500/10 p-2 border-b border-yellow-500/30">
      <p class="text-center text-yellow-200 text-sm">
        <Icon icon="mdi:information-outline" class="inline-block mr-1" />
        {$t('chat.paymentPending', "Patient hasn't paid for this consultation yet")}
      </p>
    </div>
  {/if}
  
  <!-- Chat Messages -->
  <div 
    class="flex-1 overflow-y-auto p-4 space-y-6"
    bind:this={chatContainer}
  >
    {#if loading}
      <div class="flex justify-center py-8">
        <div class="w-8 h-8 border-b-2 border-t-2 border-blue-400 rounded-full animate-spin"></div>
      </div>
    {:else if error}
      <div class="bg-red-500/20 border border-red-500/40 text-red-200 p-3 rounded-lg text-center">
        {error}
      </div>
    {:else if messages.length === 0}
      <div class="text-center py-8 text-gray-400">
        No messages yet. Start the conversation!
      </div>
    {:else}
      {#each Object.entries(groupedMessages) as [date, dateMessages]}
        <div class="space-y-3">
          <div class="flex justify-center">
            <span class="bg-white/10 text-xs text-gray-300 px-3 py-1 rounded-full">
              {formatDate(dateMessages[0].sent_at)}
            </span>
          </div>
          
          {#each dateMessages as message}
            <div 
              class="flex {message.sender_type === userRole ? 'justify-end' : 'justify-start'}"
              in:fade={{ duration: 150 }}
            >
              <div 
                class="{message.sender_type === userRole 
                  ? 'bg-blue-600/60 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                  : 'bg-white/10 text-white rounded-tl-lg rounded-tr-lg rounded-br-lg'} 
                  p-3 max-w-[80%] break-words"
              >
                <div>{message.message}</div>
                <div class="text-xs mt-1 flex justify-between items-center">
                  <span class="text-gray-300">{formatTime(message.sent_at)}</span>
                  {#if message.sender_type === userRole}
                    <span class="ml-2">
                      {#if message.is_read}
                        <Icon icon="mdi:check-all" class="text-blue-300" />
                      {:else}
                        <Icon icon="mdi:check" class="text-gray-400" />
                      {/if}
                    </span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/each}
    {/if}
  </div>
  
  <!-- Message Input -->
  <div class="bg-white/10 backdrop-filter backdrop-blur-lg p-4 rounded-b-lg border-t border-white/10">
    <form on:submit|preventDefault={sendMessage} class="flex gap-2">
      <input
        type="text"
        bind:value={newMessage}
        placeholder="Type your message..."
        class="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <button
        type="submit"
        class="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        disabled={!newMessage.trim()}
      >
        <Icon icon="mdi:send" class="text-xl" />
      </button>
    </form>
  </div>
</div>

<style>
  /* Custom scrollbar for chat container */
  div::-webkit-scrollbar {
    width: 6px;
  }

  div::-webkit-scrollbar-track {
    background: transparent;
  }

  div::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  
  div {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }
</style>
