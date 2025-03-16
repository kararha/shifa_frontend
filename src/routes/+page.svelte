<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import * as THREE from 'three';
  import { getContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { currentLanguage, currentTranslations, changeLanguage, type SupportedLanguages } from '$lib/stores/translations';
  import { browser } from '$app/environment';

  type Provider = {
    user_id: string;
    name: string;
    profile_picture_url?: string;
    hourly_rate: number;
    rating?: number;
  };

  type Doctor = {
    user_id: string;
    name: string;
    profile_picture_url?: string;
    specialty: string;
    rating?: number;
  };

  let featuredDoctors: Doctor[] = [];
  let featuredProviders: Provider[] = [];
  let loading = true;
  let currentIndex = 0;

  // Image slider configuration
  const images = [
    'src/images/1.jpg',
    'src/images/2.jpg',
    'src/images/3.jpg',
    'src/images/4.jpg'
  ];

  // Doctor specialties
  const doctorSpecialties = [
    { name: 'Cardiology', icon: 'heart', count: 24 },
    { name: 'Neurology', icon: 'brain', count: 18 },
    { name: 'Pediatrics', icon: 'baby', count: 32 },
    { name: 'Orthopedics', icon: 'bone', count: 15 },
    { name: 'Dentistry', icon: 'tooth', count: 28 },
    { name: 'Ophthalmology', icon: 'eye', count: 20 }
  ];

  // Home care service types
  const careServices = [
    { name: 'Elderly Care', icon: 'users', count: 45 },
    { name: 'Rehabilitation', icon: 'activity', count: 30 },
    { name: 'Personal Care', icon: 'heart', count: 25 },
    { name: 'Skilled Nursing', icon: 'plus', count: 20 }
  ];

  // Add image lazy loading
  const lazyLoadImage = (node: HTMLImageElement) => {
    node.loading = "lazy";
    return {
      destroy() {}
    };
  };

  // Add FAQ data
  const faqs = [
    {
      question: "How do I book an appointment with a doctor?",
      answer: "You can book an appointment by visiting the doctor's profile and selecting your preferred time slot. We'll confirm your appointment within 24 hours."
    },
    {
      question: "What types of home care services do you offer?",
      answer: "We offer various home care services including elderly care, rehabilitation, personal care, and skilled nursing. Each service is provided by qualified professionals."
    },
    {
      question: "Are all healthcare providers verified?",
      answer: "Yes, all our healthcare providers undergo thorough background checks and credential verification before joining our platform."
    },
    {
      question: "How do I pay for services?",
      answer: "We offer secure online payment options through our platform. You can pay using credit cards, debit cards, or other supported payment methods."
    }
  ];

  let activeQuestion = -1;

  function toggleQuestion(index: number) {
    activeQuestion = activeQuestion === index ? -1 : index;
  }

  let scrollY: number;
  let innerHeight: number;
  let documentHeight: number;
  let showScrollTop = false;

  // Scroll progress calculation
  $: scrollProgress = (scrollY / (documentHeight - innerHeight)) * 100;

  let container: HTMLDivElement;
  let mounted = false;
  let isMobile: boolean;

  // Add resize observer to check for mobile viewport
  function checkMobile() {
    isMobile = window.innerWidth < 768;
  }

  onMount(() => {
    if (!browser) return;
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Adjust sphere size and position for mobile
    const sphereSize = isMobile ? 3 : 5;
    const geometry = new THREE.SphereGeometry(sphereSize, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.8,
      shininess: 100,
    });
    const sphere = new THREE.Mesh(geometry, material);
    
    // Adjust sphere position for mobile
    function updateSpherePosition() {
      if (isMobile) {
        sphere.position.set(0, 2, -5);
      } else {
        sphere.position.set(5, 2, -10);
      }
    }
    
    updateSpherePosition();
    
    // Add lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    
    scene.add(sphere);
    scene.add(light);
    scene.add(ambientLight);

    camera.position.z = isMobile ? 10 : 15;

    // Animation function with smoother rotation
    function animate() {
      requestAnimationFrame(animate);
      sphere.rotation.x += 0.003;
      sphere.rotation.y += 0.003;
      renderer.render(scene, camera);
    }

    // Start animation
    animate();

    // Handle window resize
    function handleResize() {
      checkMobile();
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateSpherePosition();
    }

    window.addEventListener('resize', handleResize);

    // Add dummy data since API is not available
    featuredDoctors = [
      {
        user_id: "1",
        name: "Dr. John Doe",
        specialty: "Cardiology",
        rating: 4.8,
        profile_picture_url: 'src/images/doctors/doctor1.jpg'
      },
      {
        user_id: "2",
        name: "Dr. Jane Smith",
        specialty: "Neurology",
        rating: 4.9,
        profile_picture_url: 'src/images/doctors/doctor2.jpg'
      },
      {
        user_id: "3",
        name: "Dr. Sarah Johnson",
        specialty: "Pediatrics",
        rating: 4.7,
        profile_picture_url: 'src/images/doctors/doctor3.jpg'
      },
      {
        user_id: "4",
        name: "Dr. Michael Brown",
        specialty: "Orthopedics",
        rating: 4.9,
        profile_picture_url: 'src/images/doctors/doctor4.jpg'
      },
      {
        user_id: "5",
        name: "Dr. Emily Davis",
        specialty: "Dentistry",
        rating: 4.8,
        profile_picture_url: 'src/images/doctors/doctor5.jpg'
      },
      {
        user_id: "6",
        name: "Dr. William Wilson",
        specialty: "Ophthalmology",
        rating: 4.6,
        profile_picture_url: 'src/images/doctors/doctor6.jpg'
      },
      {
        user_id: "7",
        name: "Dr. Lisa Anderson",
        specialty: "Dermatology",
        rating: 4.9,
        profile_picture_url: 'src/images/doctors/doctor7.jpg'
      },
      {
        user_id: "8",
        name: "Dr. Robert Martinez",
        specialty: "Psychology",
        rating: 4.7,
        profile_picture_url: 'src/images/doctors/doctor8.jpg'
      }
    ];

    featuredProviders = [
      {
        user_id: "1",
        name: "Sarah Johnson",
        hourly_rate: 25,
        rating: 4.9,
        profile_picture_url: 'src/images/providers/provider1.jpg'
      },
      {
        user_id: "2",
        name: "Mike Wilson",
        hourly_rate: 30,
        rating: 4.7,
        profile_picture_url: 'src/images/providers/provider2.jpg'
      },
      {
        user_id: "3",
        name: "Emma Thompson",
        hourly_rate: 28,
        rating: 4.8,
        profile_picture_url: 'src/images/providers/provider3.jpg'
      },
      {
        user_id: "4",
        name: "David Clark",
        hourly_rate: 32,
        rating: 4.9,
        profile_picture_url: 'src/images/providers/provider4.jpg'
      },
      {
        user_id: "5",
        name: "Linda Martinez",
        hourly_rate: 27,
        rating: 4.6,
        profile_picture_url: 'src/images/providers/provider5.jpg'
      },
      {
        user_id: "6",
        name: "James Taylor",
        hourly_rate: 35,
        rating: 4.8,
        profile_picture_url: 'src/images/providers/provider6.jpg'
      },
      {
        user_id: "7",
        name: "Patricia Brown",
        hourly_rate: 29,
        rating: 4.7,
        profile_picture_url: 'src/images/providers/provider7.jpg'
      },
      {
        user_id: "8",
        name: "Robert Garcia",
        hourly_rate: 31,
        rating: 4.9,
        profile_picture_url: 'src/images/providers/provider8.jpg'
      }
    ];

    // Set loading to false
    loading = false;
    mounted = true;

    // Image slider interval
    const sliderInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
    }, 3000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', handleResize);
      clearInterval(sliderInterval);
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  });

  // Scroll to top function
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Update scroll position
  function handleScroll() {
    if (!browser) return;
    showScrollTop = window.scrollY > window.innerHeight / 2;
  }

  // Add store subscription
  $: lang = $currentLanguage;
  $: translations = $currentTranslations;
