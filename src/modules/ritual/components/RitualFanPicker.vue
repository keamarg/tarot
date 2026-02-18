<template>
  <section class="fan-picker" aria-label="Fan card selection">
    <p class="small fan-copy">
      Choose {{ pickCount }} card<span v-if="pickCount > 1">s</span> in your preferred order.
    </p>

    <div class="fan-centerpiece" aria-hidden="true"></div>

    <div ref="fanCardsRef" class="fan-cards" role="list">
      <button
        v-for="index in candidateCount"
        :key="`fan-card-${index - 1}`"
        type="button"
        role="listitem"
        class="fan-card"
        :class="{ selected: selectedSet.has(index - 1) }"
        :style="fanCardStyle(index - 1)"
        :disabled="disabled || (isSelectionLocked && !selectedSet.has(index - 1))"
        @click="toggle(index - 1)"
      >
        <span class="fan-card-visual">
          <img :src="deckBackUrl" alt="Card back" />
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    candidateCount: number;
    pickCount: number;
    selectedIndices: number[];
    deckBackUrl: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false
  }
);

const emit = defineEmits<{
  "update:selectedIndices": [indices: number[]];
  complete: [indices: number[]];
}>();

const fanCardsRef = ref<HTMLElement | null>(null);
const fanWidth = ref(920);
let resizeObserver: ResizeObserver | undefined;

const selectedSet = computed(() => new Set(props.selectedIndices));
const isSelectionLocked = computed(() => props.selectedIndices.length >= props.pickCount);

function selectionOrder(index: number): number {
  return props.selectedIndices.indexOf(index);
}

function measureFanWidth() {
  fanWidth.value = fanCardsRef.value?.clientWidth ?? 920;
}

function fanCardStyle(index: number): Record<string, string> {
  const maxIndex = Math.max(1, props.candidateCount - 1);
  const centered = index - maxIndex / 2;
  const normalized = centered / (maxIndex / 2);
  const cardWidthPx = props.candidateCount > 64 ? 48 : props.candidateCount > 40 ? 60 : props.candidateCount > 24 ? 74 : 92;
  const cardHeightPx = Math.round(cardWidthPx * (5 / 3));
  const hitWidthPx = props.candidateCount > 64 ? 8 : props.candidateCount > 40 ? 14 : cardWidthPx;
  const availableTravel = Math.max(260, fanWidth.value - cardWidthPx - 58) / 2;
  const rotation = normalized * (props.candidateCount > 64 ? 16 : props.candidateCount > 40 ? 21 : 30);
  const arch = Math.pow(Math.abs(normalized), 1.34) * (props.candidateCount > 64 ? 34 : props.candidateCount > 40 ? 42 : 58);
  const baseLift = props.candidateCount > 64 ? 108 : props.candidateCount > 40 ? 102 : props.pickCount > 1 ? 126 : 114;
  const order = selectionOrder(index);
  const isSelected = order >= 0;
  const width = `${cardWidthPx}px`;
  return {
    "--fan-x": `${normalized * availableTravel}px`,
    "--fan-y": `${-baseLift + arch}px`,
    "--fan-rot": `${rotation}deg`,
    "--fan-z": String(isSelected ? 600 + order : 100 + index),
    "--fan-card-width": width,
    "--fan-card-height": `${cardHeightPx}px`,
    "--fan-hit-width": `${hitWidthPx}px`
  };
}

function toggle(index: number) {
  if (props.disabled) {
    return;
  }

  const existingIndex = props.selectedIndices.indexOf(index);
  if (existingIndex >= 0) {
    const next = props.selectedIndices.filter((candidate) => candidate !== index);
    emit("update:selectedIndices", next);
    return;
  }

  if (props.selectedIndices.length >= props.pickCount) {
    return;
  }

  const next = [...props.selectedIndices, index];
  emit("update:selectedIndices", next);
  if (next.length === props.pickCount) {
    emit("complete", next);
  }
}

onMounted(() => {
  measureFanWidth();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", measureFanWidth);
  }
  if (typeof ResizeObserver !== "undefined" && fanCardsRef.value) {
    resizeObserver = new ResizeObserver(() => {
      measureFanWidth();
    });
    resizeObserver.observe(fanCardsRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", measureFanWidth);
  }
});
</script>

<style scoped>
.fan-picker {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 0.45rem;
  min-height: 100%;
}

