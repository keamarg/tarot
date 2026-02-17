<template>
  <div
    class="ambient-scene"
    :class="[`scene-${scene.id}`]"
    :style="sceneStyle"
    aria-hidden="true"
  >
    <div class="altar-hud">
      <span>{{ spreadName || "Tarot Session" }}</span>
      <span>{{ progressText }}</span>
    </div>

    <div class="candles" :style="{ '--candle-count': String(scene.candleCount) }">
      <span v-for="index in scene.candleCount" :key="`candle-${index}`" class="candle"></span>
    </div>

    <div v-if="scene.crystalPrompt && showCrystalPrompt" class="crystal-ball">
      <span>{{ crystalText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useSettingsStore } from "@/modules/settings/settingsStore";
import { getAmbientSceneById, getDeckById } from "@/modules/decks/deckCatalog";
import { featureFlags } from "@/app/featureFlags";
import { subscribeAmbienceCue } from "@/modules/ambience/audio/ambienceBus";
import { useAudioEngine } from "@/modules/ambience/audio/useAudioEngine";

const props = withDefaults(
  defineProps<{
    spreadName?: string;
    revealedCount?: number;
    totalSlots?: number;
    crystalText?: string;
    showCrystalPrompt?: boolean;
  }>(),
  {
    spreadName: "",
    revealedCount: 0,
    totalSlots: 0,
    crystalText: "Focus on your question.",
    showCrystalPrompt: false
  }
);

const settingsStore = useSettingsStore();
const { ensureStarted, applySettings, setDeckMusicMode, triggerCue } = useAudioEngine();

const scene = computed(() => getAmbientSceneById(settingsStore.settings.sceneId));
const selectedDeck = computed(() => getDeckById(settingsStore.settings.deckId));

const progressText = computed(() => {
  if (!props.totalSlots) {
    return "Awaiting draw";
  }
  return `${props.revealedCount}/${props.totalSlots} revealed`;
});

const sceneStyle = computed(() => ({
  "--smoke-opacity": String(Math.max(0.08, scene.value.smokeDensity)),
  "--deck-shadow-tint": selectedDeck.value.shadowTint ?? "rgba(0, 0, 0, 0.24)",
  "--animation-scale": settingsStore.settings.animationIntensity === "high"
    ? "1"
    : settingsStore.settings.animationIntensity === "low"
      ? "0.55"
      : "0.8"
}));

let unsubscribeCue: (() => void) | undefined;
let removeGestureListener: (() => void) | undefined;

watch(
  () => [
    settingsStore.settings.musicEnabled,
    settingsStore.settings.sfxEnabled,
    settingsStore.settings.masterVolume,
    settingsStore.settings.musicVolume,
    settingsStore.settings.sfxVolume,
    settingsStore.settings.ritualSilenceMode
  ],
  () => {
    if (!featureFlags.generatedAudio) {
      return;
    }
    applySettings(
      {
        musicEnabled: settingsStore.settings.musicEnabled,
        sfxEnabled: settingsStore.settings.sfxEnabled,
        masterVolume: settingsStore.settings.masterVolume,
        musicVolume: settingsStore.settings.musicVolume,
        sfxVolume: settingsStore.settings.sfxVolume
      },
      { ritualSilence: settingsStore.settings.ritualSilenceMode && props.showCrystalPrompt }
    );
  },
  { immediate: true }
);

watch(
  () => selectedDeck.value.id,
  () => {
    setDeckMusicMode(selectedDeck.value.ambienceProfile?.musicMode ?? "neutral");
  },
  { immediate: true }
);

onMounted(() => {
  unsubscribeCue = subscribeAmbienceCue((cue) => {
    triggerCue(cue);
  });

  if (featureFlags.generatedAudio) {
    const onFirstGesture = () => {
      void ensureStarted();
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    removeGestureListener = () => window.removeEventListener("pointerdown", onFirstGesture);
  }
});

onUnmounted(() => {
  unsubscribeCue?.();
  unsubscribeCue = undefined;
  removeGestureListener?.();
  removeGestureListener = undefined;
});
</script>

<style scoped>
.ambient-scene {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.ambient-scene::before,
.ambient-scene::after {
  content: "";
  position: absolute;
  inset: 0;
}

.ambient-scene::before {
  background:
    radial-gradient(circle at 16% 74%, rgba(245, 188, 132, 0.12), transparent 34%),
    radial-gradient(circle at 84% 16%, rgba(130, 186, 211, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(11, 8, 19, 0.28), rgba(11, 8, 19, 0.7));
}

.ambient-scene::after {
  opacity: var(--smoke-opacity, 0.25);
  background:
    radial-gradient(circle at 24% 20%, rgba(255, 255, 255, 0.12), transparent 28%),
    radial-gradient(circle at 62% 28%, rgba(255, 255, 255, 0.09), transparent 30%),
    radial-gradient(circle at 44% 52%, rgba(255, 255, 255, 0.07), transparent 36%);
  filter: blur(14px);
}

.altar-hud {
  position: absolute;
  top: 0.62rem;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid color-mix(in srgb, var(--accent) 36%, var(--border));
  border-radius: 999px;
  padding: 0.22rem 0.58rem;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  display: inline-flex;
  gap: 0.5rem;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.candles {
  position: absolute;
  right: 1rem;
  bottom: 0.9rem;
  display: flex;
  gap: 0.38rem;
}

.candle {
  width: 0.52rem;
  height: 1.7rem;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 234, 188, 0.92), rgba(188, 142, 84, 0.78));
  box-shadow:
    0 0 calc(14px * var(--animation-scale)) rgba(255, 193, 126, 0.65),
    0 0 calc(32px * var(--animation-scale)) rgba(255, 157, 103, 0.3);
  animation: candle-flicker calc(2.8s / var(--animation-scale)) ease-in-out infinite;
}

.candle:nth-child(2n) {
  animation-delay: 0.4s;
}

.crystal-ball {
  position: absolute;
  left: 1rem;
  bottom: 0.9rem;
  width: min(260px, 36vw);
  aspect-ratio: 1;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent-2) 35%, transparent);
  background:
    radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.28), transparent 36%),
    radial-gradient(circle at 52% 52%, rgba(139, 200, 222, 0.18), rgba(34, 43, 74, 0.34));
  display: grid;
  place-items: center;
  box-shadow: 0 16px 30px var(--deck-shadow-tint, rgba(0, 0, 0, 0.3));
}

.crystal-ball span {
  width: 76%;
  text-align: center;
  font-size: 0.86rem;
  color: color-mix(in srgb, var(--text) 86%, white 14%);
  text-shadow: 0 0 14px rgba(167, 214, 255, 0.35);
}

@keyframes candle-flicker {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-1px) scale(1.03);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.88;
  }
}

@media (prefers-reduced-motion: reduce) {
  .candle {
    animation: none;
  }
}
</style>
