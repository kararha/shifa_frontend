<script>
  import { onMount } from 'svelte';
  import { authStore } from '../stores/authStore';
  
  // Props for consultation ID and user role to store/retrieve messages
  export let consultationId = "default";
  export let userRole = "patient"; // "patient" or "doctor"
  export let doctorId = "doctor"; // Only used when userRole = "doctor"
  export let doctorName = "Doctor"; // Only used when userRole = "doctor"
  
  // Messages array to hold chat messages
  let messages = [];
  let newMessage = "";
  let chatContainer;
  
  // User info (can be replaced with actual auth data)
  let currentUser = userRole === "doctor" 
    ? { id: doctorId, name: doctorName } 
    : { id: 'user', name: 'You' };
  
  let otherUser = userRole === "doctor" 
    ? { id: 'user', name: 'Patient' } 
    : { id: 'doctor', name: 'Doctor' };
  
  // Function to format date correctly
  function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) return '';
    
    // Format time as HH:MM AM/PM
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${formattedHours}:${minutes} ${ampm}`;
  }
  
  // Load messages from localStorage on component mount
  onMount(() => {
    loadMessages();
    
    // Subscribe to auth store changes if needed
    const unsubscribe = authStore.subscribe(auth => {
      if (auth.user) {
        if (userRole === "patient") {
          currentUser = { 
            id: auth.user.id || 'user',
            name: auth.user.name || 'You'
          };
        }
      }
    });
    
    // Start auto-refresh of messages (to sync between doctor/patient views)
    const refreshInterval = setInterval(() => {
      loadMessages();
    }, 2000); // Check for new messages every 2 seconds
    
    // Scroll to bottom of chat
    scrollToBottom();
    
    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  });
  
  // Function to save messages to localStorage
  function saveMessages() {
    try {
      localStorage.setItem(`chat_${consultationId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }
  
  // Function to load messages from localStorage
  function loadMessages() {
    try {
      const savedMessages = localStorage.getItem(`chat_${consultationId}`);
      if (savedMessages) {
        messages = JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }
  
  // Function to send a message
  function sendMessage() {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      sender: currentUser.id,
      senderName: currentUser.name,
      text: newMessage.trim(),
      timestamp: new Date().toISOString() // Store as ISO string for reliable parsing
    };
    
    messages = [...messages, message];
    newMessage = "";
    
    // Save messages after adding a new one
    saveMessages();
    
    // Scroll to the bottom of the chat
    setTimeout(scrollToBottom, 50);
  }
  
  // Function to scroll to the bottom of the chat
  function scrollToBottom() {
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
  
  // Function to handle form submission
  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }
</script>

<div class="chat-container">
  {#if messages.length === 0}
    <div class="empty-chat">
      <div class="empty-chat-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h3>No messages yet</h3>
      <p>{userRole === "doctor" ? "Start the conversation with your patient." : "Start a conversation with your doctor."}</p>
    </div>
  {/if}

  <div class="chat-messages" bind:this={chatContainer}>
    {#each messages as message (message.id)}
      <div class="message {message.sender === currentUser.id ? 'message-outgoing' : 'message-incoming'}" transition:fade={{duration: 150}}>
        <div class="message-content">
          <div class="message-sender">{message.sender === currentUser.id ? 'You' : message.senderName || 'Other'}</div>
          <div class="message-text">{message.text}</div>
          <div class="message-meta">
            <span class="message-time">{formatMessageTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
  
  <form class="chat-input" on:submit={handleSubmit}>
    <input 
      type="text" 
      bind:value={newMessage} 
      placeholder="Type your message..." 
      class="message-input"
      aria-label="Message text"
    />
    <button type="submit" class="send-button" disabled={!newMessage.trim()} aria-label="Send message">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="send-icon">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      <span class="send-text">Send</span>
    </button>
  </form>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    border-radius: 0 0 16px 16px;
    overflow: hidden;
    background: rgba(13, 15, 48, 0.4);
    backdrop-filter: blur(var(--glass-blur, 10px));
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    scroll-behavior: smooth;
  }
  
  .empty-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    padding: 3rem;
  }
  
  .empty-chat-icon {
    margin-bottom: 1.5rem;
    color: rgba(123, 157, 255, 0.4);
  }
  
  .empty-chat h3 {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 0.5rem 0;
  }
  
  .empty-chat p {
    font-size: 0.95rem;
    max-width: 280px;
    line-height: 1.5;
  }
  
  .message {
    display: flex;
    max-width: 80%;
    margin-bottom: 0.25rem;
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .message-outgoing {
    align-self: flex-end;
  }
  
  .message-incoming {
    align-self: flex-start;
  }
  
  .message-content {
    padding: 0.85rem 1.1rem;
    border-radius: 18px;
    position: relative;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .message-outgoing .message-content {
    background: linear-gradient(135deg, rgba(123, 157, 255, 0.8), rgba(123, 157, 255, 0.6));
    color: white;
    border-bottom-right-radius: 4px;
  }
  
  .message-incoming .message-content {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-bottom-left-radius: 4px;
  }
  
  .message-sender {
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
    font-weight: 600;
    opacity: 0.8;
  }
  
  .message-text {
    word-break: break-word;
    font-size: 0.95rem;
    line-height: 1.4;
  }
  
  .message-meta {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.7rem;
    opacity: 0.7;
  }
  
  .chat-input {
    display: flex;
    padding: 1rem 1.25rem;
    background: rgba(13, 15, 48, 0.6);
    border-top: 1px solid rgba(123, 157, 255, 0.2);
  }
  
  .message-input {
    flex: 1;
    padding: 0.9rem 1.2rem;
    border-radius: 24px;
    border: 1px solid rgba(123, 157, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    outline: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 0.95rem;
  }
  
  .message-input:focus {
    border-color: rgba(123, 157, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(123, 157, 255, 0.1);
  }
  
  .message-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  .send-button {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.75rem;
    padding: 0 1.25rem;
    height: 48px;
    border-radius: 24px;
    border: none;
    background: linear-gradient(135deg, rgba(123, 157, 255, 0.8), rgba(123, 157, 255, 0.6));
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .send-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(123, 157, 255, 0.3);
  }
  
  .send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .send-icon {
    margin-right: 0.5rem;
  }
  
  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .message {
      max-width: 90%;
    }
    
    .send-text {
      display: none;
    }
    
    .send-button {
      width: 48px;
      padding: 0;
    }
    
    .send-icon {
      margin-right: 0;
    }
    
    .chat-messages {
      padding: 1rem;
    }
    
    .chat-input {
      padding: 0.75rem 1rem;
    }
    
    .empty-chat {
      padding: 2rem 1rem;
    }
  }
  
  @media (max-width: 480px) {
    .message-content {
      padding: 0.7rem 0.9rem;
    }
    
    .message-text {
      font-size: 0.9rem;
    }
    
    .message-input {
      padding: 0.8rem 1rem;
    }
  }
</style>