.fan-copy {
  margin: 0;
  text-align: center;
  color: color-mix(in srgb, var(--text) 88%, white 12%);
}

.fan-centerpiece {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.fan-centerpiece::before,
.fan-centerpiece::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 40%;
  transform: translate(-50%, -50%);
}

.fan-centerpiece::before {
  width: min(300px, 38vw);
  aspect-ratio: 1;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent-2) 20%, transparent);
  background:
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 72%),
    color-mix(in srgb, var(--surface) 72%, transparent);
  box-shadow:
    0 0 28px color-mix(in srgb, var(--accent-2) 18%, transparent),
    inset 0 0 24px color-mix(in srgb, var(--accent) 12%, transparent);
  opacity: 0.34;
}

.fan-centerpiece::after {
  width: min(188px, 25vw);
  aspect-ratio: 1;
  background: var(--route-symbol-a) center / contain no-repeat;
  opacity: 0.13;
  filter: saturate(1.2);
}

.fan-cards {
  position: relative;
  min-height: clamp(320px, 46vh, 410px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 0.4rem 0.8rem 2.1rem;
  overflow: hidden;
  isolation: isolate;
  transform: translateY(-56px);
  z-index: 1;
}

.fan-card {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: var(--fan-hit-width, var(--fan-card-width, clamp(70px, 7.5vw, 98px)));
  height: var(--fan-card-height, calc(var(--fan-card-width, 80px) * 5 / 3));
  border: 0;
  border-radius: 0;
  overflow: visible;
  padding: 0;
  margin-left: 0;
  background: transparent;
  z-index: var(--fan-z, 100);
  --fan-lift: 0px;
  --fan-glow-opacity: 0;
  transform:
    translateX(var(--fan-x, 0px))
    translateY(calc(var(--fan-y, 0px) - var(--fan-lift)))
    rotate(var(--fan-rot, 0deg));
  transition: transform 180ms ease;
}

.fan-card::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 46%;
  width: calc(var(--fan-card-width, 70px) * 0.96);
  height: calc(var(--fan-card-height, 120px) * 0.72);
  transform: translate(-50%, -50%);
  border-radius: 999px;
  opacity: var(--fan-select-halo, 0);
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--accent-2) 58%, transparent),
    transparent 72%
  );
  filter: blur(10px);
  pointer-events: none;
}

.fan-card-visual {
  position: absolute;
  left: 50%;
  top: 0;
  width: var(--fan-card-width, clamp(70px, 7.5vw, 98px));
  height: 100%;
  border: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
  border-radius: 10px;
  overflow: hidden;
  transform: translateX(-50%);
  background: transparent;
  transition: box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease;
  pointer-events: none;
}

.fan-card:not(.selected) .fan-card-visual {
  filter: saturate(0.9) brightness(0.94);
}

.fan-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.fan-card-visual::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: var(--fan-glow-opacity, 0);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent-2) 72%, transparent),
    0 0 28px color-mix(in srgb, var(--accent-2) 68%, transparent),
    inset 0 0 34px color-mix(in srgb, var(--accent) 28%, transparent);
  background: color-mix(in srgb, var(--accent-2) 18%, transparent);
  pointer-events: none;
}

.fan-card:hover,
.fan-card:focus-visible {
  --fan-lift: 18px;
}

.fan-card:hover .fan-card-visual,
.fan-card:focus-visible .fan-card-visual {
  border-color: color-mix(in srgb, var(--accent) 65%, var(--border));
  box-shadow: 0 16px 28px rgba(4, 7, 16, 0.52);
}

.fan-card.selected {
  --fan-lift: 18px;
  --fan-glow-opacity: 1;
  --fan-select-halo: 1;
}

.fan-card.selected .fan-card-visual {
  transform: translateX(-50%) scale(1.12);
  border-color: color-mix(in srgb, var(--accent-2) 75%, var(--border));
  filter: saturate(1.2) brightness(1.14);
  box-shadow:
    0 16px 30px rgba(22, 46, 66, 0.62),
    0 0 0 1px color-mix(in srgb, var(--accent-2) 44%, transparent);
}

@media (max-width: 980px) {
  .fan-centerpiece::before {
    width: min(220px, 52vw);
    opacity: 0.28;
  }

  .fan-centerpiece::after {
    width: min(148px, 40vw);
  }

  .fan-cards {
    min-height: 280px;
    padding-bottom: 1.8rem;
    transform: translateY(-30px);
  }

}
</style>
