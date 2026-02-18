<template>
  <div
    class="ambient-scene"
    :class="[`scene-${scene.id}`]"
    :style="sceneStyle"
    aria-hidden="true"
  >
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

const sceneStyle = computed(() => ({
  "--smoke-opacity": String(Math.max(0.08, scene.value.smokeDensity)),
  "--deck-shadow-tint": selectedDeck.value.shadowTint ?? "rgba(0, 0, 0, 0.24)"
}));

let unsubscribeCue: (() => void) | undefined;
let removeGestureListener: (() => void) | undefined;

watch(
  () => [
    settingsStore.settings.musicEnabled,
    settingsStore.settings.sfxEnabled,
    settingsStore.settings.masterVolume,
    settingsStore.settings.musicVolume,
    settingsStore.settings.sfxVolume
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
      }
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

</style>
