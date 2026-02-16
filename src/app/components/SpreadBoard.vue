<template>
  <section class="spread-board" :aria-label="`${spread.name} card layout`">
    <header v-if="showHeader" class="spread-header">
      <h3>{{ spread.name }}</h3>
      <p class="small">{{ spread.description }}</p>
    </header>

    <div
      ref="canvasRef"
      class="canvas"
      :class="{ 'minimal-surface': props.minimalSurface }"
      :style="canvasStyle"
      @click="handleCanvasClick"
    >
      <div
        v-for="(slot, index) in spread.slots"
        :key="slot.id"
        class="slot"
        :class="{
          expanded: expandedSlotIndex === index,
          'celtic-present': spread.id === 'celtic-cross' && slot.id === 'present',
          'celtic-challenge': spread.id === 'celtic-cross' && slot.id === 'challenge',
          'celtic-right': spread.id === 'celtic-cross' && (slot.id === 'outcome' || slot.id === 'hopes-fears' || slot.id === 'environment' || slot.id === 'self'),
          'challenge-locked': spread.id === 'celtic-cross' && slot.id === 'challenge' && !celticPresentFaceUp && !fitDebug
        }"
        :style="slotStyle(slot, index)"
      >
        <CardVisual
          v-if="cards[index]"
          :key="`${slot.id}-${cards[index]!.faceUp ? 'up' : 'down'}-${isRevealable(index) ? 'reveal' : 'normal'}`"
          :card-id="cards[index]!.cardId"
          :reversed="cards[index]!.reversed"
          :face-up="cards[index]!.faceUp"
          :expanded="expandedSlotIndex === index"
          :expandable="Boolean(cards[index]!.faceUp)"
          :rotation-deg="slot.rotationDeg"
          :editable="editable"
          :removable="editable"
          :label="slotLabel(slot)"
          :meta-wide="useWideMetaChip"
          :dense-meta="useDenseMeta"
          :dense-label-font-px="densePlacementLabelFontPx"
          :label-above="spread.id === 'celtic-cross' && slot.id === 'challenge'"
          :quarter-offset-y="spread.id === 'celtic-cross' && slot.id === 'challenge' ? -1 : 0"
          :overlay-meta="false"
          compact-meta
          :actionable="isRevealable(index)"
          :action-label="isRevealable(index) ? revealLabel : undefined"
          @edit="$emit('edit-card', index)"
          @remove="$emit('remove-card', index)"
          @activate="$emit('reveal-card', index)"
          @toggle-expand="toggleExpanded(index)"
        />
        <div v-else class="slot-placeholder">
          <p>{{ slot.label }}</p>
          <button
            v-if="editable"
            type="button"
            class="add-card-btn"
            @click="$emit('add-card', index)"
          >
            Add card
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import CardVisual from "@/app/components/CardVisual.vue";
import type { DrawnCard, SpreadDefinition, SpreadSlot } from "@/domain/types";

const props = withDefaults(
  defineProps<{
    spread: SpreadDefinition;
    cards: Array<DrawnCard | undefined>;
    editable?: boolean;
    showHeader?: boolean;
    revealEnabled?: boolean;
    revealableIndex?: number;
    revealLabel?: string;
    minimalSurface?: boolean;
  }>(),
  {
    editable: false,
    showHeader: true,
    revealEnabled: false,
    revealableIndex: -1,
    revealLabel: "Turn Card",
    minimalSurface: false
  }
);

defineEmits<{
  "edit-card": [index: number];
  "remove-card": [index: number];
  "add-card": [index: number];
  "reveal-card": [index: number];
}>();

const canvasRef = ref<HTMLElement | null>(null);
const canvasSize = ref({ width: 0, height: 0 });
const expandedSlotIndex = ref<number | null>(null);
let resizeObserver: ResizeObserver | undefined;
const denseLabelCanvasContext =
  typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;

function spreadWidthProfile(spreadId: string) {
  if (spreadId === "one-card-daily") {
    return { min: 132, max: 300, widthFactor: 0.34, heightFactor: 0.62 };
  }
  if (spreadId === "three-card" || spreadId === "past-present-future") {
    return { min: 118, max: 246, widthFactor: 0.22, heightFactor: 0.58 };
  }
  if (spreadId === "horseshoe") {
    return { min: 82, max: 136, widthFactor: 0.105, heightFactor: 0.25 };
  }
  if (spreadId === "celtic-cross") {
    return { min: 84, max: 142, widthFactor: 0.112, heightFactor: 0.25 };
  }
  return { min: 96, max: 188, widthFactor: 0.17, heightFactor: 0.42 };
}

function isDenseSpread(spreadId: string) {
  return spreadId === "celtic-cross" || spreadId === "horseshoe";
}

