<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';

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

  onMount(() => {
    let interval: NodeJS.Timeout;
    
    async function initialize() {
      try {
        // Fetch featured doctors and providers in parallel
        const [doctorsResponse, providersResponse] = await Promise.all([
          fetch('http://localhost:8888/api/doctors?featured=true'),
          fetch('http://localhost:8888/api/providers?featured=true')
        ]);

        if (!doctorsResponse.ok) throw new Error('Failed to fetch featured doctors');
        if (!providersResponse.ok) throw new Error('Failed to fetch featured providers');

        featuredDoctors = (await doctorsResponse.json()).slice(0, 4);
        featuredProviders = (await providersResponse.json()).slice(0, 4);

        // Image slider interval
        interval = setInterval(() => {
          currentIndex = (currentIndex + 1) % images.length;
        }, 3000);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        loading = false;
      }
    }

    // Add image preloading for slider
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    initialize();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  });
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white mt-10">
  <!-- Hero Section -->
  <section class="relative h-screen">
    <!-- Image Slider -->
    {#each images as image, index}
      <div
        class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style="background-image: url('{image}'); opacity: {index === currentIndex ? 1 : 0};"
      ></div>
    {/each}

    <!-- Gradient Overlay -->
    <div class="absolute inset-0 z-10 bg-gradient-to-b from-blue-900/60 to-blue-800/40"></div>

    <!-- Hero Content -->
    <div class="relative z-20 h-full w-full px-4 lg:px-8">
      <div class="flex flex-col justify-center h-full max-w-7xl mx-auto">
        <div class="max-w-3xl">
          <h1 class="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Complete Healthcare Solutions
          </h1>
          <p class="text-xl md:text-2xl text-blue-100 mb-8">
            Connect with top healthcare professionals and home care providers for comprehensive care.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a
              href="/doctors"
              class="inline-block bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition duration-300 text-lg text-center"
            >
              Find a Doctor
            </a>
            <a
              href="/providers"
              class="inline-block bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 text-lg text-center"
            >
              Find Home Care
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="absolute bottom-0 left-0 right-0 z-20 transform translate-y-1/2 w-full px-4 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white rounded-xl shadow-xl p-8">
          {#each [
            { label: 'Registered Doctors', value: '500+' },
            { label: 'Care Providers', value: '300+' },
            { label: 'Happy Patients', value: '10,000+' },
            { label: 'Specialties', value: '50+' }
          ] as stat}
            <div class="text-center">
              <h3 class="text-3xl font-bold text-blue-900">{stat.value}</h3>
              <p class="text-gray-600 mt-1">{stat.label}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- Doctors Section -->
  <section class="py-32 bg-white w-full">
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
              <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition duration-300 border border-blue-50">
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
        {#if !loading}
          <div>
            <h3 class="text-2xl font-semibold text-blue-900 mb-8">Featured Doctors</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {#each featuredDoctors as doctor}
                <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition duration-300 border border-blue-50">
                  <img
                    use:lazyLoadImage
                    src={doctor.profile_picture_url || 'src/images/avatar.jpg'}
                    alt={doctor.name}
                    class="w-full h-48 object-cover"
                  />
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
          </div>
        {/if}
      </div>
    </div>
  </section>

  <!-- Home Care Providers Section -->
  <section class="py-32 bg-gradient-to-b from-blue-50 to-white w-full">
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
              <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition duration-300 border border-blue-50">
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
        {#if !loading}
          <div>
            <h3 class="text-2xl font-semibold text-blue-900 mb-8">Featured Care Providers</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {#each featuredProviders as provider}
                <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition duration-300 border border-blue-50">
                  <img
                    use:lazyLoadImage
                    src={provider.profile_picture_url || 'src/images/avatar.jpg'}
                    alt={provider.name}
                    class="w-full h-48 object-cover"
                  />
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
          </div>
        {/if}
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
                class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-blue-50 transition-colors duration-200"
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
            class="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition duration-300"
          >
            Search Professionals
          </a>
          <a
            href="/register"
            class="inline-block bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
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
  }

  /* Add smooth transition for FAQ items */
  button {
    transition: all 0.2s ease-in-out;
  }

  /* Add hover effects for cards */
  :global(.card-hover) {
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  :global(.card-hover:hover) {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1);
  }

  /* Enhance section transitions */
  section {
    scroll-margin-top: 100px;
  }

  /* Improve spacing and typography */
  h2 {
    letter-spacing: -0.02em;
  }

  .hero-gradient {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%);
  }
</style>