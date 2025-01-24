<script>
    import { onMount } from 'svelte';
  
    let conversations = []; // List of all conversations
    let currentConversationId = null; // ID of the current conversation
    let chatMessages = []; // Messages in the current conversation
    let question = ''; // User's input
    let isLoading = false; // Loading state
    let error = ''; // Error message
  
    // Load conversations from localStorage on mount
    onMount(() => {
      const storedConversations = JSON.parse(localStorage.getItem('conversations')) || {};
      conversations = Object.entries(storedConversations).map(([id, data]) => ({ id, ...data }));
      if (conversations.length > 0) {
        loadConversation(conversations[0].id);
      }
    });
  
    // Display a message in the chat UI
    function displayMessage(text, sender) {
      chatMessages = [...chatMessages, { text, sender }];
    }
  
    // Save a message to the conversation history
    function saveToHistory(text, sender) {
      if (!currentConversationId) return;
  
      const conversation = conversations.find((c) => c.id === currentConversationId);
      if (!conversation) {
        conversations.push({ id: currentConversationId, name: generateConversationName(text), messages: [] });
      }
      conversation.messages.push({ text, sender });
      localStorage.setItem('conversations', JSON.stringify(Object.fromEntries(conversations.map((c) => [c.id, c]))));
    }
  
    // Load a conversation by ID
    function loadConversation(conversationId) {
      currentConversationId = conversationId;
      const conversation = conversations.find((c) => c.id === conversationId);
      chatMessages = conversation ? conversation.messages : [];
    }
  
    // Generate a name for a new conversation
    function generateConversationName(initialText) {
      return initialText.length > 20 ? initialText.substring(0, 20) + '...' : initialText;
    }
  
    // Create a new conversation
    function createNewConversation() {
      const newConversationId = Date.now().toString();
      currentConversationId = newConversationId;
      conversations.push({ id: newConversationId, name: `Conversation ${newConversationId}`, messages: [] });
      localStorage.setItem('conversations', JSON.stringify(Object.fromEntries(conversations.map((c) => [c.id, c]))));
      chatMessages = [];
    }
  
    // Send a question to the backend and get a response
    async function askAI() {
      if (!question.trim()) return;
  
      isLoading = true;
      error = '';
  
      try {
        displayMessage(question, 'user');
        saveToHistory(question, 'user');
  
        const response = await fetch('http://localhost:8000/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question,
            conversation_id: currentConversationId,
          }),
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
        displayMessage(data.answer, 'bot');
        saveToHistory(data.answer, 'bot');
      } catch (err) {
        error = 'Failed to fetch the answer. Please try again.';
        console.error(err);
      } finally {
        isLoading = false;
        question = '';
      }
    }
  </script>
  
  <div class="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
    <div class="blob"></div>
    <div class="w-full max-w-4xl flex h-[600px] bg-white/10 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden">
      <!-- Chat History -->
      <div class="w-1/4 p-4 border-r border-white/20">
        <h2 class="text-lg font-semibold text-white mb-4">Conversation History</h2>
        <ul class="space-y-2">
          {#each conversations as conversation}
            <li
              class="text-white hover:bg-white/10 px-2 py-1 rounded-lg cursor-pointer"
              on:click={() => loadConversation(conversation.id)}
            >
              {conversation.name}
            </li>
          {/each}
        </ul>
        <button
          on:click={createNewConversation}
          class="w-full mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
        >
          New Conversation
        </button>
      </div>
  
      <!-- Chat Messages and Input -->
      <div class="w-3/4 flex flex-col">
        <div class="flex-1 p-4 overflow-y-auto">
          {#each chatMessages as message}
            <div class="flex mb-4 {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
              <div
                class="max-w-[70%] p-3 rounded-lg {message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'}"
              >
                {message.text}
              </div>
            </div>
          {/each}
        </div>
        <div class="p-4 border-t border-white/20">
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={question}
              placeholder="Type your question here..."
              class="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              on:keydown={(e) => e.key === 'Enter' && askAI()}
            />
            <button
              on:click={askAI}
              class="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Ask'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>