</script>

<svelte:window
  bind:scrollY
  bind:innerHeight
  on:scroll={handleScroll}
/>

<!-- Add scroll progress bar -->
<div
  class="scroll-progress"
  style="transform: scaleX({scrollProgress / 100})"
></div>

<!-- Add scroll to top button -->
{#if showScrollTop}
  <button
    class="scroll-to-top {showScrollTop ? 'visible' : ''}"
    on:click={scrollToTop}
    aria-label="Scroll to top"
  >
    <svg
      class="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      />
    </svg>
  </button>
{/if}

<!-- Add smooth-scroll class to main container -->
<div class="min-h-screen smooth-scroll">
  <!-- Hero Section with responsive adjustments -->
  <section class="relative min-h-[100vh]">
    <!-- Add canvas before other content -->
    <div
      bind:this={container}
      class="absolute inset-0 w-full h-full pointer-events-none opacity-70"
    ></div>
    
    <!-- Image Slider -->
    {#each images as image, index}
      <div
        class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style="background-image: url('{image}'); opacity: {index === currentIndex ? 1 : 0};"
      ></div>
    {/each}

    <!-- Gradient Overlay -->
    <div class="absolute inset-0 z-10 hero-gradient"></div>

    <!-- Updated Hero Content -->
    <div class="relative z-20 h-full w-full px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col justify-center h-full max-w-7xl mx-auto">
        <div class="max-w-3xl mx-auto text-center sm:text-left">
          <h1 
            class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6"
            data-translate
          >
            {translations.hero.title}
          </h1>
          <p 
            class="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8"
            data-translate="hero.subtitle"
          >
            {translations.hero.subtitle}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
            <a href="/doctors" class="btn-secondary text-base sm:text-lg w-full sm:w-auto text-center">
              {translations?.hero?.findDoctor || "Find a Doctor"}
            </a>
            <a href="/providers" class="btn-primary text-base sm:text-lg w-full sm:w-auto text-center">
              {translations?.hero?.findCare || "Find Home Care"}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Updated Stats Section -->
    <div class="absolute -bottom-20 sm:bottom-0 left-0 right-0 z-20 transform sm:translate-y-1/2 w-full px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="stats-card">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {#each [
              { label: 'Registered Doctors', value: '500+' },
              { label: 'Care Providers', value: '300+' },
              { label: 'Happy Patients', value: '10,000+' },
              { label: 'Specialties', value: '50+' }
            ] as stat}
              <div class="text-center p-2 sm:p-4">
                <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stat.value}</h3>
                <p class="text-sm sm:text-base text-gray-300 mt-1">{stat.label}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Add spacing for stats overflow -->
  <div class="h-24 sm:h-32"></div>

  <!-- Doctors Section -->
  <section class="py-16 sm:py-24 md:py-32 bg-white w-full">
    <div class="w-full px-4 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-blue-900">Medical Professionals</h2>
          <p class="mt-4 text-xl text-gray-600">Expert healthcare from qualified doctors</p>
        </div>

        <!-- Doctor Specialties -->
        <div class="mb-20">
          <h3 class="text-2xl font-semibold text-blue-900 mb-8">Our Medical Specialties</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each doctorSpecialties as specialty}
              <div class="modern-card p-6">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span class="text-blue-600">{specialty.icon}</span>
                    </div>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold text-blue-900">{specialty.name}</h3>
                    <p class="text-gray-600">{specialty.count} Doctors</p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Featured Doctors -->
        <div>
          <h3 class="text-2xl font-semibold text-blue-900 mb-8">Featured Doctors</h3>
          {#if loading}
            <div class="text-center py-8">Loading...</div>
          {:else if featuredDoctors.length === 0}
            <div class="text-center py-8">No featured doctors available</div>
          {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {#each featuredDoctors as doctor}
                <div class="modern-card overflow-hidden">
                  <div class="img-container">
                    <img
                      use:lazyLoadImage
                      src={doctor.profile_picture_url || 'src/images/avatar.jpg'}
                      alt={doctor.name}
                      class="w-full h-48 object-cover"
                    />
                  </div>
                  <div class="p-6">
                    <h3 class="text-xl font-semibold text-blue-900">{doctor.name}</h3>
                    <p class="text-gray-600">{doctor.specialty}</p>
                    <div class="mt-4 flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="text-yellow-400">★</span>
                        <span class="ml-1 text-sm text-gray-600">{doctor.rating || '4.8'}</span>
                      </div>
                      <a
                        href={`/doctors/${doctor.user_id}`}
                        class="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Add "View All Doctors" button -->
        <div class="text-center mt-8">
          <a 
            href="/doctors" 
            class="inline-block btn-primary"
          >
            View All Doctors
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Home Care Providers Section -->
  <section class="py-16 sm:py-24 md:py-32 section-gradient w-full">
    <div class="w-full px-4 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-blue-900">Home Care Services</h2>
          <p class="mt-4 text-xl text-gray-600">Professional care in the comfort of your home</p>
        </div>

        <!-- Care Services -->
        <div class="mb-20">
          <h3 class="text-2xl font-semibold text-blue-900 mb-8">Our Care Services</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {#each careServices as service}
              <div class="modern-card p-6">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span class="text-blue-600">{service.icon}</span>
                    </div>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold text-blue-900">{service.name}</h3>
                    <p class="text-gray-600">{service.count} Providers</p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Featured Providers -->
        <div>
          <h3 class="text-2xl font-semibold text-blue-900 mb-8">Featured Care Providers</h3>
          {#if loading}
            <div class="text-center py-8">Loading...</div>
          {:else if featuredProviders.length === 0}
            <div class="text-center py-8">No featured providers available</div>
          {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {#each featuredProviders as provider}
                <div class="modern-card overflow-hidden">
                  <div class="img-container">
                    <img
                      use:lazyLoadImage
                      src={provider.profile_picture_url || 'src/images/avatar.jpg'}
                      alt={provider.name}
                      class="w-full h-48 object-cover"
                    />
                  </div>
                  <div class="p-6">
                    <h3 class="text-xl font-semibold text-blue-900">{provider.name}</h3>
                    <p class="text-gray-600">Home Care Provider</p>
                    <p class="text-sm text-gray-500 mt-1">${provider.hourly_rate}/hour</p>
                    <div class="mt-4 flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="text-yellow-400">★</span>
                        <span class="ml-1 text-sm text-gray-600">{provider.rating || '4.8'}</span>
                      </div>
                      <a
                        href={`/providers/${provider.user_id}`}
                        class="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Add "View All Providers" button -->
        <div class="text-center mt-8">
          <a 
            href="/providers" 
            class="inline-block btn-primary"
          >
            View All Providers
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="py-24 bg-blue-50 w-full">
    <div class="w-full px-4 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-blue-900 mb-4">Frequently Asked Questions</h2>
          <p class="text-xl text-gray-600">Find answers to common questions about our services</p>
        </div>

        <div class="space-y-4">
          {#each faqs as faq, index}
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                class="w-full px-6 py-4 text-left flex items-center justify-between faq-item"
                on:click={() => toggleQuestion(index)}
              >
                <span class="text-lg font-semibold text-blue-900">{faq.question}</span>
                <svg
                  class="w-5 h-5 transform transition-transform duration-200 {activeQuestion === index ? 'rotate-180' : ''}"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if activeQuestion === index}
                <div
                  class="px-6 py-4 bg-blue-50/50"
                  transition:slide={{ duration: 300 }}
                >
                  <p class="text-gray-600">{faq.answer}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-16 bg-blue-900 w-full">
    <div class="w-full px-4 lg:px-8">
      <div class="max-w-7xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-white mb-8">Ready to Get Started?</h2>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="/search"
            class="btn-secondary"
          >
            Search Professionals
          </a>
          <a
            href="/register"
            class="btn-primary"
          >
            Join Our Network
          </a>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  :global(body) {
    @apply antialiased;
    background: linear-gradient(135deg, #0e1538 0%, #1a237e 100%);
  }

  /* Modern card with glassmorphism */
  :global(.modern-card) {
    @apply rounded-2xl transition-all duration-300 hover:-translate-y-1;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  :global(.modern-card:hover) {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.5);
  }

  /* Enhanced gradients */
  :global(.hero-gradient) {
    background: linear-gradient(135deg, 
      rgba(14, 21, 56, 0.8) 0%,
      rgba(26, 35, 126, 0.7) 100%
    );
    backdrop-filter: blur(5px);
  }

  /* Stats card with glassmorphism */
  :global(.stats-card) {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    @apply rounded-2xl p-8;
  }

  /* Button styles with glassmorphism */
  :global(.btn-primary) {
    @apply px-6 py-3 rounded-xl font-semibold transition-all duration-300;
    background: rgba(59, 130, 246, 0.3);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  :global(.btn-primary:hover) {
    background: rgba(59, 130, 246, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.3);
  }

  :global(.btn-secondary) {
    @apply px-6 py-3 rounded-xl font-semibold transition-all duration-300;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
  }

  :global(.btn-secondary:hover) {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.3);
  }

  /* FAQ item with glassmorphism */
  :global(.faq-item) {
    @apply transition-all duration-300;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  :global(.faq-item:hover) {
    background: rgba(255, 255, 255, 0.15);
  }

  /* Section backgrounds */
  :global(.section-gradient) {
    background: linear-gradient(180deg, 
      rgba(14, 21, 56, 0.7) 0%,
      rgba(26, 35, 126, 0.8) 100%
    );
    backdrop-filter: blur(5px);
  }

  /* Add any additional component-specific scroll styles here */
  :global(.smooth-scroll) {
    scroll-padding-top: 80px; /* Match navigation height */
  }

  /* Scroll progress bar */
  :global(.scroll-progress) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #1a237e);
    transform-origin: left;
    z-index: 50;
  }

  /* Scroll to top button */
  :global(.scroll-to-top) {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(59, 130, 246, 0.8);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: none;
    border-radius: 50%;
    padding: 10px;
    cursor: pointer;
    transition: opacity 0.3s, transform 0.3s;
    opacity: 0;
    transform: translateY(20px);
    z-index: 50;
  }

  :global(.scroll-to-top.visible) {
    opacity: 1;
    transform: translateY(0);
  }

  /* Spline canvas styles */
  canvas {
    touch-action: none;
    pointer-events: none; /* Allow clicking through to content */
    opacity: 0.7; /* Adjust opacity to blend with background */
  }

  /* Update mobile-specific styles */
  @media (max-width: 768px) {
    :global(.modern-card) {
      @apply p-4;
    }

    :global(.stats-card) {
      @apply p-4;
      font-size: 0.875rem;
    }

    :global(.hero-gradient) {
      background: linear-gradient(135deg, 
        rgba(14, 21, 56, 0.9) 0%,
        rgba(26, 35, 126, 0.8) 100%
      );
    }
  }

  /* Updated responsive styles */
  :global(.modern-card) {
    @apply rounded-xl sm:rounded-2xl p-4 sm:p-6;
  }

  :global(.stats-card) {
    @apply rounded-xl sm:rounded-2xl p-4 sm:p-8;
    background: rgba(13, 15, 48, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Enhanced mobile styles */
  @media (max-width: 640px) {
    :global(.modern-card) {
      margin-bottom: 1rem;
    }

    :global(.btn-primary),
    :global(.btn-secondary) {
      @apply w-full py-3 px-4 text-sm;
    }

    canvas {
      opacity: 0.4;
    }
  }

  /* Tablet styles */
  @media (min-width: 641px) and (max-width: 1024px) {
    :global(.modern-card) {
      margin-bottom: 1.5rem;
    }
  }

  /* Enhanced animation performance on mobile */
  @media (prefers-reduced-motion: reduce) {
    :global(.modern-card),
    :global(.btn-primary),
    :global(.btn-secondary) {
      transition: none;
    }
  }

  /* Improved touch targets for mobile */
  @media (hover: none) {
    :global(.btn-primary),
    :global(.btn-secondary) {
      @apply min-h-[44px];
    }

    :global(.faq-item) {
      @apply py-4 px-4;
    }
  }

  /* Responsive grid layouts */
  .grid {
    @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6;
  }

  /* Responsive typography */
  h1, h2, h3, h4 {
    @apply tracking-tight;
  }

  /* Responsive spacing */
  section {
    @apply py-12 sm:py-16 md:py-24 lg:py-32;
  }

  .container {
    @apply px-4 sm:px-6 lg:px-8;
  }

  /* Responsive images */
  img {
    @apply w-full h-auto;
    max-height: 300px;
    object-fit: cover;
  }

  /* Enhanced mobile navigation */
  :global(.scroll-to-top) {
    @apply bottom-4 right-4 sm:bottom-8 sm:right-8;
    padding: 12px;
  }

  /* Fix iOS button styles */
  @supports (-webkit-touch-callout: none) {
    :global(.btn-primary),
    :global(.btn-secondary) {
      -webkit-tap-highlight-color: transparent;
    }
  }

  /* Add RTL support */
  :global([dir="rtl"]) .right-4 {
    right: unset;
    left: 1rem;
  }

  :global([dir="rtl"]) .text-left {
    text-align: right;
  }

  :global([dir="rtl"]) .sm\:text-left {
    text-align: right;
  }
</style>