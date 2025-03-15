<script lang="ts">
    let question = '';
    let conversationHistory: { role: string; content: string }[] = [];
    let isLoading = false;
    let conversationId = crypto.randomUUID();
    let currentTypingMessage = '';
    let typingInterval: NodeJS.Timeout;
    
    async function typeMessage(message: string) {
        let index = 0;
        currentTypingMessage = '';
        
        return new Promise<void>((resolve) => {
            typingInterval = setInterval(() => {
                if (index < message.length) {
                    currentTypingMessage += message[index];
                    index++;
                } else {
                    clearInterval(typingInterval);
                    currentTypingMessage = '';
                    resolve();
                }
            }, 30); // Adjust speed here
        });
    }

    async function handleSubmit() {
        if (!question.trim()) return;
        
        isLoading = true;
        conversationHistory = [...conversationHistory, { role: 'user', content: question }];
        const currentQuestion = question;
        question = '';
        
        try {
            const response = await fetch('http://localhost:8000/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion,
                    conversation_id: conversationId
                })
            });

            const data = await response.json();
            if (response.ok) {
                // Type out the response
                await typeMessage(data.answer);
                conversationHistory = [...conversationHistory, { 
                    role: 'assistant', 
                    content: data.answer 
                }];
            } else {
                throw new Error(data.detail);
            }
        } catch (error) {
            console.error('Error:', error);
            conversationHistory = [...conversationHistory, { 
                role: 'error', 
                content: 'An error occurred while fetching the response.' 
            }];
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="page-container">
    <div class="chat-container glass">
        <div class="chat-messages" class:rtl={conversationHistory.length > 0 && conversationHistory[0].content.match(/[\u0600-\u06FF]/)}>
            {#each conversationHistory as message}
                <div class="message {message.role}" class:fade-in={message.role === 'assistant'}>
                    <div class="message-content">
                        <span class="role-badge">{message.role === 'user' ? '👤' : '🤖'}</span>
                        <p>{message.content}</p>
                    </div>
                </div>
            {/each}
            {#if currentTypingMessage}
                <div class="message assistant typing">
                    <div class="message-content">
                        <span class="role-badge">🤖</span>
                        <p>{currentTypingMessage}<span class="cursor">|</span></p>
                    </div>
                </div>
            {/if}
            {#if isLoading && !currentTypingMessage}
                <div class="loading">
                    <div class="dot-typing"></div>
                </div>
            {/if}
        </div>

        <form on:submit|preventDefault={handleSubmit} class="chat-input glass">
            <div class="input-wrapper">
                <input
                    type="text"
                    bind:value={question}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    class="input-field glass"
                />
                <button type="submit" disabled={isLoading || !question.trim()} class="send-button glass">
                    <span class="button-text">{isLoading ? '...' : '↑'}</span>
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .page-container {
        min-height: 100vh;
        width: 100%;
        padding: 2rem 1rem; /* Reduced padding for mobile */
        box-sizing: border-box;
    }

    .glass {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }

    .chat-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 1rem; /* Reduced padding for mobile */
        border-radius: 16px; /* Smaller radius for mobile */
    }

    .chat-messages {
        min-height: calc(100vh - 200px); /* Responsive height */
        max-height: calc(100vh - 150px);
        overflow-y: auto;
        padding: 1rem;
        border-radius: 12px; /* Smaller radius for mobile */
        background: rgba(255, 255, 255, 0.05);
        margin-bottom: 0.5rem;
    }

    .message {
        margin-bottom: 1rem; /* Reduced spacing for mobile */
        opacity: 0;
        animation: fadeIn 0.3s forwards;
    }

    .message-content {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .role-badge {
        font-size: 1.5rem;
        filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    }

    .user p {
        background: rgba(0, 123, 255, 0.3);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .assistant p {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .message p {
        margin: 0;
        padding: 0.75rem 1rem; /* Reduced padding for mobile */
        font-size: 0.9rem; /* Smaller font for mobile */
        line-height: 1.5;
        border-radius: 12px;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        word-break: break-word; /* Prevent text overflow */
    }

    .typing .cursor {
        animation: blink 1s infinite;
    }

    .chat-input {
        display: flex;
        padding: 0.75rem;
        border-radius: 12px;
        margin-top: 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .input-wrapper {
        display: flex;
        gap: 0.5rem;
        width: 100%;
        align-items: center;
    }

    .input-field {
        flex: 1;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 0.9rem;
        min-width: 0; /* Prevent input from overflowing */
    }

    .input-field::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }

    .input-field:focus {
        outline: none;
        border-color: #007bff;
    }

    .send-button {
        width: 2.75rem; /* Smaller button for mobile */
        height: 2.75rem;
        min-width: 2.75rem; /* Prevent shrinking */
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .send-button:hover:not(:disabled) {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.2);
    }

    .send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .dot-typing {
        position: relative;
        left: -9999px;
        width: 10px;
        height: 10px;
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 0.8);
        color: rgba(255, 255, 255, 0.8);
        box-shadow: 9984px 0 0 0 rgba(255, 255, 255, 0.8), 9999px 0 0 0 rgba(255, 255, 255, 0.8), 10014px 0 0 0 rgba(255, 255, 255, 0.8);
        animation: dot-typing 1.5s infinite linear;
    }

    .chat-messages::-webkit-scrollbar {
        width: 4px;
    }

    .chat-messages::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    @keyframes dot-typing {
        0% {
            box-shadow: 9984px 0 0 0 rgba(255, 255, 255, 0.8), 9999px 0 0 0 rgba(255, 255, 255, 0.8), 10014px 0 0 0 rgba(255, 255, 255, 0.8);
        }
        16.667% {
            box-shadow: 9984px -10px 0 0 rgba(255, 255, 255, 0.8), 9999px 0 0 0 rgba(255, 255, 255, 0.8), 10014px 0 0 0 rgba(255, 255, 255, 0.8);
        }
        33.333% {
            box-shadow: 9984px 0 0 0 rgba(255, 255, 255, 0.8), 9999px 0 0 0 rgba(255, 255, 255, 0.8), 10014px 0 0 0 rgba(255, 255, 255, 0.8);
        }
        50% {
            box-shadow: 9984px 0 0 0 rgba(255, 255, 255, 0.8), 9999px -10px 0 0 rgba(255, 255, 255, 0.8), 10014px 0 0 0 rgba(255, 255, 255, 0.8);
        }
        66.667% {
            box-shadow: 9984px 0 0 0 rgba(255, 255, 255, 0.8), 9999px 0 0 0 rgba(255, 255, 255, 0.8), 10014px 0 0 0 rgba(255, 255, 255, 0.8);
        }
        83.333% {
            box-shadow: 9984px 0 0 0 rgba(255, 255, 255, 0.8), 9999px 0 0 0 rgba(255, 255, 255, 0.8), 10014px -10px 0 0 rgba(255, 255, 255, 0.8);
        }
        100% {
            box-shadow: 9984px 0 0 0 rgba(255, 255, 255, 0.8), 9999px 0 0 0 rgba(255, 255, 255, 0.8), 10014px 0 0 0 rgba(255, 255, 255, 0.8);
        }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
    }

    /* Add responsive breakpoints */
    @media (max-width: 640px) {
        .page-container {
            padding: 1rem 0.5rem;
        }

        .chat-container {
            padding: 0.75rem;
        }

        .message-content {
            gap: 0.5rem;
        }

        .role-badge {
            font-size: 1.25rem;
        }

        .input-field {
            font-size: 16px; /* Prevent zoom on iOS */
        }
    }

    @media (max-width: 480px) {
        .chat-messages {
            min-height: calc(100vh - 160px);
            padding: 0.75rem;
        }

        .message p {
            padding: 0.6rem 0.8rem;
            font-size: 0.85rem;
        }

        .send-button {
            width: 2.5rem;
            height: 2.5rem;
            min-width: 2.5rem;
        }

        .chat-input {
            padding: 0.5rem;
        }

        .input-wrapper {
            gap: 0.375rem;
        }

        .input-field {
            padding: 0.625rem 0.75rem;
        }
    }

    /* Add landscape mode support */
    @media (max-height: 600px) and (orientation: landscape) {
        .chat-messages {
            min-height: 300px;
            max-height: calc(100vh - 120px);
        }

        .message {
            margin-bottom: 0.75rem;
        }
    }

    /* Add better touch support */
    @media (hover: none) {
        .send-button {
            -webkit-tap-highlight-color: transparent;
        }

        .input-field {
            -webkit-appearance: none;
        }

        .chat-messages {
            -webkit-overflow-scrolling: touch;
        }
    }

    /* Improve scrollbar for mobile */
    .chat-messages::-webkit-scrollbar {
        width: 4px;
    }

    /* Add smooth transitions for layout changes */
    .chat-container, .chat-messages, .message p {
        transition: all 0.3s ease;
    }

    /* Fix iOS input styles */
    .input-field {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
    }
</style>