function shouldSkipPair(first: SpreadSlot, second: SpreadSlot): boolean {
  if (props.spread.id !== "celtic-cross") {
    return false;
  }
  const ids = [first.id, second.id].sort().join(":");
  return ids === "challenge:present";
}

function minAlignedGapPx(axis: "x" | "y"): number {
  const width = canvasSize.value.width;
  const height = canvasSize.value.height;
  if (width <= 0 || height <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  let minGap = Number.POSITIVE_INFINITY;
  for (let firstIndex = 0; firstIndex < props.spread.slots.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < props.spread.slots.length; secondIndex += 1) {
      const first = props.spread.slots[firstIndex];
      const second = props.spread.slots[secondIndex];
      if (shouldSkipPair(first, second)) {
        continue;
      }

      const dxPct = Math.abs(first.x - second.x);
      const dyPct = Math.abs(first.y - second.y);
      const dxPx = (dxPct / 100) * width;
      const dyPx = (dyPct / 100) * height;

      if (axis === "x") {
        if (dyPct <= 10 && dxPx > 0) {
          minGap = Math.min(minGap, dxPx);
        }
      } else if (dxPct <= 10 && dyPx > 0) {
        minGap = Math.min(minGap, dyPx);
      }
    }
  }

  return minGap;
}

function readCanvasSize() {
  const element = canvasRef.value;
  if (!element) {
    return;
  }
  const rect = element.getBoundingClientRect();
  canvasSize.value = {
    width: Math.max(rect.width, 0),
    height: Math.max(rect.height, 0)
  };
}

onMounted(() => {
  readCanvasSize();
  if (typeof ResizeObserver !== "undefined" && canvasRef.value) {
    resizeObserver = new ResizeObserver(() => readCanvasSize());
    resizeObserver.observe(canvasRef.value);
    return;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("resize", readCanvasSize);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", readCanvasSize);
  }
});

watch(
  () => props.spread.id,
  () => {
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(readCanvasSize);
      return;
    }
    readCanvasSize();
  }
);

const slotWidthPx = computed(() => {
  const profile = spreadWidthProfile(props.spread.id);
  const width = canvasSize.value.width;
  const height = canvasSize.value.height;

  if (width <= 0 || height <= 0) {
    return profile.min;
  }

  const byWidth = width * profile.widthFactor;
  const byHeight = height * profile.heightFactor;
  let next = Math.min(byWidth, byHeight, profile.max);

  if (props.spread.id === "celtic-cross") {
    // For Celtic Cross, enforce room for dense labels below each portrait card.
    const rightStepPx = (24 / 100) * height;
    const labelReservePx = 24;
    const byRightColumn = (rightStepPx - labelReservePx) / (5 / 3);
    const rowGapPx = minAlignedGapPx("x");
    const byRows = Number.isFinite(rowGapPx) ? rowGapPx - 12 : Number.POSITIVE_INFINITY;
    const bottomSpacePx = (21 / 100) * height;
    const byBottomEdge = (bottomSpacePx - labelReservePx - 4) / (5 / 6);
    next = Math.min(next, byRightColumn, byRows, byBottomEdge);
    next = Math.floor(next);
    return Math.max(profile.min, Math.min(next, profile.max));
  }

  if (isDenseSpread(props.spread.id)) {
    const minRowGap = minAlignedGapPx("x");
    const minColumnGap = minAlignedGapPx("y");
    const byRowGap = Number.isFinite(minRowGap) ? (minRowGap - 10) / 1.04 : Number.POSITIVE_INFINITY;
    const byColumnGap = Number.isFinite(minColumnGap)
      ? (minColumnGap - 12) / 1.72
      : Number.POSITIVE_INFINITY;
    next = Math.min(next, byRowGap, byColumnGap);
  }

  next = Math.floor(next);
  const absoluteMin = isDenseSpread(props.spread.id) ? 76 : profile.min;
  return Math.max(absoluteMin, Math.min(next, profile.max));
});

const canvasStyle = computed(() => {
  return {
    "--slot-width": `${slotWidthPx.value}px`
  };
});

