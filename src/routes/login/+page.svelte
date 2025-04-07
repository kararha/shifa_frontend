<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/authStore';
    import { t, currentLanguage } from '$lib/i18n';
    import { currentTranslations } from '$lib/stores/translations';
    import { browser } from '$app/environment';
    import { logAuth, showAuthDebugPanel, repairAuthState } from '$lib/utils/authDebug';
    import { onMount } from 'svelte';
    
    export let form;

    // Diagnostic state
    let diagnosticLogs: string[] = [];
    let showDiagnostics = false;

    function logDiagnostic(message: string) {
        const timestamp = new Date().toISOString();
        diagnosticLogs = [...diagnosticLogs, `[${timestamp}] ${message}`];
        console.log(`Login diagnostic: ${message}`);
        // Also log to auth debug
        logAuth('login', message);
    }

    onMount(() => {
        logDiagnostic('Login page mounted');
        
        // Check if user is already logged in
        if (browser) {
            repairAuthState();
            if ($authStore.isAuthenticated) {
                const role = $authStore.user?.role;
                logDiagnostic(`User already authenticated as ${role}, redirecting`);
                
                // Redirect to appropriate page
                setTimeout(() => {
                    redirectBasedOnRole($authStore.user);
                }, 200);
            }
            
            // Show debug panel if on localhost
            if (location.hostname === 'localhost') {
                showAuthDebugPanel();
            }
        }
    });

    function redirectBasedOnRole(user) {
        if (!user?.role) {
            logDiagnostic('No role found for redirect');
            return;
        }
        
        logDiagnostic(`Redirecting based on role: ${user.role}`);
        
        // Use forceful redirect method
        let redirectUrl = '/';
        
        switch (user.role.toLowerCase()) {
            case 'admin':
                redirectUrl = '/admin/dashboard';
                break;
            case 'doctor':
                redirectUrl = `/doctors/${user.id}`;
                break;
            case 'patient':
                redirectUrl = `/patients/${user.id}`;
                break;
            case 'home_care_provider':
                redirectUrl = `/providers/${user.id}`;
                break;
        }
        
        logDiagnostic(`Redirecting to: ${redirectUrl}`);
        window.location.href = redirectUrl;
    }

    async function handleLoginSuccess(result) {
        // This function will now only be called for non-redirect responses
        logDiagnostic('Login result received: ' + JSON.stringify(result));

        // Check if login was successful
        if (result.type === 'success') {
            try {
                // Access the correct data structure
                const userData = result.data?.user;
                const token = result.data?.token;
                
                if (!userData?.id || !userData?.role || !token) {
                    throw new Error('Invalid response data: ' + JSON.stringify(result.data));
                }

                logDiagnostic(`User authenticated: ID=${userData.id}, Role=${userData.role}`);
                
                // Store in localStorage for persistence and client-side checks
                if (browser) {
                    localStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem('token', token);
                    if (result.data.refresh_token) {
                        localStorage.setItem('refresh_token', result.data.refresh_token);
                    }
                    
                    // Use double cookie setting for extra reliability
                    document.cookie = `token=${token}; path=/; max-age=86400`;
                    document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=86400`;
                    
                    // For admin, we delay the redirect a bit to ensure storage is complete
                    if (userData.role === 'admin') {
                        logDiagnostic('Admin user detected, delaying redirect');
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                // Update auth store
                authStore.login(userData, token);
                logDiagnostic('Auth store updated');
                
                // Verify auth store update
                if (!$authStore.isAuthenticated) {
                    logDiagnostic('WARNING: Auth store not showing authenticated after update');
                    // Force repair
                    repairAuthState();
                }
                
                // Short delay to allow store to update
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Use direct redirect for more reliability
                redirectBasedOnRole(userData);
            } catch (err) {
                logDiagnostic(`Error during login: ${err.message}`);
                console.error('Login handler error:', err);
                showDiagnostics = true;
            }
        } else {
            logDiagnostic(`Login failed - Result type: ${result.type}, Error: ${result.error || 'Unknown error'}`);
            showDiagnostics = true;
        }
    }

    $: translations = $currentTranslations;
</script>

<div class="min-h-screen w-full flex items-center justify-center px-4 py-6 sm:px-6 sm:py-12 overflow-hidden">
    <div class="login-container">
        <div class="blob"></div>
        <h2>{$t('login.title')}</h2>
        
        <form method="POST" use:enhance={
            () => {
                return async ({ result, update }) => {
                    try {
                        // Log the submission attempt
                        logDiagnostic(`Form submitted with result type: ${result.type}`);
                        
                        // Handle successful login
                        if (result.type === 'success') {
                            logDiagnostic(`Form data: ${JSON.stringify(result.data)}`);
                            
                            // Check for admin redirect
                            if (result.data?.adminRedirect) {
                                logDiagnostic('Admin redirect detected, redirecting immediately');
                                
                                // Store data in localStorage
                                if (browser) {
                                    localStorage.setItem('user', JSON.stringify(result.data.user));
                                    localStorage.setItem('token', result.data.token);
                                    if (result.data.refresh_token) {
                                        localStorage.setItem('refresh_token', result.data.refresh_token);
                                    }
                                    
                                    // Also set cookies (double redundancy)
                                    document.cookie = `token=${result.data.token}; path=/; max-age=86400`;
                                    document.cookie = `user=${encodeURIComponent(JSON.stringify(result.data.user))}; path=/; max-age=86400`;
                                }
                                
                                // Update auth store
                                authStore.login(result.data.user, result.data.token);
                                
                                // Force redirect after a short delay
                                setTimeout(() => {
                                    logDiagnostic('Executing admin redirect');
                                    window.location.href = '/admin/dashboard';
                                }, 200);
                                
                                return;
                            }
                            
                            // Handle regular successful login
                            await handleLoginSuccess(result);
                        } else if (result.type === 'failure') {
                            logDiagnostic(`Login failed: ${JSON.stringify(result.data)}`);
                            update();
                        } else if (result.type === 'redirect') {
                            logDiagnostic(`Server redirecting to: ${result.location}`);
                            update();
                        } else {
                            logDiagnostic(`Unknown result type: ${result.type}`);
                            update();
                        }
                    } catch (error) {
                        logDiagnostic(`Error during form handling: ${error}`);
                        showDiagnostics = true;
                        update();
                    }
                };
            }
        }>
            <div class="form-group">
                <label for="email">{$t('login.email')}</label>
                <input 
                    type="email" 
                    id="email"
                    name="email"
                    placeholder={$t('login.emailPlaceholder')}
                    required
                />
            </div>
            <div class="form-group">
                <label for="password">{$t('login.password')}</label>
                <input 
                    type="password" 
                    id="password"
                    name="password"
                    placeholder={$t('login.passwordPlaceholder')}
                    required
                    minlength="8"
                />
            </div>
            
            {#if form?.error}
                <div class="error-message">{form.error}</div>
            {/if}
            
            <button type="submit">{$t('login.submit')}</button>
            <div class="links">
                <a href="/register">{$t('login.createAccount')}</a>
                <a href="/forgot-password">{$t('login.forgotPassword')}</a>
            </div>
        </form>
    </div>
</div>

{#if browser && location.hostname === 'localhost'}
    <div class="fixed bottom-4 right-4 z-50">
        <button 
            class="px-4 py-2 bg-blue-500/60 hover:bg-blue-500/80 rounded-lg text-white text-sm"
            on:click={() => showAuthDebugPanel()}
        >
            Auth Debug
        </button>
    </div>
{/if}

{#if showDiagnostics}
    <div class="fixed bottom-0 left-0 right-0 bg-gray-900/95 text-white p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-auto">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-base sm:text-lg font-bold">{$t('login.diagnostics.title')}</h3>
            <button 
                class="text-xs sm:text-sm bg-red-500/50 px-2 py-1 rounded"
                on:click={() => showDiagnostics = false}
            >
                {$t('login.diagnostics.close')}
            </button>
        </div>
        <div class="space-y-1 text-xs sm:text-sm font-mono">
            {#each diagnosticLogs as log}
                <div class="border-l-2 border-blue-500 pl-2">{log}</div>
            {/each}
        </div>
    </div>
{/if}

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