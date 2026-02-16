<template>
  <section class="home-hero card">
    <div class="hero-art" aria-hidden="true">
      <div class="floating-card-stack">
        <img
          v-for="(cardFile, index) in selectedFloatingSet"
          :key="`${cardFile}-${index}`"
          class="floating-card"
          :class="`card-${index + 1}`"
          :src="cardImageUrl(cardFile)"
          alt=""
        />
      </div>
    </div>

    <div class="hero-content">
      <p class="eyebrow">Tarot Practice Workspace</p>
      <h2 class="title-text">
        <span>The</span>
        <span>Oracle</span>
        <span>Engine</span>
      </h2>
      <p class="tagline">Symbolic reading, guided by AI.</p>

      <div class="home-actions">
        <RouterLink class="button-link primary home-button" to="/training">Training</RouterLink>
        <RouterLink class="button-link primary home-button" to="/reading">Reading</RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { publicAssetUrl } from "@/app/publicAsset";

const floatingSets: string[][] = [
  [
    "major-00-the-fool.png",
    "major-01-the-magician.png",
    "major-17-the-star.png"
  ],
  [
    "major-18-the-moon.png",
    "major-19-the-sun.png",
    "major-15-the-devil.png"
  ]
];

const selectedFloatingSet = floatingSets[Math.floor(Math.random() * floatingSets.length)];

function cardImageUrl(cardFile: string): string {
  return publicAssetUrl(`cards/${cardFile}`);
}
</script>

<style scoped>
.home-hero {
  width: min(980px, 100%);
  margin: 1.8rem auto;
  min-height: 430px;
  display: grid;
  grid-template-columns: minmax(210px, 300px) 1fr;
  gap: 1rem;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.home-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    url("/symbols/hermetic-tile.svg"),
    url("/symbols/hermetic-grid.svg");
  background-size: 220px 220px, 300px 300px;
  background-position: left 0 top 0, right -20% bottom -40%;
  background-repeat: no-repeat;
  opacity: 0.2;
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.hero-art {
  position: relative;
  min-height: 320px;
  z-index: 1;
}

.floating-card-stack {
  position: absolute;
  inset: 0;
}

.floating-card {
  position: absolute;
  width: clamp(78px, 9vw, 112px);
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
  box-shadow: 0 14px 28px rgba(7, 8, 16, 0.36);
  opacity: 1;
  mix-blend-mode: normal;
  transition: transform 180ms ease;
}

.card-1 {
  --start-rot: -9deg;
  left: 8%;
  top: 6%;
  transform: rotate(var(--start-rot));
  animation: float-card 5.6s ease-in-out infinite;
}

.card-2 {
  --start-rot: 5deg;
  left: 17%;
  top: 18%;
  transform: rotate(var(--start-rot));
  animation: float-card 6.2s ease-in-out infinite reverse;
}

.card-3 {
  --start-rot: 12deg;
  left: 25%;
  top: 9%;
  transform: rotate(var(--start-rot));
  animation: float-card 5.2s ease-in-out infinite;
}

.hero-content {
  z-index: 1;
  display: grid;
  gap: 0.72rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.title-text {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.48rem;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.02;
}

.title-text span {
  display: inline-block;
  opacity: 0;
  transform: translateY(12px);
  animation: reveal-word 560ms ease forwards;
}

.title-text span:nth-child(1) {
  animation-delay: 60ms;
}

.title-text span:nth-child(2) {
  animation-delay: 220ms;
}

.title-text span:nth-child(3) {
  animation-delay: 380ms;
}

.tagline {
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
}

.home-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.3rem;
}

.home-button {
  font-size: 1.05rem;
  min-height: 3rem;
}

@keyframes reveal-word {
  from {
    opacity: 0;
    transform: translateY(12px);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes float-card {
  0% {
    transform: translateY(0) rotate(var(--start-rot, 0deg));
  }
  50% {
    transform: translateY(-6px) rotate(calc(var(--start-rot, 0deg) + 1deg));
  }
  100% {
    transform: translateY(0) rotate(var(--start-rot, 0deg));
  }
}

@media (max-width: 900px) {
  .home-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    margin-top: 1rem;
  }

  .hero-art {
    min-height: 260px;
  }

  .home-actions {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-card,
  .title-text span {
    animation: none;
    opacity: 1;
    transform: none;
    filter: none;
  }
}
</style>
