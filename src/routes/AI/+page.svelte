<script lang="ts">
    let question = '';
    let conversationHistory: { role: string; content: string }[] = [];
    let isLoading = false;
    let conversationId = crypto.randomUUID();

    async function handleSubmit() {
        if (!question.trim()) return;
        
        isLoading = true;
        conversationHistory = [...conversationHistory, { role: 'user', content: question }];
        
        try {
            const response = await fetch('http://localhost:8000/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    conversation_id: conversationId
                })
            });

            const data = await response.json();
            if (response.ok) {
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
            question = '';
        }
    }
</script>

<div class="chat-container">
    <div class="chat-messages" class:rtl={conversationHistory.length > 0 && conversationHistory[0].content.match(/[\u0600-\u06FF]/)}>
        {#each conversationHistory as message}
            <div class="message {message.role}">
                <span class="role">{message.role === 'user' ? 'You' : 'AI'}</span>
                <p>{message.content}</p>
            </div>
        {/each}
        {#if isLoading}
            <div class="loading">Loading...</div>
        {/if}
    </div>

    <form on:submit|preventDefault={handleSubmit} class="chat-input">
        <input
            type="text"
            bind:value={question}
            placeholder="Type your message..."
            disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !question.trim()}>
            Send
        </button>
    </form>
</div>

<style>
    .chat-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .chat-messages {
        min-height: 400px;
        max-height: 600px;
        overflow-y: auto;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .rtl {
        direction: rtl;
    }

    .message {
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        border-radius: 8px;
    }

    .user {
        background: #007bff;
        color: white;
        margin-left: 2rem;
    }

    .assistant {
        background: #e9ecef;
        margin-right: 2rem;
    }

    .error {
        background: #dc3545;
        color: white;
    }

    .role {
        font-weight: bold;
        font-size: 0.8rem;
        display: block;
        margin-bottom: 0.25rem;
    }

    .chat-input {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
    }

    input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
    }

    button {
        padding: 0.5rem 1rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    button:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }

    .loading {
        text-align: center;
        color: #6c757d;
        padding: 1rem;
    }
</style>
