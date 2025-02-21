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
            <input
                type="text"
                bind:value={question}
                placeholder="Type your message..."
                disabled={isLoading}
                class="input-field glass"
            />
            <button type="submit" disabled={isLoading || !question.trim()} class="send-button glass">
                {isLoading ? '...' : '↑'}
            </button>
        </form>
    </div>
</div>

<style>
    .page-container {
        min-height: 100vh;
        width: 100%;
         /* Dark background */
        /* or you can use a subtle pattern */
        /* background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); */
        padding: 2rem;
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
        padding: 1.5rem;
        border-radius: 24px;
    }

    .chat-messages {
        min-height: 500px;
        max-height: 700px;
        overflow-y: auto;
        padding: 1.5rem;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.05);
        margin-bottom: 1rem;
    }

    .message {
        margin-bottom: 1.5rem;
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
        padding: 1rem 1.5rem;
        line-height: 1.5;
        border-radius: 16px;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }

    .typing .cursor {
        animation: blink 1s infinite;
    }

    .chat-input {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-radius: 16px;
        margin-top: 1rem;
    }

    .input-field {
        flex: 1;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 1rem;
    }

    .input-field::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }

    .input-field:focus {
        outline: none;
        border-color: #007bff;
    }

    .send-button {
        width: 3.5rem;
        height: 3.5rem;
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
        width: 8px;
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
</style>
