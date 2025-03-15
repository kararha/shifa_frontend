<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { t } from '$lib/utils/i18n';

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
  <!-- Add Corner SVGs -->
  <div class="corner-svg top-left">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect class="svg-rect pulse-element" x="10" y="10" width="30" height="30" />
      <circle class="svg-dot pulse" cx="25" cy="25" r="3" />
      <path class="svg-line" d="M 10 50 Q 25 25, 50 10" fill="none" />
      <circle class="svg-dot moving-dot" cx="50" cy="50" r="2" />
    </svg>
  </div>

  <div class="corner-svg top-right">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect class="svg-rect pulse-element" x="60" y="10" width="30" height="30" />
      <circle class="svg-dot pulse" cx="75" cy="25" r="3" />
      <path class="svg-line" d="M 90 50 Q 75 25, 50 10" fill="none" />
      <circle class="svg-dot moving-dot" cx="50" cy="50" r="2" />
    </svg>
  </div>

  <div class="corner-svg bottom-left">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect class="svg-rect pulse-element" x="10" y="60" width="30" height="30" />
      <circle class="svg-dot pulse" cx="25" cy="75" r="3" />
      <path class="svg-line" d="M 10 50 Q 25 75, 50 90" fill="none" />
      <circle class="svg-dot moving-dot" cx="50" cy="50" r="2" />
    </svg>
  </div>

  <div class="corner-svg bottom-right">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect class="svg-rect pulse-element" x="60" y="60" width="30" height="30" />
      <circle class="svg-dot pulse" cx="75" cy="75" r="3" />
      <path class="svg-line" d="M 90 50 Q 75 75, 50 90" fill="none" />
      <circle class="svg-dot moving-dot" cx="50" cy="50" r="2" />
    </svg>
  </div>

  <div class="max-w-4xl mx-auto">
    {#if isVisible}
      <div class="glass-card transform-3d" 
        style="transform: rotateX({-mouseY}deg) rotateY({mouseX}deg) translateZ(50px)"
        in:fade={{ duration: 1000 }}
      >
        <h1 class="text-4xl font-bold text-white mb-8 text-center glow-text">
          { $t('about.title') }
        </h1>

        <div class="space-y-8 text-gray-200">
          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('about.missionTitle') }</h2>
            <p>
              { $t('about.missionDescription') }
            </p>
          </section>

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

          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('about.providersTitle') }</h2>
            <p>
              { $t('about.providersDescription') }
            </p>
          </section>

          <section class="card-3d">
            <h2 class="text-2xl font-semibold mb-4 text-blue-300">{ $t('about.patientsTitle') }</h2>
            <p>
              { $t('about.patientsDescription') }
            </p>
          </section>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Add floating particles -->
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

  @keyframes float {
    0%, 100% {
      transform: translateZ(20px) rotateX(0deg);
    }
    50% {
      transform: translateZ(40px) rotateX(1deg);
    }
  }

  /* Add fallback for browsers that don't support 3D transforms */
  @supports not (transform-style: preserve-3d) {
    .transform-3d {
      transform: none;
      animation: none;
    }

    .card-3d {
      transform: none;
    }

    .card-3d:hover {
      transform: translateY(-4px);
    }
  }

  .particles {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;
  }

  .particle {
    position: absolute;
    width: var(--size);
    height: var(--size);
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float-particle 10s ease-in-out infinite;
    animation-delay: var(--delay);
  }

  @keyframes float-particle {
    0%, 100% {
      transform: translate3d(0, 0, 0);
    }
    50% {
      transform: translate3d(
        calc(Math.random() * 100 - 50px),
        calc(Math.random() * 100 - 50px),
        50px
      );
    }
  }

  .corner-svg {
    position: fixed;
    width: 150px;
    height: 150px;
    pointer-events: none;
    z-index: 10;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
    transform-style: preserve-3d;
  }

  .top-left {
    top: 0;
    left: 0;
    animation: rotateTopLeft 10s infinite ease-in-out;
  }

  .top-right {
    top: 0;
    right: 0;
    animation: rotateTopRight 10s infinite ease-in-out;
  }

  .bottom-left {
    bottom: 0;
    left: 0;
    animation: rotateBottomLeft 10s infinite ease-in-out;
  }

  .bottom-right {
    bottom: 0;
    right: 0;
    animation: rotateBottomRight 10s infinite ease-in-out;
  }

  @keyframes rotateTopLeft {
    0%, 100% { transform: rotate(0deg) translate3d(-10px, -10px, 20px); }
    50% { transform: rotate(15deg) translate3d(0, 0, 40px); }
  }

  @keyframes rotateTopRight {
    0%, 100% { transform: rotate(0deg) translate3d(10px, -10px, 20px); }
    50% { transform: rotate(-15deg) translate3d(0, 0, 40px); }
  }

  @keyframes rotateBottomLeft {
    0%, 100% { transform: rotate(0deg) translate3d(-10px, 10px, 20px); }
    50% { transform: rotate(-15deg) translate3d(0, 0, 40px); }
  }

  @keyframes rotateBottomRight {
    0%, 100% { transform: rotate(0deg) translate3d(10px, 10px, 20px); }
    50% { transform: rotate(15deg) translate3d(0, 0, 40px); }
  }

  .svg-line {
    stroke: rgba(255, 255, 255, 0.2);
    stroke-width: 1.5;
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: drawLine 4s ease-out infinite;
  }

  @keyframes drawLine {
    to {
      stroke-dashoffset: 0;
    }
  }

  .svg-dot {
    fill: rgba(255, 255, 255, 0.5);
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
      fill: rgba(255, 255, 255, 0.3);
      transform: scale(1) translateZ(0);
    }
    50% {
      fill: rgba(255, 255, 255, 0.6);
      transform: scale(1.5) translateZ(20px);
    }
  }

  .svg-rect {
    fill: rgba(255, 255, 255, 0.1);
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
</style>