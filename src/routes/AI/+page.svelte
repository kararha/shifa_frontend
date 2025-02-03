<script lang="ts">
  import { onMount } from 'svelte';

  interface Message {
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
  }

  interface Conversation {
    id: string;
    name: string;
    messages: Message[];
  }

  // Basic state - update for Arabic support
  let conversations: Conversation[] = [];
  let currentConversationId: string | null = null;
  let chatMessages: Message[] = [];
  let question = '';
  let isLoading = false;
  let error = '';
  let detectedLanguage = '';
  let isPreprocessed = false;

  // Add debug state
  let debugMode = false;
  let lastApiResponse: any = null;
  let apiResponseTime = 0;

  // Update conversation name generation for Arabic support
  function generateConversationName(text: string) {
    const truncated = text.length > 30 ? text.substring(0, 30) + '...' : text;
    return truncated || (detectedLanguage === 'ar' ? 'محادثة جديدة' : 'New Chat');
  }

  // Simplified saveToHistory
  function saveToHistory(text: string, sender: Message['sender']) {
    if (!currentConversationId) {
      currentConversationId = Date.now().toString();
      conversations = [...conversations, { 
        id: currentConversationId, 
        name: generateConversationName(text),
        messages: []
      }];
    }
    
    const conversation = conversations.find((c) => c.id === currentConversationId);
    if (conversation) {
      const message = { text, sender, timestamp: new Date() };
      conversation.messages.push(message);
      chatMessages = [...chatMessages, message];
      localStorage.setItem('conversations', JSON.stringify(Object.fromEntries(conversations.map((c) => [c.id, c]))));
    }
  }

  // Update askAI function to include debug info
  async function askAI() {
    if (!question.trim()) return;

    isLoading = true;
    error = '';
    isPreprocessed = false;
    const startTime = performance.now();

    try {
      saveToHistory(question, 'user');

      const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          conversation_id: currentConversationId,
        })
      });

      const data = await response.json();
      apiResponseTime = performance.now() - startTime;
      lastApiResponse = data;

      if (!response.ok) {
        throw new Error(data.detail || 
          (detectedLanguage === 'ar' ? 'فشل في الحصول على رد' : 'Failed to get response'));
      }

      detectedLanguage = data.language;
      isPreprocessed = data.preprocessed;
      saveToHistory(data.answer, 'bot');
      
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error(err);
    } finally {
      isLoading = false;
      question = '';
    }
  }

  // Toggle debug mode
  function toggleDebug() {
    debugMode = !debugMode;
  }

  // Load conversations from localStorage
  onMount(() => {
    const storedConversations = JSON.parse(localStorage.getItem('conversations') ?? '{}');
    conversations = Object.entries(storedConversations).map(([id, data]) => {
      if (typeof data === 'object' && data !== null) {
        const { id: _, ...rest } = data as Conversation;
        return { id, ...rest };
      }
      return { id, name: '', messages: [] };
    });
  });

  // Load a conversation
  function loadConversation(conversationId: string) {
    currentConversationId = conversationId;
    const conversation = conversations.find((c) => c.id === conversationId);
    chatMessages = conversation ? conversation.messages : [];
  }

  // Create new conversation
  function createNewConversation() {
    currentConversationId = null;
    chatMessages = [];
  }
</script>

<!-- Simplified template -->
<div class="min-h-screen bg-slate-900 flex items-center justify-center p-6">
  <div class="w-full max-w-6xl flex h-[80vh] bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
    <!-- Sidebar -->
    <div class="w-80 bg-slate-900 p-4 border-r border-slate-700">
      <h2 class="text-xl font-bold text-slate-200 mb-6">Conversations</h2>
      <div class="space-y-2 mb-6 max-h-[calc(100%-120px)] overflow-y-auto">
        {#each conversations as conversation}
          <div
            class="px-4 py-3 hover:bg-slate-800 rounded-lg cursor-pointer transition-all duration-200 {currentConversationId === conversation.id ? 'bg-slate-800 border-l-4 border-indigo-500' : ''}"
            on:click={() => loadConversation(conversation.id)}
          >
            <span class="text-slate-300">{conversation.name}</span>
          </div>
        {/each}
      </div>
      <button
        on:click={createNewConversation}
        class="w-full mt-4 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        New Chat
      </button>
    </div>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col bg-slate-800">
      <!-- Messages -->
      <div class="flex-1 p-6 overflow-y-auto">
        {#each chatMessages as message}
          <div class="flex mb-6 {message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in">
            <div
              class="max-w-[80%] p-4 rounded-2xl relative {message.sender === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-700 text-slate-200'}"
              dir={detectedLanguage === 'ar' ? 'rtl' : 'ltr'}
            >
              {#if debugMode && message.sender === 'bot'}
                <div class="absolute -top-6 left-0 text-xs text-slate-400">
                  Language: {detectedLanguage} | Preprocessed: {isPreprocessed ? 'Yes' : 'No'}
                </div>
              {/if}
              {#if message.sender === 'bot' && isPreprocessed}
                <div class="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  معالجة
                </div>
              {/if}
              <p class="whitespace-pre-wrap text-{detectedLanguage === 'ar' ? 'right' : 'left'}">{message.text}</p>
              <div class="text-xs opacity-50 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-slate-900">
        {#if error}
          <div class="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <div class="flex items-center gap-2" dir={detectedLanguage === 'ar' ? 'rtl' : 'ltr'}>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <span class="text-red-500 font-medium">{error}</span>
            </div>
          </div>
        {/if}
        <div class="flex gap-3">
          <input
            type="text"
            bind:value={question}
            placeholder={detectedLanguage === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
            class="flex-1 px-4 py-3 bg-slate-800 text-slate-200 rounded-lg placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors duration-200"
            on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && askAI()}
            disabled={isLoading}
            dir={detectedLanguage === 'ar' ? 'rtl' : 'ltr'}
          />
          <button
            on:click={askAI}
            disabled={isLoading}
            class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {#if isLoading}
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Add debug panel -->
<div class="fixed top-2 right-2 z-50">
  <button
    on:click={toggleDebug}
    class="px-3 py-1 bg-slate-700 text-slate-200 rounded-lg text-sm hover:bg-slate-600"
  >
    {debugMode ? 'Hide Debug' : 'Show Debug'}
  </button>
</div>

{#if debugMode && lastApiResponse}
  <div class="fixed bottom-2 right-2 z-50 w-96 bg-slate-800 rounded-lg shadow-lg p-4 text-slate-200 text-sm">
    <h3 class="font-bold mb-2">API Response Debug</h3>
    <div class="space-y-2">
      <div>Response Time: {apiResponseTime.toFixed(2)}ms</div>
      <div>Language: {lastApiResponse.language}</div>
      <div>Preprocessed: {lastApiResponse.preprocessed ? 'Yes' : 'No'}</div>
      <div class="border-t border-slate-700 mt-2 pt-2">
        <div class="font-semibold mb-1">Raw Response:</div>
        <pre class="bg-slate-900 p-2 rounded overflow-auto max-h-40">{JSON.stringify(lastApiResponse, null, 2)}</pre>
      </div>
    </div>
  </div>
{/if}

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>