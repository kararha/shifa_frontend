<script lang="ts">
    import { onMount } from 'svelte';
    import { t, currentLanguage } from '$lib/i18n';

    interface StructuredResponse {
        type: 'regular' | 'multiple_choice';
        content: string;
        options?: string[];
    }

    interface ChatMessage {
        role: string;
        content: string | StructuredResponse;
    }

    let userMessage = '';
    let chatMessages: ChatMessage[] = [];
    let isLoading = false;
    let detectedSymptoms: string[] = [];
    let consecutiveNegatives = 0;
    let sessionId: string | null = null;
    let apiError = false;

    const API_URL = 'http://localhost:8000/ask';

    onMount(() => {
        try {
            sessionId = crypto.randomUUID();
            // Initialize with welcome message
            chatMessages = [{ 
                role: 'assistant', 
                content: t('ai.welcome')
            }];
        } catch (error) {
            console.error("Error initializing AI chat:", error);
            // Still show the interface with an error message
            chatMessages = [{ 
                role: 'assistant', 
                content: "Welcome to the AI assistant. The service might be experiencing issues."
            }];
        }
    });

    function handleOptionClick(option: string) {
        userMessage = option;
        sendMessage();
    }

    async function sendMessage() {
        if (!userMessage.trim()) return;

        // Track consecutive negative responses
        if (userMessage.trim().toLowerCase().includes('لا') || 
            userMessage.trim().toLowerCase().includes('no')) {
            consecutiveNegatives++;
        } else {
            consecutiveNegatives = 0;
        }

        isLoading = true;
        const messageToSend = userMessage;
        userMessage = '';

        // Add user message immediately
        chatMessages = [...chatMessages, { role: 'user', content: messageToSend }];

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: messageToSend,
                    session_id: sessionId,
                    consecutiveNegatives
                })
            });

            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.symptoms) {
                detectedSymptoms = data.symptoms;
            }

            chatMessages = [
                ...chatMessages,
                { role: 'assistant', content: data.response }
            ];

            sessionId = data.session_id;
            apiError = false;

        } catch (error) {
            console.error("API error:", error);
            apiError = true;
            
            // Add a friendly error message
            chatMessages = [
                ...chatMessages,
                { role: 'assistant', content: t('ai.error') }
            ];
        } finally {
            isLoading = false;
        }
    }

    // Make this reactive to catch translation changes
    $: translations = t;
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 p-4">
    <div class="max-w-4xl mx-auto">
        <div class="glass-card overflow-hidden">
            <!-- Header Section -->
            <div class="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 p-6 backdrop-blur-md">
                <div class="flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h1 class="text-3xl font-bold text-white">{$t('ai.title')}</h1>
                </div>
                <p class="text-blue-100 text-center mt-2">{$t('ai.subtitle')}</p>
                <!-- Note section -->
                <div class="mt-4 text-center text-sm text-white/90">
                    {$t('ai.note')}
                </div>
                
                {#if apiError}
                    <div class="mt-4 p-3 bg-red-600/30 rounded-lg text-center">
                        API connection error. The service might be unavailable.
                    </div>
                {/if}
            </div>

            <!-- Symptoms Display -->
            {#if detectedSymptoms.length > 0}
                <div class="bg-white/10 p-3 rounded-lg mt-2 mx-6">
                    <p class="text-blue-100 text-sm">{$t('ai.symptoms')}:</p>
                    <div class="flex flex-wrap gap-2 mt-1">
                        {#each detectedSymptoms as symptom}
                            <span class="bg-blue-600/30 text-white px-2 py-1 rounded-full text-sm">
                                {symptom}
                            </span>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Chat Area -->
            <div class="h-[60vh] overflow-y-auto p-6 space-y-6" dir={$currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                {#each chatMessages as message}
                    <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                        {#if message.role === 'assistant'}
                            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        {/if}
                        <div class={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                            message.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-gray-50 text-gray-800 rounded-bl-none border border-gray-100'
                        }`}>
                            {#if message.role === 'assistant' && typeof message.content === 'object'}
                                <p class="leading-relaxed mb-4">{message.content.content}</p>
                                {#if message.content.type === 'multiple_choice' && message.content.options}
                                    <div class="flex flex-col gap-2 mt-3">
                                        {#each message.content.options as option}
                                            <button
                                                class="text-right p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                                on:click={() => handleOptionClick(option)}
                                            >
                                                {option}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            {:else}
                                <p class="leading-relaxed">{message.content}</p>
                            {/if}
                        </div>
                    </div>
                {/each}
                {#if isLoading}
                    <div class="flex justify-center">
                        <div class="flex gap-2">
                            <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
                            <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Input Area -->
            <div class="p-6 border-t border-white/10 bg-white/5 backdrop-blur-lg">
                <form on:submit|preventDefault={sendMessage} class="flex gap-3">
                    <input
                        type="text"
                        bind:value={userMessage}
                        placeholder={$t('ai.typeMessage')}
                        class="flex-1 p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                        dir={$currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                    />
                    <button
                        type="submit"
                        class="bg-blue-600/80 hover:bg-blue-700/80 text-white px-6 py-4 rounded-xl disabled:opacity-50 transition-all duration-200 backdrop-blur-sm flex items-center gap-2"
                        disabled={isLoading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 010 1.414l-6 6a1 1 01-1.414-1.414L14.586 11H3a1 1 110-2h11.586l-4.293-4.293a1 1 010-1.414z" clip-rule="evenodd" />
                        </svg>
                        {$t('ai.sendMessage')}
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<style>
  .glass-card {
    @apply rounded-xl;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  /* Customize scrollbar for chat area */
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }

  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
</style>
