<script lang="ts">
    import { z } from 'zod';
    import { goto } from '$app/navigation';
    import { t } from '$lib/utils/i18n';
    import { currentLanguage, currentTranslations } from '$lib/stores/translations';

    // User role type
    type UserRole = 'patient' | 'doctor' | 'home_care_provider' | 'admin';

    // Base registration schema
    const registrationSchema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email format"),
        password: z.string()
            .min(8, "Password must be at least 8 characters")
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
                "Password must include uppercase, lowercase, number, and special character")
    });

    // Role-specific schemas matching backend models
    const roleSchemas = {
        patient: z.object({
            dateOfBirth: z.string(),
            gender: z.enum(['male', 'female', 'other']),
            phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
        }),
        doctor: z.object({
            specialty: z.string().min(2),
            licenseNumber: z.string().min(6),
            experienceYears: z.number().min(0).max(70),
            consultationFee: z.number().positive(),
            serviceTypeId: z.number().positive()
        }),
        home_care_provider: z.object({
            certificationNumber: z.string().min(6),
            experienceYears: z.number().min(0).max(70),
            hourlyRate: z.number().positive()
        }),
        admin: z.object({
            adminCode: z.string().optional()
        })
    };

    let stage: 'basic-info' | 'role-selection' | 'role-details' = 'basic-info';
    let userData = {
        name: '',
        email: '',
        password: '',
        role: undefined as UserRole | undefined
    };
    let roleDetailsData: Record<string, any> = {};
    let errors: Record<string, string[]> = {};
    let isSubmitting = false;
    const roles: UserRole[] = ['patient', 'doctor', 'home_care_provider', 'admin'];

    async function handleBasicRegistration() {
        try {
            isSubmitting = true;
            
            const response = await fetch('http://localhost:8888/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,
                    role: userData.role
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Registration failed');
            }

            // Store both user ID and token
            localStorage.setItem('tempUserId', result.user.id.toString());
            localStorage.setItem('token', result.token);
            
            // Redirect based on role
            switch (userData.role) {
                case 'doctor':
                    await goto('/doctors/register');
                    break;
                case 'patient':
                    await goto('/patients/register');
                    break;
                case 'home_care_provider':
                    await goto('/providers/register');
                    break;
                case 'admin':
                    await goto('/admin/register');
                    break;
                default:
                    await goto('/login?registered=true');
            }

        } catch (error) {
            console.error('Registration error:', error);
            errors = { 
                submit: [error instanceof Error ? error.message : 'Registration failed']
            };
        } finally {
            isSubmitting = false;
        }
    }

    function goBack() {
        if (stage === 'role-selection') {
            stage = 'basic-info';
        } else if (stage === 'role-details') {
            stage = 'role-selection';
        }
        errors = {};
    }

    async function handleBasicInfoSubmit(event: Event) {
        try {
            const validatedData = registrationSchema.parse(userData);
            stage = 'role-selection';
            errors = {};
        } catch (error) {
            if (error instanceof z.ZodError) {
                errors = Object.fromEntries(
                    Object.entries(error.flatten().fieldErrors)
                        .filter(([_, value]) => value !== undefined)
                ) as Record<string, string[]>;
            }
        }
    }

    function handleRoleSelect(role: UserRole) {
        userData.role = role;
        stage = 'role-details';
        // Initialize role-specific data based on selected role
        roleDetailsData = {
            user_id: '', // Will be filled after user creation
            ...(role === 'patient' && {
                dateOfBirth: '',
                gender: '',
                phone: ''
            }),
            ...(role === 'doctor' && {
                specialty: '',
                licenseNumber: '',
                experienceYears: 0,
                consultationFee: 0,
                serviceTypeId: 0
            }),
            ...(role === 'home_care_provider' && {
                certificationNumber: '',
                experienceYears: 0,
                hourlyRate: 0
            }),
            ...(role === 'admin' && {
                adminCode: ''
            })
        };
    }

    async function handleSubmit(event: Event) {
        event.preventDefault();
        if (stage === 'role-details') {
            await handleBasicRegistration();
        } else if (stage === 'basic-info') {
            handleBasicInfoSubmit(event);
        }
    }

    $: translations = $currentTranslations;
