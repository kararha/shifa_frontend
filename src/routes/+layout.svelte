<script lang="ts">
    import { authStore } from '$lib/stores/authStore';
    import '../app.css';
    import { onMount } from 'svelte';
    import { DEFAULT_AVATAR, BACKEND_URL } from '$lib/constants';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { detectUserLanguage, setLanguage } from '$lib/stores/languageStore';
    import '../lib/styles/rtl.css';
    import { initI18n } from '$lib/i18n';
    import { locale, waitLocale } from 'svelte-i18n';
    import { currentLanguage as i18nLang, documentDirection } from '$lib/store/i18n';
    import { t } from '$lib/utils/i18n';
    import { browser } from '$app/environment';
    import { 
        changeLanguage, 
        initializeTranslations, 
        currentLanguage,
        type SupportedLanguages 
    } from '$lib/stores/translations';
    import LanguageSwitch from '$lib/components/LanguageSwitch.svelte';
    
    let isMenuOpen = false;
    let isLoading = true;
    let initialized = false;

    $: user = $authStore.user;
    $: isAuthenticated = $authStore.isAuthenticated;

    // Initialize translations before rendering anything
    onMount(() => {
        async function initialize() {
            if (browser) {
                try {
                    await initI18n();
                    await setLanguage(await detectUserLanguage());

                    // Check auth status
                    const storedUser = localStorage.getItem('user');
                    const token = localStorage.getItem('token');
                    const currentPath = $page.url.pathname;

                    if (storedUser && token) {
                        const userData = JSON.parse(storedUser);
                        authStore.login(userData, token);
                        console.log('Auth restored:', { userData, path: currentPath });
                    }

                    // Define routes
                    const publicRoutes = ['/login', '/register', '/', '/about'];
                    const adminRoutes = ['/admin', '/admin/dashboard'];
                    const userRole = $authStore.user?.role?.toLowerCase();

                    console.log('Route check:', { path: currentPath, role: userRole });

                    // Handle route access
                    if (adminRoutes.some(route => currentPath.startsWith(route))) {
                        if (userRole !== 'admin') {
                            console.log('Admin access denied');
                            await goto('/login');
                            return;
                        }
                    } else if (!publicRoutes.includes(currentPath) && !$authStore.isAuthenticated) {
                        console.log('Protected route - redirecting to login');
                        await goto('/login');
                        return;
                    }

                } catch (error) {
                    console.error('Init error:', error);
                } finally {
                    isLoading = false;
                }
            }
        }

        initialize();
    });

    async function logout() {
        isLoading = true;
        try {
            authStore.logout();
            window.location.href = '/login';
        } finally {
            isLoading = false;
        }
    }

    function handleLogout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        user = null;
        goto('/login');
    }

    // Helper function to get complete image URL
    function getImageUrl(profileUrl: string | null | undefined): string {
        if (!profileUrl) return DEFAULT_AVATAR;
        if (profileUrl.startsWith('http')) return profileUrl;
        return `${BACKEND_URL}${profileUrl}`;
    }

    // Helper function to determine dashboard link based on user role
    function getDashboardLink(user: User | null): string {
        if (!user) return '/dashboard';
        const role = user.role.toLowerCase();
        console.log('Getting dashboard link for role:', role);
        
        switch (role) {
            case 'admin': return '/admin/dashboard';
            case 'doctor': return `/doctors/${user.id}`;
            case 'provider': return `/providers/${user.id}`;
            default: return '/dashboard';
        }
    }

    // Add toggleMenu function
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        console.log('Menu toggled:', isMenuOpen); // Add logging for debugging
    }

    let lastScroll = 0;
    let nav: HTMLElement;

    function handleScroll() {
        const currentScroll = window.pageYOffset;
        
        // Add scrolled class for shadow
        if (currentScroll > 20) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        // Hide nav when scrolling down, show when scrolling up
        if (currentScroll > lastScroll && currentScroll > 100) {
            nav.classList.add('nav-hidden');
        } else {
            nav.classList.remove('nav-hidden');
        }
        
        lastScroll = currentScroll;
    }

    onMount(() => {
        nav = document.querySelector('nav');
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    // Add SEO metadata
    $: metaTitle = $currentLanguage === 'ar' ? 'شفاء - الرعاية الصحية الشاملة' : 'Shfia - Complete Healthcare';
    $: metaDescription = $currentLanguage === 'ar' 
        ? 'منصة شفاء للرعاية الصحية - اتصل بأفضل الأطباء ومقدمي الرعاية المنزلية'
        : 'Shfia Healthcare Platform - Connect with top healthcare professionals and home care providers';

    onMount(() => {
        initializeTranslations();
    });
</script>

<svelte:head>
    {#if $currentLanguage === 'ar'}
        <link rel="stylesheet" href="/fonts/cairo.css">
    {/if}
    <title>{metaTitle}</title>
    <meta name="description" content={metaDescription}>
    <meta property="og:title" content={metaTitle}>
    <meta property="og:description" content={metaDescription}>
    <meta name="twitter:title" content={metaTitle}>
    <meta name="twitter:description" content={metaDescription}>
</svelte:head>

{#if isLoading && browser}
    <div class="loading">Loading...</div>
{:else}
    <div dir={$documentDirection} lang={$currentLanguage} class="app layout">
        <nav>
            <div class="nav-content">
                <div class="left-section">
                    <a href="/" class="logo">Shfia</a>
                </div>

                <button class="menu-toggle" on:click={toggleMenu}>
                    <span class="sr-only">Menu</span>
                    <svg viewBox="0 0 24 24" class="h-6 w-6">
                        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <div class="nav-links" class:open={isMenuOpen}>
                    <a href="/">{ $t('nav.home') }</a>
                    <a href="/providers">{ $t('nav.providers') }</a>
                    <a href="/doctors">{ $t('nav.doctors') }</a>
                    <a href="/AI">{ $t('nav.ai') }</a>
                    <a href="/about">{ $t('nav.about') }</a>
                    <!-- <a href="/contact">Contact</a> -->
                    
                    {#if isAuthenticated && user}
                        <a href="/payments">{ $t('nav.payments') }</a>
                        <div class="user-profile">
                            <img 
                                src={getImageUrl(user?.profile_picture_url)}
                                alt={user?.name}
                                class="profile-image"
                                on:error={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = DEFAULT_AVATAR;
                                }}
                            />
                            <div class="user-menu">
                                <span class="username">{user.name}</span>
                                <a 
                                    href={getDashboardLink(user)} 
                                    class="dashboard-btn"
                                >
                                    {$t('nav.dashboard')}
                                </a>
                                <button class="logout-btn" on:click={logout} disabled={isLoading}>
                                    {isLoading ? $t('nav.loggingOut') : $t('nav.logout')}
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="auth-buttons">
                            <a href="/login" class="login-btn">{ $t('nav.login') }</a>
                            <a href="/register" class="register-btn">{ $t('nav.register') }</a>
                        </div>
                    {/if}
                </div>
                <LanguageSwitch />
            </div>
        </nav>

        <main>
            <slot />
        </main>
    </div>
{/if}

<style>
    .app {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    /* Add these new styles */
    .user-profile {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-left: auto;
        padding-left: 2rem;
    }

    .profile-image {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .username {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
    }

    .logout-btn {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .logout-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 768px) {
        .user-profile {
            flex-direction: column;
            align-items: center;
            margin: 1rem 0;
            padding-left: 0;
        }
    }

    .user-menu {
        display: flex;
        gap: 0.5rem;
    }

    .dashboard-btn {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;    
    }

    .dashboard-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
    }

    /* Add styles for language switcher placement */
    :global(.lang-switch) {
        margin-right: 1rem;
        margin-left: 1rem;
    }

    :global([dir="rtl"]) :global(.lang-switch) {
        margin-right: 1rem;
        margin-left: 0;
    }

    @media (max-width: 768px) {
        :global(.lang-switch) {
            position: absolute;
            top: 1rem;
            right: 4rem;
        }

        :global([dir="rtl"]) :global(.lang-switch) {
            right: auto;
            left: 4rem;
        }
    }

    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 1.2rem;
    }

    .language-switcher {
        margin-left: 1rem;
    }

    .left-section {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    /* RTL support */
    :global([dir="rtl"]) .left-section {
        margin-right: 0;
        margin-left: auto;
    }

    @media (max-width: 768px) {
        .language-btn {
            font-size: 0.75rem;
            padding: 0.375rem 0.75rem;
        }
    }
</style>