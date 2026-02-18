<template>
  <section class="home-hero card">
    <div class="hero-art">
      <div class="floating-card-stack">
        <img
          v-for="(cardFile, index) in selectedFloatingSet"
          :key="`${cardFile}-${index}`"
          class="floating-card"
          :class="[{ 'lovers-card': cardFile === LOVERS_CARD_ID }, `card-${index + 1}`]"
          :src="cardImageUrl(cardFile)"
          :alt="cardFile === LOVERS_CARD_ID ? 'The Lovers card' : ''"
          :aria-hidden="cardFile === LOVERS_CARD_ID ? 'false' : 'true'"
          :title="cardFile === LOVERS_CARD_ID ? 'Double-click for a hidden scene' : undefined"
          @dblclick="onFloatingCardDoubleClick(cardFile)"
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

    <transition name="lovers-easter">
      <div v-if="showLoversEasterEgg && easterEggImageReady" class="lovers-easter-overlay" aria-hidden="true">
        <div class="lovers-easter-frame">
          <img class="lovers-easter-image" :src="easterEggAssetUrl" alt="" @error="onEasterEggImageError" />
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { RouterLink } from "vue-router";
import { publicAssetUrl } from "@/app/publicAsset";
import { useSettingsStore } from "@/modules/settings/settingsStore";
import { resolveDeckCardImage } from "@/modules/decks/deckResolver";

const settingsStore = useSettingsStore();
const LOVERS_CARD_ID = "major-06-the-lovers";
const showLoversEasterEgg = ref(false);
const easterEggImageReady = ref(true);
let easterEggTimer: number | undefined;

const floatingSets: string[][] = [
  [
    "major-00-the-fool",
    LOVERS_CARD_ID,
    "major-17-the-star"
  ],
  [
    "major-18-the-moon",
    "major-19-the-sun",
    "major-15-the-devil"
  ],
  [
    "major-01-the-magician",
    LOVERS_CARD_ID,
    "major-14-temperance"
  ]
];

const selectedFloatingSet = floatingSets[0];
const easterEggAssetUrl = publicAssetUrl("easter-egg/neurons.jpg");

function cardImageUrl(cardId: string): string {
  return resolveDeckCardImage(settingsStore.settings.deckId, cardId);
}

function onFloatingCardDoubleClick(cardId: string) {
  if (cardId !== LOVERS_CARD_ID) {
    return;
  }
  if (!easterEggImageReady.value) {
    return;
  }
  showLoversEasterEgg.value = true;
  window.clearTimeout(easterEggTimer);
  easterEggTimer = window.setTimeout(() => {
    showLoversEasterEgg.value = false;
  }, 2800);
}

function onEasterEggImageError() {
  easterEggImageReady.value = false;
  showLoversEasterEgg.value = false;
}

onBeforeUnmount(() => {
  window.clearTimeout(easterEggTimer);
});
</script>

<style scoped>
.home-hero {
  width: min(980px, 100%);
  margin: 1.8rem auto;
  min-height: 500px;
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

.hero-art::before {
  content: "";
  position: absolute;
  left: 4%;
  top: 6%;
  width: min(280px, 34vw);
  aspect-ratio: 1;
  border-radius: 999px;
  background:
    radial-gradient(circle at 38% 32%, rgba(255, 255, 255, 0.32), transparent 36%),
    radial-gradient(circle at 52% 52%, color-mix(in srgb, var(--accent-2) 22%, transparent), color-mix(in srgb, var(--surface) 84%, transparent));
  border: 1px solid color-mix(in srgb, var(--accent-2) 36%, transparent);
  box-shadow:
    0 0 34px color-mix(in srgb, var(--accent-2) 26%, transparent),
    inset 0 0 28px color-mix(in srgb, var(--accent) 18%, transparent);
  filter: saturate(1.1);
  pointer-events: none;
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

.lovers-card {
  cursor: pointer;
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
  gap: 0.8rem;
  align-content: center;
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
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  line-height: 0.98;
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
  font-size: 1.06rem;
  max-width: 38ch;
}

.home-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.3rem;
}

.home-button {
  font-size: 1.1rem;
  min-height: 3.2rem;
  letter-spacing: 0.01em;
}

.lovers-easter-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 6;
}

.lovers-easter-frame {
  max-width: min(640px, 74vw);
  max-height: min(360px, 56vh);
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--accent) 42%, transparent);
  background: color-mix(in srgb, var(--surface) 48%, transparent);
  box-shadow:
    0 0 30px color-mix(in srgb, var(--accent) 30%, transparent),
    0 18px 34px rgba(12, 8, 18, 0.54);
  overflow: hidden;
}

.lovers-easter-image {
  display: block;
  width: auto;
  height: auto;
  max-width: min(640px, 74vw);
  max-height: min(360px, 56vh);
  object-fit: contain;
  animation: lovers-glow 2.6s ease-in-out both;
}

.lovers-easter-enter-active,
.lovers-easter-leave-active {
  transition: opacity 700ms ease;
}

.lovers-easter-enter-from,
.lovers-easter-leave-to {
  opacity: 0;
}

.lovers-easter-enter-to,
.lovers-easter-leave-from {
  opacity: 1;
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

@keyframes lovers-glow {
  0% {
    transform: scale(0.96);
    filter: saturate(0.9) brightness(0.92);
  }
  45% {
    transform: scale(1);
    filter: saturate(1.02) brightness(1.04);
  }
  100% {
    transform: scale(1.02);
    filter: saturate(1.05) brightness(1.08);
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