const useWideMetaChip = computed(() => slotWidthPx.value <= 70);
const useDenseMeta = computed(() => props.spread.id === "celtic-cross" || props.spread.id === "horseshoe");
const longestPlacementLabel = computed(() => {
  let longest = "";
  for (const slot of props.spread.slots) {
    const text = slot.label?.trim() ?? "";
    if (text.length > longest.length) {
      longest = text;
    }
  }
  return longest;
});
const densePlacementLabelFontPx = computed(() => {
  if (!useDenseMeta.value) {
    return undefined;
  }

  const referenceText = longestPlacementLabel.value;
  if (!referenceText) {
    return 12;
  }

  const availableWidth = Math.max(slotWidthPx.value - 4, 1);
  const ctx = denseLabelCanvasContext;
  if (!ctx) {
    return referenceText.length > 14 ? 10 : 12;
  }

  const fontFamily = "\"Source Serif 4\", Georgia, serif";
  let low = 9;
  let high = 20;
  let best = low;
  for (let index = 0; index < 14; index += 1) {
    const mid = (low + high) / 2;
    ctx.font = `500 ${mid}px ${fontFamily}`;
    const measuredWidth = ctx.measureText(referenceText).width;
    if (measuredWidth <= availableWidth) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return Number(Math.max(9, Math.min(20, best)).toFixed(2));
});
const fitDebug = computed(
  () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debugCardFit") === "1"
);
const celticPresentIndex = computed(() => props.spread.slots.findIndex((slot) => slot.id === "present"));
const celticPresentFaceUp = computed(() => {
  const index = celticPresentIndex.value;
  if (index < 0) {
    return false;
  }
  return Boolean(props.cards[index]?.faceUp);
});

function isRevealable(index: number): boolean {
  if (fitDebug.value) {
    const slotCard = props.cards[index];
    return Boolean(slotCard && !slotCard.faceUp);
  }

  if (!props.revealEnabled) {
    return false;
  }

  if (index !== props.revealableIndex) {
    return false;
  }

  const slot = props.spread.slots[index];
  if (props.spread.id === "celtic-cross" && slot?.id === "challenge" && !celticPresentFaceUp.value) {
    return false;
  }

  const slotCard = props.cards[index];
  return Boolean(slotCard && !slotCard.faceUp);
}

function slotLabel(slot: SpreadSlot) {
  if (props.spread.id === "celtic-cross" && slot.id === "challenge" && !celticPresentFaceUp.value && !fitDebug.value) {
    return "";
  }
  return slot.label;
}

function slotStyle(slot: SpreadSlot, index: number) {
  const isCelticChallenge = props.spread.id === "celtic-cross" && slot.id === "challenge";
  const isCelticPresent = props.spread.id === "celtic-cross" && slot.id === "present";

  const left = slot.x;
  const top = slot.y;
  let zIndex = index + 1;
  if (isCelticPresent) {
    zIndex = celticPresentFaceUp.value ? 70 : 130;
  } else if (isCelticChallenge) {
    zIndex = celticPresentFaceUp.value ? 120 : 80;
  }
  if (expandedSlotIndex.value === index) {
    zIndex = 520;
  }
  if (fitDebug.value && isCelticChallenge) {
    zIndex = expandedSlotIndex.value === index ? 620 : 600;
  }

  return {
    left: `${left}%`,
    top: `${top}%`,
    zIndex,
    width: isCelticChallenge
      ? expandedSlotIndex.value === index
        ? "var(--slot-width)"
        : "calc(var(--slot-width) * 1.6666667)"
      : "var(--slot-width)"
  };
}

function toggleExpanded(index: number) {
  expandedSlotIndex.value = expandedSlotIndex.value === index ? null : index;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(
    element?.closest("button, a, input, textarea, select, option, label, [role='button']")
  );
}

function handleCanvasClick(event: MouseEvent) {
  if (expandedSlotIndex.value === null) {
    return;
  }
  if (isInteractiveTarget(event.target)) {
    return;
  }
  clearExpanded();
}

function clearExpanded() {
  expandedSlotIndex.value = null;
}

watch(
  () => props.cards,
  () => {
    if (expandedSlotIndex.value === null) {
      return;
    }
    const card = props.cards[expandedSlotIndex.value];
    if (!card?.faceUp) {
      expandedSlotIndex.value = null;
    }
  },
  { deep: true }
);
</script>

<style scoped>
.spread-board {
  display: grid;
  gap: 0.55rem;
  overflow: visible;
  height: 100%;
  min-height: 100%;
}

.spread-header h3 {
  margin-bottom: 0.15rem;
}

.canvas {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 0;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.slot {
  position: absolute;
  width: var(--slot-width);
  transform: translate(-50%, -50%);
}

.slot:hover,
.slot:focus-within {
  z-index: 220 !important;
}

.slot.expanded {
  z-index: 520 !important;
}

.slot.challenge-locked {
  pointer-events: none;
}

.slot-placeholder {
  aspect-ratio: 3 / 5;
  border: 1px solid color-mix(in srgb, var(--border) 52%, transparent);
  border-radius: 10px;
  display: grid;
  place-items: center;
  text-align: center;
  font-size: 0.76rem;
  padding: 0.4rem;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.02);
}

.slot.celtic-challenge .slot-placeholder {
  aspect-ratio: 5 / 3;
}

.slot-placeholder p {
  margin: 0;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-card-btn {
  min-height: auto;
  padding: 0.28rem 0.5rem;
}
</style>
