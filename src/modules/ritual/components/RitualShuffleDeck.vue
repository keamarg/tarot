<template>
  <section class="shuffle-stage" :class="{ complete: isComplete }" aria-live="polite">
    <p class="small instruction" v-if="!isComplete">Shuffling the deck...</p>
    <p class="small instruction" v-else>Tap the deck to begin the reading.</p>

    <button
      class="deck-button"
      type="button"
      :disabled="!isComplete"
      @click="activateDeck"
      :aria-label="isComplete ? 'Activate deck and begin reading' : 'Shuffling deck'"
    >
      <span
        v-for="index in 9"
        :key="`deck-card-${index}`"
        class="deck-card"
        :style="cardStyle(index)"
      >
        <img :src="deckBackUrl" alt="" />
      </span>
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  deckBackUrl: string;
  reducedMotion?: boolean;
}>();

const emit = defineEmits<{
  complete: [];
  activate: [];
}>();

const isComplete = ref(false);
let completeTimer: number | undefined;

const durationMs = computed(() => (props.reducedMotion ? 260 : 2100));

function cardStyle(index: number): Record<string, string> {
  const offset = index - 4;
  return {
    "--offset": String(offset),
    "--delay": `${index * 55}ms`
  };
}

function activateDeck() {
  if (!isComplete.value) {
    return;
  }
  emit("activate");
}

onMounted(() => {
  completeTimer = window.setTimeout(() => {
    isComplete.value = true;
    emit("complete");
  }, durationMs.value);
});

onBeforeUnmount(() => {
  if (completeTimer) {
    window.clearTimeout(completeTimer);
    completeTimer = undefined;
  }
});
</script>

<style scoped>
.shuffle-stage {
  display: grid;
  place-items: center;
  gap: 0.6rem;
  min-height: min(40vh, 300px);
}

.instruction {
  margin: 0;
}

.deck-button {
  position: relative;
  width: min(260px, 48vw);
  aspect-ratio: 3 / 5;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: default;
}

.deck-button:disabled {
  opacity: 1;
}

.shuffle-stage.complete .deck-button {
  cursor: pointer;
}

.deck-card {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  transform-origin: center;
  animation: shuffle-card 880ms ease-in-out infinite;
  animation-delay: var(--delay);
}

.shuffle-stage.complete .deck-card {
  animation: settle-card 380ms ease forwards;
}

.deck-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
  box-shadow: 0 12px 24px rgba(4, 7, 16, 0.48);
}

@keyframes shuffle-card {
  0% {
    transform: translateX(0) translateY(0) rotate(0deg);
    z-index: 10;
  }
  25% {
    transform: translateX(calc(var(--offset) * 3px)) translateY(-6px) rotate(calc(var(--offset) * 1.5deg));
    z-index: 30;
  }
  50% {
    transform: translateX(calc(var(--offset) * -4px)) translateY(4px) rotate(calc(var(--offset) * -2deg));
    z-index: 20;
  }
  100% {
    transform: translateX(0) translateY(0) rotate(0deg);
    z-index: 10;
  }
}

@keyframes settle-card {
  from {
    transform: translateX(calc(var(--offset) * 2px)) translateY(calc(var(--offset) * -0.2px));
  }
  to {
    transform: translateX(0) translateY(0) rotate(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .deck-card {
    animation: none;
  }
}
</style>
