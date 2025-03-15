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
        padding: 1.5rem;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        margin: 1rem auto;
        position: relative;
        z-index: 1;
        overflow: hidden; /* Add this to contain the blob */
    }

    @media (min-width: 640px) {
        .login-container {
            padding: 2rem;
            margin: 2rem auto;
            width: 100%;
        }
    }

    h2 {
        color: white;
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 1.75em;
    }

    @media (min-width: 640px) {
        h2 {
            margin-bottom: 2rem;
            font-size: 2em;
        }
    }

    .form-group {
        margin-bottom: 1.25rem;
    }

    @media (min-width: 640px) {
        .form-group {
            margin-bottom: 1.5rem;
        }
    }

    label {
        color: white;
        display: block;
        margin-bottom: 0.4rem;
        font-size: 0.9rem;
    }

    @media (min-width: 640px) {
        label {
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }
    }

    input {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 0.9rem;
        box-sizing: border-box;
    }

    @media (min-width: 640px) {
        input {
            padding: 12px;
            border-radius: 10px;
            font-size: 1rem;
        }
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.25);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 0.9rem;
        font-weight: bold;
        cursor: pointer;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        transition: all 0.3s ease;
    }

    @media (min-width: 640px) {
        button {
            padding: 12px;
            border-radius: 10px;
            font-size: 1rem;
        }
    }

    .error-message {
        background: rgba(255, 0, 0, 0.2);
        color: white;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        text-align: center;
        font-size: 0.9rem;
    }

    @media (min-width: 640px) {
        .error-message {
            padding: 10px;
            border-radius: 8px;
            font-size: 1rem;
        }
    }

    .links {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1rem;
        text-align: center;
    }

    @media (min-width: 640px) {
        .links {
            flex-direction: row;
            justify-content: space-between;
            gap: 1rem;
            text-align: left;
        }
    }

    .links a {
        color: white;
        text-decoration: none;
        font-size: 0.85rem;
        opacity: 0.8;
        transition: opacity 0.2s ease;
    }

    @media (min-width: 640px) {
        .links a {
            font-size: 0.9rem;
        }
    }

    .links a:hover {
        opacity: 1;
    }

    /* Touch device optimizations */
    @media (hover: none) {
        button {
            -webkit-tap-highlight-color: transparent;
        }

        input {
            font-size: 16px; /* Prevent zoom on iOS */
        }

        .links a {
            padding: 0.5rem 0; /* Larger touch target */
        }
    }

    /* Fix iOS input styles */
    input {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
    }

    /* Add smooth transitions */
    .login-container, input, button {
        transition: all 0.3s ease;
    }

    /* Update blob styles */
    .blob {
        position: absolute;
        width: 200px; /* Reduced from 500px */
        height: 200px; /* Reduced from 500px */
        background: linear-gradient(
            180deg,
            rgba(47, 184, 255, 0.42) 31.77%,
            #5c9df1 100%
        );
        mix-blend-mode: color-dodge;
        animation: move 25s infinite alternate;
        transition: 1s cubic-bezier(0.07, 0.8, 0.16, 1);
        z-index: -1;
        right: -50px;
        top: -50px;
    }

    .blob:hover {
        width: 220px; /* Reduced from 520px */
        height: 220px;
        filter: blur(30px);
    }

    @keyframes move {
        from {
            transform: translate(-20px, -20px) rotate(-90deg);
            border-radius: 24% 76% 35% 65% / 27% 36% 64% 73%;
        }

        to {
            transform: translate(40px, 40px) rotate(-10deg);
            border-radius: 76% 24% 33% 67% / 68% 55% 45% 32%;
        }
    }

    /* Add responsive blob sizes */
    @media (max-width: 640px) {
        .blob {
            width: 150px;
            height: 150px;
        }

        .blob:hover {
            width: 170px;
            height: 170px;
        }
    }
</style>

<!-- Wrap the container in a responsive wrapper -->
<div class="min-h-screen w-full flex items-center justify-center px-4 py-6 sm:px-6 sm:py-12 overflow-hidden">
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
</div>

<!-- Update diagnostic panel for better mobile view -->
{#if showDiagnostics}
    <div class="fixed bottom-0 left-0 right-0 bg-gray-900/95 text-white p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-auto">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-base sm:text-lg font-bold">Login Diagnostics</h3>
            <button 
                class="text-xs sm:text-sm bg-red-500/50 px-2 py-1 rounded"
                on:click={() => showDiagnostics = false}
            >
                Close
            </button>
        </div>
        <div class="space-y-1 text-xs sm:text-sm font-mono">
            {#each diagnosticLogs as log}
                <div class="border-l-2 border-blue-500 pl-2">{log}</div>
            {/each}
        </div>
    </div>
{/if}