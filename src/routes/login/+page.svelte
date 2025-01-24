<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    export let form;

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

        if (result.type === 'success') {
            try {
                // Get the user data from cookies
                const cookieUser = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('user='))
                    ?.split('=')[1];

                logDiagnostic(`Cookie user data: ${cookieUser}`);

                if (!cookieUser) {
                    throw new Error('No user data found in cookies');
                }

                // Parse the user data
                const userData = JSON.parse(decodeURIComponent(cookieUser));
                logDiagnostic(`Parsed user data: ${JSON.stringify(userData)}`);

                // Store in localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('isLoggedIn', 'true');

                // Get token from cookies
                const token = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('token='))
                    ?.split('=')[1];

                if (token) {
                    localStorage.setItem('token', token);
                    logDiagnostic('Token stored in localStorage');
                }

                // Determine redirect path
                let path;
                switch (userData.role?.toLowerCase()) {
                    case 'patient':
                        path = `/patients/${userData.id}`;
                        break;
                    case 'doctor':
                        path = `/doctors/${userData.id}`;
                        break;
                    case 'admin':
                        path = '/admin/dashboard';
                        break;
                    default:
                        path = '/';
                }

                logDiagnostic(`Redirecting to: ${path}`);
                // Force navigation
                window.location.href = path;

            } catch (err) {
                logDiagnostic(`Login error: ${(err as Error).message}`);
                console.error('Login error:', err);
                showDiagnostics = true;
            }
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