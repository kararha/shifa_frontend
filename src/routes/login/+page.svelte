<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/authStore';
    
    // Change from export let to export const
    export const form = null;

    // Diagnostic state
    let diagnosticLogs: string[] = [];
    let showDiagnostics = false;

    function logDiagnostic(message: string) {
        const timestamp = new Date().toISOString();
        diagnosticLogs = [...diagnosticLogs, `[${timestamp}] ${message}`];
        console.log(`Login diagnostic: ${message}`);
    }

    async function handleLoginSuccess(result: { type: string; status?: number; data?: any; error?: any }) {
        logDiagnostic('Login result received');
        logDiagnostic(`Result type: ${result.type}`);
        logDiagnostic(`Status: ${result.status}`);
        logDiagnostic(`Full result: ${JSON.stringify(result)}`); // Add this line for debugging

        if (result.type === 'success') {
            // Access nested data correctly
            const userData = result.data?.data;
            logDiagnostic(`User data: ${JSON.stringify(userData)}`);

            if (!userData?.user) {
                logDiagnostic('Error: No user data in response');
                showDiagnostics = true;
                return;
            }

            const { user, token } = userData;

            // Store in localStorage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            localStorage.setItem('isLoggedIn', 'true');

            // Store user data using the auth store
            authStore.setUser(user);

            // Normalize role to lowercase for comparison
            const userRole = user.role.toLowerCase();
            logDiagnostic(`User role: ${userRole}`);

            const redirectPaths = {
                'patient': `/patients/${user.id}`,
                'doctor': `/doctors/${user.id}`,
                'admin': '/admin/dashboard',
                'home_care_provider': `/providers/${user.id}`
            };

            const redirectPath = redirectPaths[userRole] || '/';
            logDiagnostic(`Redirecting to: ${redirectPath}`);
            goto(redirectPath);
        } else {
            logDiagnostic('Login was not successful');
            showDiagnostics = true;
        }
    }
</script>

<style>
     .login-container {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 2rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        margin: 2rem auto;
    }

    h2 {
        color: white;
        text-align: center;
        margin-bottom: 2rem;
        font-size: 2em;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        color: white;
        display: block;
        margin-bottom: 0.5rem;
    }

    input {
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 16px;
        box-sizing: border-box;
    }

    input::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }

    button {
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.25);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        transition: all 0.3s ease;
    }

    button:hover {
        background: rgba(255, 255, 255, 0.35);
        transform: translateY(-2px);
    }

    .error-message {
        background: rgba(255, 0, 0, 0.2);
        color: white;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 1rem;
        text-align: center;
    }

    .links {
        display: flex;
        justify-content: space-between;
        margin-top: 1rem;
    }
    .links a {
        color: white;
        text-decoration: none;
        font-size: 14px;
        opacity: 0.8;
    }
</style>

<div class="login-container">
    <div class="blob"></div>
    <h2>Login</h2>
    <form 
        method="POST" 
        use:enhance={() => {
            return async ({ result }) => {
                handleLoginSuccess(result);
            };
        }}
    >
        <div class="form-group">
            <label for="email">Email</label>
            <input 
                type="email" 
                id="email"
                name="email"
                placeholder="Enter your email"
                required
            />
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input 
                type="password" 
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                minlength="8"
            />
        </div>
        {#if form?.error}
            <div class="error-message">{form.error}</div>
        {/if}
        <button type="submit">Login</button>
        <div class="links">
            <a href="/register">Create an account</a>
            <a href="/forgot-password">Forgot Password?</a>
        </div>
    </form>
</div>

<!-- Add diagnostic panel -->
{#if showDiagnostics}
    <div class="fixed bottom-0 left-0 right-0 bg-gray-900/95 text-white p-4 max-h-64 overflow-auto">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-bold">Login Diagnostics</h3>
            <button 
                class="text-sm bg-red-500/50 px-2 py-1 rounded"
                on:click={() => showDiagnostics = false}
            >
                Close
            </button>
        </div>
        <div class="space-y-1 text-sm font-mono">
            {#each diagnosticLogs as log}
                <div class="border-l-2 border-blue-500 pl-2">{log}</div>
            {/each}
        </div>
    </div>
{/if}
