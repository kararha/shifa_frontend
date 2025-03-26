<script lang="ts">
  import { onMount } from 'svelte';

  let userMessage = '';
  let chatMessages: { role: string; content: string }[] = [];
  let isLoading = false;

  const API_KEY = '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';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  let welcomeMessage = "مرحباً بك في خدمة الاستشارات الطبية الذكية. كيف يمكنني مساعدتك اليوم؟";
  
  onMount(() => {
    chatMessages = [{ role: 'assistant', content: welcomeMessage }];
  });

  async function sendMessage() {
    if (!userMessage.trim()) return;

    isLoading = true;
    const messageToSend = userMessage;
    userMessage = ''; // Clear input early for better UX

    console.log('Sending message:', messageToSend);

    try {
      // Add message to chat immediately for instant feedback
      chatMessages = [
        ...chatMessages, 
        { role: 'user', content: messageToSend }
      ];

      const requestBody = {
        model: 'deepseek/deepseek-chat:free',
        messages: [
          { 
            role: 'system', 
            content: 'أنت طبيب محترف ومؤهل. يجب أن تجيب على الأسئلة الطبية باللغة العربية وبطريقة مهنية ودقيقة.' 
          },
          ...chatMessages,
          { role: 'user', content: messageToSend }
        ]
      };

      console.log('API Request:', {
        url: API_URL,
        body: requestBody
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const rawResponse = await response.text();
      console.log('Raw API Response:', rawResponse);

      const data = JSON.parse(rawResponse);
      console.log('Parsed API Response:', data);

      if (!response.ok) {
        throw new Error(`API Error: ${data.error || response.statusText}`);
      }

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format');
      }

      chatMessages = [
        ...chatMessages,
        { role: 'assistant', content: data.choices[0].message.content }
      ];

    } catch (error) {
      console.error('Error in sendMessage:', error);
      // Add error message to chat
      chatMessages = [
        ...chatMessages,
        { 
          role: 'assistant', 
          content: 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.' 
        }
      ];
    } finally {
      isLoading = false;
    }
  }
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
          <h1 class="text-3xl font-bold text-white">استشارتك الطبية</h1>
        </div>
        <p class="text-blue-100 text-center mt-2">نظام ذكي للمساعدة الطبية الأولية</p>
      </div>

      <!-- Chat Area -->
      <div class="h-[60vh] overflow-y-auto p-6 space-y-6" dir="rtl">
        {#each chatMessages as message}
          <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {#if message.role === 'assistant'}
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            {/if}
            <div class={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-50 text-gray-800 rounded-bl-none border border-gray-100'
            }`}>
              <p class="leading-relaxed">{message.content}</p>
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
            placeholder="اكتب سؤالك هنا..."
            class="flex-1 p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            dir="rtl"
          />
          <button
            type="submit"
            class="bg-blue-600/80 hover:bg-blue-700/80 text-white px-6 py-4 rounded-xl disabled:opacity-50 transition-all duration-200 backdrop-blur-sm flex items-center gap-2"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 110-2h11.586l-4.293-4.293a1 1 010-1.414z" clip-rule="evenodd" />
            </svg>
            إرسال
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
