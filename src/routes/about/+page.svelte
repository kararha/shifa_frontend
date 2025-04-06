<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { t } from '$lib/i18n';

  let isVisible = false;
  let mouseX = 0;
  let mouseY = 0;

  onMount(() => {
    isVisible = true;
  });

  function handleMouseMove(event: MouseEvent) {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    mouseX = (clientX / innerWidth - 0.5) * 20;
    mouseY = (clientY / innerHeight - 0.5) * 20;
  }
</script>

<div 
  class="min-h-screen py-24 px-4 sm:px-6 lg:px-8 perspective-container relative"
  on:mousemove={handleMouseMove}
>
  <!-- Update Corner SVGs with better size and positioning -->
  <div class="corner-svg top-left">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <rect class="svg-rect pulse-element" x="10" y="10" width="30" height="30" fill="rgba(59, 130, 246, 0.1)" />
      <circle class="svg-dot pulse" cx="25" cy="25" r="5" fill="rgba(59, 130, 246, 0.5)" />
      <path class="svg-line" d="M 10 50 Q 25 25, 50 10" fill="none" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1.5" />
      <circle class="svg-dot moving-dot" cx="50" cy="50" r="3" fill="rgba(255, 255, 255, 0.6)" />
    </svg>
  </div>

  <div class="corner-svg top-right">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <rect class="svg-rect pulse-element" x="60" y="10" width="30" height="30" fill="rgba(59, 130, 246, 0.1)" />
      <circle class="svg-dot pulse" cx="75" cy="25" r="5" fill="rgba(59, 130, 246, 0.5)" />
      <path class="svg-line" d="M 90 50 Q 75 25, 50 10" fill="none" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1.5" />
      <circle class="svg-dot moving-dot" cx="50" cy="50" r="3" fill="rgba(255, 255, 255, 0.6)" />
    </svg>
  </div>

  <div class="corner-svg bottom-left">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <rect class="svg-rect pulse-element" x="10" y="60" width="30" height="30" fill="rgba(59, 130, 246, 0.1)" />
      <circle class="svg-dot pulse" cx="25" cy="75" r="5" fill="rgba(59, 130, 246, 0.5)" />
      <path class="svg-line" d="M 10 50 Q 25 75, 50 90" fill="none" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1.5" />
      <circle class="svg-dot moving-dot" cx="50" cy="50" r="3" fill="rgba(255, 255, 255, 0.6)" />
    </svg>
  </div>

  <div class="corner-svg bottom-right">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <rect class="svg-rect pulse-element" x="60" y="60" width="30" height="30" fill="rgba(59, 130, 246, 0.1)" />
      <circle class="svg-dot pulse" cx="75" cy="75" r="5" fill="rgba(59, 130, 246, 0.5)" />
      <path class="svg-line" d="M 90 50 Q 75 75, 50 90" fill="none" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1.5" />
      <circle class="svg-dot moving-dot" cx="50" cy="50" r="3" fill="rgba(255, 255, 255, 0.6)" />
    </svg>
  </div>

  <div class="max-w-5xl mx-auto">
    {#if isVisible}
      <div class="glass-card transform-3d" 
        style="transform: rotateX({-mouseY}deg) rotateY({mouseX}deg) translateZ(50px)"
        in:fade={{ duration: 1000 }}
      >
        <h1 class="text-4xl font-bold text-white mb-8 text-center glow-text">
          { $t('about.title') }
        </h1>

        <div class="space-y-8 text-gray-200">
          <!-- Mission & Vision Section -->
          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('about.missionTitle') }</h2>
            <p>
              { $t('about.missionDescription') }
            </p>
          </section>

          <!-- What We Offer Section -->
          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('about.offerTitle') }</h2>
            <ul class="list-disc pl-6 space-y-3">
              <li>{ $t('about.offerItem1') }</li>
              <li>{ $t('about.offerItem2') }</li>
              <li>{ $t('about.offerItem3') }</li>
              <li>{ $t('about.offerItem4') }</li>
              <li>{ $t('about.offerItem5') }</li>
            </ul>
          </section>

          <!-- Platform Features Section (New) -->
          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('home.features.title') }</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="feature-item">
                <h3 class="text-xl text-white mb-2">{ $t('home.features.verified.title') }</h3>
                <p>{ $t('home.features.verified.description') }</p>
              </div>
              <div class="feature-item">
                <h3 class="text-xl text-white mb-2">{ $t('home.features.available.title') }</h3>
                <p>{ $t('home.features.available.description') }</p>
              </div>
              <div class="feature-item">
                <h3 class="text-xl text-white mb-2">{ $t('home.features.secure.title') }</h3>
                <p>{ $t('home.features.secure.description') }</p>
              </div>
              <div class="feature-item">
                <h3 class="text-xl text-white mb-2">{ $t('home.features.quality.title') }</h3>
                <p>{ $t('home.features.quality.description') }</p>
              </div>
            </div>
          </section>

          <!-- How It Works Section (New) -->
          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('home.howItWorks.title') }</h2>
            <p class="mb-4">{ $t('home.howItWorks.subtitle') }</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="step-item text-center">
                <div class="step-number">1</div>
                <h3 class="text-xl text-white my-3">{ $t('home.howItWorks.steps.search.title') }</h3>
                <p>{ $t('home.howItWorks.steps.search.description') }</p>
              </div>
              <div class="step-item text-center">
                <div class="step-number">2</div>
                <h3 class="text-xl text-white my-3">{ $t('home.howItWorks.steps.book.title') }</h3>
                <p>{ $t('home.howItWorks.steps.book.description') }</p>
              </div>
              <div class="step-item text-center">
                <div class="step-number">3</div>
                <h3 class="text-xl text-white my-3">{ $t('home.howItWorks.steps.consult.title') }</h3>
                <p>{ $t('home.howItWorks.steps.consult.description') }</p>
              </div>
            </div>
          </section>

          <!-- For Providers Section -->
          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('about.providersTitle') }</h2>
            <p>
              { $t('about.providersDescription') }
            </p>
            <div class="mt-4 p-4 bg-blue-900 bg-opacity-30 rounded-lg">
              <h3 class="text-xl text-white mb-2">{ $t('home.cta.doctors.title') }</h3>
              <p class="mb-4">{ $t('home.cta.doctors.subtitle') }</p>
              <a href="/register" class="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white">
                { $t('home.cta.doctors.button') }
              </a>
            </div>
          </section>

          <!-- For Patients Section -->
          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('about.patientsTitle') }</h2>
            <p>
              { $t('about.patientsDescription') }
            </p>
            <div class="stats-grid mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="stat-box p-4 bg-blue-900 bg-opacity-20 rounded-lg text-center">
                <p class="text-xl text-white font-semibold">{ $t('stats.registeredDoctors') }</p>
              </div>
              <div class="stat-box p-4 bg-blue-900 bg-opacity-20 rounded-lg text-center">
                <p class="text-xl text-white font-semibold">{ $t('stats.careProviders') }</p>
              </div>
              <div class="stat-box p-4 bg-blue-900 bg-opacity-20 rounded-lg text-center">
                <p class="text-xl text-white font-semibold">{ $t('stats.happyPatients') }</p>
              </div>
              <div class="stat-box p-4 bg-blue-900 bg-opacity-20 rounded-lg text-center">
                <p class="text-xl text-white font-semibold">{ $t('stats.specialties') }</p>
              </div>
            </div>
          </section>

          <!-- FAQ Section (New) -->
          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('faq.title') }</h2>
            <p class="mb-6">{ $t('faq.subtitle') }</p>
            <div class="space-y-6">
              {#each Array(4) as _, i}
                <div class="faq-item p-4 bg-blue-900 bg-opacity-30 rounded-lg">
                  <h3 class="text-xl text-white mb-2">{ $t(`faq.questions.${i}.question`) }</h3>
                  <p>{ $t(`faq.questions.${i}.answer`) }</p>
                </div>
              {/each}
            </div>
          </section>

          <!-- Contact & Download Section (New) -->
          <section class="card-3d">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('home.download.title') }</h2>
                <p class="mb-4">{ $t('home.download.subtitle') }</p>
                <div class="flex flex-wrap gap-4">
                  <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white">
                    { $t('home.download.android') }
                  </button>
                  <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white">
                    { $t('home.download.ios') }
                  </button>
                </div>
              </div>
              <div>
                <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('cta.title') }</h2>
                <div class="flex flex-wrap gap-4">
                  <a href="/doctors" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white">
                    { $t('cta.search') }
                  </a>
                  <a href="/register" class="px-4 py-2 border border-blue-600 hover:bg-blue-600 hover:bg-opacity-20 rounded-lg transition-colors text-white">
                    { $t('cta.join') }
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Particles remain the same -->
  <div class="particles">
    {#each Array(20) as _, i}
      <div 
        class="particle"
        style="--delay: {i * 0.5}s; --size: {Math.random() * 10 + 5}px"
      />
    {/each}
  </div>
</div>

<style>
  /* Keep existing styles */
  .perspective-container {
    perspective: 2000px;
  }

  .transform-3d {
    transform-style: preserve-3d;
    animation: float 6s ease-in-out infinite;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  .card-3d {
    transform: translateZ(20px);
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s ease;
  }

  .card-3d:hover {
    transform: translateZ(40px) scale(1.02);
  }

  .glow-text {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5),
                 0 0 20px rgba(255, 255, 255, 0.3),
                 0 0 30px rgba(255, 255, 255, 0.2);
  }

  /* Add new styles for the enhanced page */
  .feature-item {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s ease;
  }
  
  .feature-item:hover {
    transform: translateZ(10px) translateY(-5px);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .step-number {
    width: 50px;
    height: 50px;
    background: rgba(59, 130, 246, 0.4);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0 auto;
    color: white;
    border: 2px solid rgba(59, 130, 246, 0.6);
  }
  
  .step-item {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s ease;
  }
  
  .step-item:hover {
    transform: translateZ(10px) translateY(-5px);
    border-color: rgba(59, 130, 246, 0.6);
  }
  
  .faq-item {
    transition: transform 0.3s ease;
  }
  
  .faq-item:hover {
    transform: translateZ(10px) translateY(-2px);
    border: 1px solid rgba(59, 130, 246, 0.4);
  }

  /* Update SVG styling */
  .svg-line {
    stroke: rgba(59, 130, 246, 0.3);
    stroke-width: 1.5;
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: drawLine 4s ease-out infinite;
  }

  .svg-dot {
    fill: rgba(59, 130, 246, 0.5);
  }

  .moving-dot {
    animation: moveAlongPath 4s ease-in-out infinite;
  }

  @keyframes moveAlongPath {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(20px, 20px);
    }
  }

  .svg-dot.pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      fill: rgba(59, 130, 246, 0.3);
      transform: scale(1) translateZ(0);
    }
    50% {
      fill: rgba(123, 157, 255, 0.6);
      transform: scale(1.5) translateZ(20px);
    }
  }

  .svg-rect {
    fill: rgba(59, 130, 246, 0.1);
    transform-origin: center;
    animation: rotateRect 8s ease-in-out infinite;
  }

  @keyframes rotateRect {
    0%, 100% {
      transform: rotate(0deg) translateZ(0);
    }
    50% {
      transform: rotate(180deg) translateZ(30px);
    }
  }

  /* Update SVG corner positioning and size */
  .corner-svg {
    position: fixed;
    width: 80px; /* Reduced from 150px */
    height: 80px; /* Reduced from 150px */
    pointer-events: none;
    z-index: 10;
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.2));
  }

  .top-left {
    top: 0;
    left: 0;
  }

  .top-right {
    top: 0;
    right: 0;
  }

  .bottom-left {
    bottom: 0;
    left: 0;
  }

  .bottom-right {
    bottom: 0;
    right: 0;
  }

  /* Simplify SVG animations for a more subtle effect */
  @keyframes rotateTopLeft {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(5deg); }
  }

  @keyframes rotateTopRight {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-5deg); }
  }

  @keyframes rotateBottomLeft {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-5deg); }
  }

  @keyframes rotateBottomRight {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(5deg); }
  }

  /* Keep the rest of your existing styles */
  @keyframes float {
    0%, 100% {
      transform: translateZ(20px) rotateX(0deg);
    }
    50% {
      transform: translateZ(40px) rotateX(1deg);
    }
  }

  /* ...existing animation and particle styles... */
</style>