</script>

<div class="registration-container">
    <div class="blob"></div>
    <h2>{$t('register.userRegistration')}</h2>

    {#if stage === 'basic-info'}
        <form on:submit|preventDefault={handleBasicInfoSubmit}>
            <div class="form-group">
                <label for="name">{$t('register.basicInfo.fullName')}</label>
                <input 
                    type="text" 
                    id="name" 
                    bind:value={userData.name}
                    required
                />
                {#if errors.name}
                    <span class="error">{errors.name[0]}</span>
                {/if}
            </div>

            <div class="form-group">
                <label for="email">{$t('register.basicInfo.email')}</label>
                <input 
                    type="email" 
                    id="email" 
                    bind:value={userData.email}
                    required
                />
                {#if errors.email}
                    <span class="error">{errors.email[0]}</span>
                {/if}
            </div>

            <div class="form-group">
                <label for="password">{$t('register.basicInfo.password')}</label>
                <input 
                    type="password" 
                    id="password" 
                    bind:value={userData.password}
                    required
                />
                {#if errors.password}
                    <span class="error">{errors.password[0]}</span>
                {/if}
            </div>

            <button type="submit">{$t('register.basicInfo.next')}</button>
        </form>
    {:else if stage === 'role-selection'}
        <div class="role-selection">
            <h3>{$t('register.roleSelection.title')}</h3>
            <button on:click={goBack}>{$t('register.roleSelection.back')}</button>
            {#each roles as role}
                <button 
                    on:click={() => handleRoleSelect(role)}
                    class="role-button"
                >
                    {$t(`register.roleSelection.${role}`)}
                </button>
            {/each}
        </div>
    {:else if stage === 'role-details' && userData.role}
        <form on:submit|preventDefault={handleSubmit}>
            <button type="button" on:click={goBack}>{$t('register.roleDetails.back')}</button>
            
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? $t('register.roleDetails.registering') : $t('register.roleDetails.continue')}
            </button>

            {#if errors.submit}
                <span class="error">{$t('register.error.submit')}</span>
            {/if}
        </form>
    {/if}
</div>
<style>

    .header {
        background-color: #1a202c;
        color: #ffffff;
        padding: 1rem;
        text-align: center;
    }

    .form-container {
        
        margin: 2rem auto;
        padding: 2rem;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-group {
        margin-bottom: 0.1px;
    }

    label {
        display: block;
        color: #000000;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #cbd5e0;
        border-radius: 4px;
        background-color: #ffffff;
        color: #000000;
        transition: all 0.2s;
    }

    input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .error {
        color: #e53e3e;
        font-size: 0.875rem;
        margin-top: 0.5rem;
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

    .registration-container {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        padding: 2rem;
        width: 100%;
        max-width: 500px;
        margin: 2rem auto;
        position: relative; /* Added to allow absolute positioning of blob */
    }

    h2, h3 {
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        color: white;
        display: block;
        margin-bottom: 0.5rem;
    }

    input, select {
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 16px;
        margin-bottom: 1rem;
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
        margin-bottom: 1rem;
    }

    button:hover {
        background: rgba(255, 255, 255, 0.35);
        transform: translateY(-2px);
    }

    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .role-selection {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
    }

    .role-button {
        background: rgba(255, 255, 255, 0.15);
        padding: 1.5rem;
        border-radius: 15px;
        transition: all 0.3s ease;
    }

    .role-button:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-5px);
    }

    .error {
        color: #ff4444;
        font-size: 0.9em;
        margin-top: 0.5rem;
        background: rgba(255, 0, 0, 0.1);
        padding: 0.5rem;
        border-radius: 5px;
    }

    .card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
    }

    @media (max-width: 600px) {
        .registration-container {
            margin: 1rem;
            padding: 1rem;
        }

        .role-selection {
            grid-template-columns: 1fr;
        }
    }
</style>
