<script lang="ts">
    import { authStore } from '$lib/stores/authStore';
    import '../app.css';
    import { onMount } from 'svelte';
    import { DEFAULT_AVATAR, BACKEND_URL } from '$lib/constants';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    let isMenuOpen = false;
    let isLoading = false;
    let user: any = null;

    $: user = $authStore.user;
    $: isAuthenticated = $authStore.isAuthenticated;

    onMount(() => {
        try {
            const userCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('user='));
            
            if (userCookie) {
                const userData = decodeURIComponent(userCookie.split('=')[1]);
                const parsedUser = JSON.parse(userData);
                if (parsedUser) {
                    authStore.updateUser(parsedUser);
                }
            }
        } catch (e) {
            console.error('Error in onMount:', e);
        }

        // Check for existing auth
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
            try {
                user = JSON.parse(storedUser);
                console.log('Restored user session:', user);
            } catch (e) {
                console.error('Error parsing stored user:', e);
                // Clear invalid data
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
            }
        }

        // Redirect if not authenticated
        const publicRoutes = ['/login', '/register', '/', '/about'];
        if (!user && !publicRoutes.includes($page.url.pathname)) {
            goto('/login');
        }
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
        switch (user.role) {
            case 'admin': return '/admin-dashboard';
            case 'doctor': return '/doctors/dashboard';
            case 'provider': return '/provider-dashboard';
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
</script>

<div class="layout">
    <nav>
        <div class="nav-content">
            <a href="/" class="logo">Shfia</a>
            <button class="menu-toggle" on:click={toggleMenu}>
                <span class="sr-only">Menu</span>
                <svg viewBox="0 0 24 24" class="h-6 w-6">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
            <div class="nav-links" class:open={isMenuOpen}>
                <a href="/">Home</a>
                <a href="/providers">Home Care Providers</a>
                <a href="/doctors">Doctors</a>
                <a href="/AI">AI</a>
                <a href="/about">About</a>
                <!-- <a href="/contact">Contact</a> -->
                
                {#if isAuthenticated && user}
                    <a href="/payments">Payments</a>
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
                                Dashboard
                            </a>
                            <button class="logout-btn" on:click={logout} disabled={isLoading}>
                                {isLoading ? 'Logging out...' : 'Logout'}
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="auth-buttons">
                        <a href="/login" class="login-btn">Login</a>
                        <a href="/register" class="register-btn">Register</a>
                    </div>
                {/if}
            </div>
        </div>
    </nav>

    <main>
        <slot />
    </main>
</div>

<style>
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
</style>