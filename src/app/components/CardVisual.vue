<template>
  <article
    ref="rootRef"
    class="card-visual"
    :class="{
      actionable: isActionable,
      'is-face-up': isFaceUp,
      'is-face-down': !isFaceUp,
      'is-expanded': isExpanded,
      'label-above': labelAbove,
      'compact-meta': compactMeta,
      'dense-meta': denseMeta && !overlayMeta,
      'overlay-meta': overlayMeta,
      'fit-debug': fitDebug
    }"
    :style="expandedStyle"
    @click="onRootClick"
  >
    <button
      v-if="isActionable"
      class="image-shell image-button"
      :class="{ quarter: isQuarterTurn && !isExpanded }"
      type="button"
      :aria-label="actionAriaLabel"
      @click="$emit('activate')"
    >
      <template v-if="!imageError && imageUrl">
        <div v-if="useQuarterFrame" class="quarter-frame">
          <div class="quarter-rotator" :style="quarterImageStyle">
            <img :src="imageUrl" :alt="cardAlt" class="quarter-image" @error="imageError = true" />
          </div>
        </div>
        <img v-else :src="imageUrl" :alt="cardAlt" :style="imageStyle" @error="imageError = true" />
      </template>
      <div v-else class="fallback">
        <p>{{ card?.name ?? cardId }}</p>
      </div>
      <span v-if="actionLabel" class="next-hint">{{ actionLabel }}</span>
    </button>

    <button
      v-else-if="isExpandable"
      class="image-shell image-button"
      :class="{ quarter: isQuarterTurn && !isExpanded }"
      type="button"
      :aria-label="isExpanded ? 'Collapse card view' : 'Expand card view'"
      @click.stop="$emit('toggle-expand')"
    >
      <template v-if="!imageError && imageUrl">
        <div v-if="useQuarterFrame" class="quarter-frame">
          <div class="quarter-rotator" :style="quarterImageStyle">
            <img :src="imageUrl" :alt="cardAlt" class="quarter-image" @error="imageError = true" />
          </div>
        </div>
        <img v-else :src="imageUrl" :alt="cardAlt" :style="imageStyle" @error="imageError = true" />
      </template>
      <div v-else class="fallback">
        <p>{{ card?.name ?? cardId }}</p>
      </div>
    </button>

    <div v-else class="image-shell" :class="{ quarter: isQuarterTurn && !isExpanded }">
      <template v-if="!imageError && imageUrl">
        <div v-if="useQuarterFrame" class="quarter-frame">
          <div class="quarter-rotator" :style="quarterImageStyle">
            <img :src="imageUrl" :alt="cardAlt" class="quarter-image" @error="imageError = true" />
          </div>
        </div>
        <img v-else :src="imageUrl" :alt="cardAlt" :style="imageStyle" @error="imageError = true" />
      </template>
      <div v-else class="fallback">
        <p>{{ card?.name ?? cardId }}</p>
      </div>
    </div>

    <div class="meta-chip" :class="{ wide: metaWide }">
      <div class="meta-text">
        <p v-if="label" ref="labelRef" class="meta-label-line" :title="label" :style="labelTextStyle">{{ label }}</p>
        <p v-if="cardNameText" class="meta-card-name" :title="cardNameText">{{ cardNameText }}</p>
      </div>

      <div v-if="editable || removable" class="meta-actions">
        <button
          v-if="editable"
          class="chip-icon"
          type="button"
          aria-label="Edit card"
          @click.stop="$emit('edit')"
        >
          <Pencil :size="14" />
        </button>
        <button
          v-if="removable"
          class="chip-icon danger"
          type="button"
          aria-label="Remove card"
          @click.stop="$emit('remove')"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Pencil, Trash2 } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from "vue";
import { publicAssetUrl } from "@/app/publicAsset";
import { getCardById } from "@/domain/cards";
import { useSettingsStore } from "@/modules/settings/settingsStore";

const props = defineProps<{
  cardId: string;
  reversed?: boolean;
  faceUp?: boolean;
  editable?: boolean;
  removable?: boolean;
  label?: string;
  rotationDeg?: number;
  actionLabel?: string;
  actionable?: boolean;
  expanded?: boolean;
  expandable?: boolean;
  metaWide?: boolean;
  compactMeta?: boolean;
  denseMeta?: boolean;
  overlayMeta?: boolean;
  denseLabelFontPx?: number;
  labelAbove?: boolean;
  quarterOffsetY?: number;
}>();

const emit = defineEmits<{
  edit: [];
  remove: [];
  activate: [];
  "toggle-expand": [];
}>();

const imageError = ref(false);
const settingsStore = useSettingsStore();
const rootRef = ref<HTMLElement | null>(null);
const labelRef = ref<HTMLElement | null>(null);
const expandTranslateX = ref("0px");
const expandTranslateY = ref("0px");
const expandScale = ref("1");
const expandInverse = ref("1");
const denseLabelFontPx = ref(12);
let denseLabelResizeObserver: ResizeObserver | undefined;
const textMeasureSpan = typeof document !== "undefined" ? document.createElement("span") : null;

if (textMeasureSpan) {
  textMeasureSpan.style.position = "fixed";
  textMeasureSpan.style.left = "-10000px";
  textMeasureSpan.style.top = "-10000px";
  textMeasureSpan.style.visibility = "hidden";
  textMeasureSpan.style.pointerEvents = "none";
  textMeasureSpan.style.whiteSpace = "nowrap";
  textMeasureSpan.style.margin = "0";
  textMeasureSpan.style.padding = "0";
}

const isActionable = computed(() => Boolean(props.actionable));
const compactMeta = computed(() => Boolean(props.compactMeta));
const denseMeta = computed(() => Boolean(props.denseMeta));
const overlayMeta = computed(() => Boolean(props.overlayMeta));
const labelAbove = computed(() => Boolean(props.labelAbove));
const isExpanded = computed(() => Boolean(props.expanded));
const isFaceUp = computed(() => props.faceUp ?? true);
const isExpandable = computed(() => Boolean(props.expandable) && !isActionable.value && isFaceUp.value);
const isQuarterTurn = computed(() => Math.abs((props.rotationDeg ?? 0) % 180) === 90);
const useQuarterFrame = computed(() => isQuarterTurn.value && !isExpanded.value);
const fitDebug = computed(
  () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debugCardFit") === "1"
);

const labelTextStyle = computed<CSSProperties>(() => {
  const isDense = denseMeta.value && !overlayMeta.value;
  if (isDense) {
    const forcedDenseSize = Number(props.denseLabelFontPx);
    const size = Number.isFinite(forcedDenseSize) && forcedDenseSize > 0 ? forcedDenseSize : denseLabelFontPx.value;
    return {
      fontSize: `${size}px`
    };
  }

  const label = props.label?.trim() ?? "";
  const length = Math.max(label.length, 1);
  let size = 0.82;
  if (length > 11) size = 0.78;
  if (length > 15) size = 0.74;
  if (length > 19) size = 0.7;
  if (length > 24) size = 0.66;
  if (length > 30) size = 0.61;
  if (length > 36) size = 0.57;
  return { fontSize: `${size}rem` };
});

const expandedStyle = computed<Record<string, string>>(() => ({
  "--expand-translate-x": expandTranslateX.value,
  "--expand-translate-y": expandTranslateY.value,
  "--expand-scale": expandScale.value,
  "--expand-inverse": expandInverse.value
}));

const card = computed(() => {
  try {
    return getCardById(props.cardId);
  } catch {
    return undefined;
  }
});

const cardImageUrl = computed(() => {
  if (!card.value) {
    return "";
  }
  return publicAssetUrl(`cards/${card.value.image}`);
});

const backImageUrl = computed(() => {
  if (settingsStore.settings.cardBackId === "custom" && settingsStore.settings.customCardBackDataUrl) {
    return settingsStore.settings.customCardBackDataUrl;
  }
  if (settingsStore.settings.cardBackId === "prism") {
    return publicAssetUrl("backs/prism.svg");
  }
  if (settingsStore.settings.cardBackId === "eros") {
    return publicAssetUrl("backs/eros.svg");
  }
  if (settingsStore.settings.cardBackId === "centennial") {
    return publicAssetUrl("backs/centennial.webp");
  }
  return publicAssetUrl("backs/original.webp");
});

const imageUrl = computed(() => ((props.faceUp ?? true) ? cardImageUrl.value : backImageUrl.value));
const cardAlt = computed(() => ((props.faceUp ?? true) ? card.value?.name ?? "Unknown card" : "Card back"));

const imageStyle = computed<CSSProperties>(() => {
  const slotRotation = isExpanded.value && isQuarterTurn.value ? 0 : props.rotationDeg ?? 0;
  const orientationRotation = props.reversed ? 180 : 0;
  return {
    transform: `rotate(${slotRotation + orientationRotation}deg)`
  };
});

const quarterImageStyle = computed<CSSProperties>(() => {
  const orientationRotation = props.reversed ? 180 : 0;
  const rawOffset = Number(props.quarterOffsetY ?? 0);
  const offsetY = Number.isFinite(rawOffset) ? rawOffset : 0;
  return {
    transform: `translate(-50%, calc(-50% + ${offsetY}%)) rotate(${(props.rotationDeg ?? 0) + orientationRotation}deg)`
  };
});

const cardNameText = computed(() => {
  if (!(props.faceUp ?? true)) {
    return "";
  }
  const base = card.value?.name ?? props.cardId;
  if (props.reversed) {
    return `${base} (Reversed)`;
  }
  return base;
});

const actionAriaLabel = computed(() => {
  if (props.actionLabel) {
    return props.actionLabel;
  }
  if (props.label) {
    return `Activate ${props.label}`;
  }
  return "Activate card";
});

function updateExpandedMetrics() {
  if (!isExpanded.value || !isFaceUp.value) {
    expandTranslateX.value = "0px";
    expandTranslateY.value = "0px";
    expandScale.value = "1";
    expandInverse.value = "1";
    return;
  }

  const element = rootRef.value;
  if (!element) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const host =
    element.closest<HTMLElement>(".canvas") ??
    element.closest<HTMLElement>(".cards-board") ??
    element.closest<HTMLElement>(".board-shell");
  const hostRect = host?.getBoundingClientRect();

  const targetWidth = 396;
  const safePadding = denseMeta.value ? 18 : 16;
  const overflowBufferX = denseMeta.value ? 16 : 12;
  const overflowBufferY = denseMeta.value ? 20 : 14;

  const maxScaleFromHost = hostRect
    ? Math.min(
        Math.max(hostRect.width - safePadding * 2 - overflowBufferX, 40) / Math.max(rect.width, 1),
        Math.max(hostRect.height - safePadding * 2 - overflowBufferY, 40) / Math.max(rect.height, 1)
      )
    : 2.0;
  const nextScale = Math.max(1.05, Math.min(2.55, maxScaleFromHost, targetWidth / Math.max(rect.width, 1)));
  expandScale.value = nextScale.toFixed(3);
  expandInverse.value = (1 / nextScale).toFixed(4);

  if (!hostRect) {
    expandTranslateX.value = "0px";
    expandTranslateY.value = "0px";
    return;
  }

  const projectedWidth = rect.width * nextScale + overflowBufferX;
  const projectedHeight = rect.height * nextScale + overflowBufferY;
  const minCenterX = hostRect.left + projectedWidth / 2 + safePadding;
  const maxCenterX = hostRect.right - projectedWidth / 2 - safePadding;
  const minCenterY = hostRect.top + projectedHeight / 2 + safePadding;
  const maxCenterY = hostRect.bottom - projectedHeight / 2 - safePadding;

  const hostCenterX = clamp(hostRect.left + hostRect.width / 2, minCenterX, maxCenterX);
  const hostCenterY = clamp(hostRect.top + hostRect.height / 2, minCenterY, maxCenterY);
  const cardCenterX = rect.left + rect.width / 2;
  const cardCenterY = rect.top + rect.height / 2;
  expandTranslateX.value = `${Math.round(hostCenterX - cardCenterX)}px`;
  expandTranslateY.value = `${Math.round(hostCenterY - cardCenterY)}px`;
}

function clamp(value: number, min: number, max: number): number {
  if (max <= min) {
    return (min + max) / 2;
  }
  return Math.min(max, Math.max(min, value));
}

function onViewportChange() {
  if (!isExpanded.value) {
    return;
  }
  updateExpandedMetrics();
}

function updateDenseLabelFontSize() {
  const label = props.label?.trim() ?? "";
  if (!label || !denseMeta.value || overlayMeta.value) {
    denseLabelFontPx.value = 12;
    return;
  }

  const forcedDenseSize = Number(props.denseLabelFontPx);
  if (Number.isFinite(forcedDenseSize) && forcedDenseSize > 0) {
    denseLabelFontPx.value = Number(forcedDenseSize.toFixed(2));
    return;
  }

  const element = labelRef.value;
  if (!element || !textMeasureSpan) {
    return;
  }

  const chip = element.closest<HTMLElement>(".meta-chip");
  const availableWidth = Math.max((chip?.clientWidth ?? element.clientWidth) - 4, 1);
  const computedStyle = window.getComputedStyle(element);
  textMeasureSpan.style.fontFamily = computedStyle.fontFamily;
  textMeasureSpan.style.fontWeight = computedStyle.fontWeight;
  textMeasureSpan.style.fontStyle = computedStyle.fontStyle;
  textMeasureSpan.style.letterSpacing = computedStyle.letterSpacing;
  textMeasureSpan.textContent = label;

  let low = 9;
  let high = 24;
  let best = low;
  for (let index = 0; index < 14; index += 1) {
    const mid = (low + high) / 2;
    textMeasureSpan.style.fontSize = `${mid}px`;
    const measuredWidth = textMeasureSpan.getBoundingClientRect().width;
    if (measuredWidth <= availableWidth) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  let fitted = Math.max(9, Math.min(20, Number(best.toFixed(2))));
  denseLabelFontPx.value = fitted;

  if (typeof window !== "undefined") {
    window.requestAnimationFrame(() => {
      const liveElement = labelRef.value;
      if (!liveElement || !denseMeta.value || overlayMeta.value) {
        return;
      }
      while (liveElement.scrollWidth > liveElement.clientWidth && fitted > 9) {
        fitted = Number((fitted - 0.2).toFixed(2));
        denseLabelFontPx.value = fitted;
      }
    });
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(
    element?.closest("button, a, input, textarea, select, option, label, [role='button']")
  );
}

function onRootClick(event: MouseEvent) {
  if (isActionable.value) {
    return;
  }
  if (isInteractiveTarget(event.target)) {
    return;
  }

  if (!isExpanded.value) {
    if (!isExpandable.value) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    emit("toggle-expand");
    return;
  }

  event.stopPropagation();
  event.preventDefault();
  emit("toggle-expand");
}

watch(
  () => props.expanded,
  async (expanded) => {
    if (!expanded) {
      updateExpandedMetrics();
      await nextTick();
      updateDenseLabelFontSize();
      return;
    }
    await nextTick();
    updateExpandedMetrics();
    updateDenseLabelFontSize();
  },
  { immediate: true }
);

watch(
  () => [props.label, props.denseMeta, props.overlayMeta, props.denseLabelFontPx],
  async () => {
    await nextTick();
    updateDenseLabelFontSize();
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener("resize", onViewportChange);
  window.addEventListener("scroll", onViewportChange, true);
  if (textMeasureSpan && typeof document !== "undefined" && !textMeasureSpan.parentElement) {
    document.body.appendChild(textMeasureSpan);
  }
  if (typeof ResizeObserver !== "undefined" && rootRef.value) {
    denseLabelResizeObserver = new ResizeObserver(() => updateDenseLabelFontSize());
    denseLabelResizeObserver.observe(rootRef.value);
  }
  nextTick(() => updateDenseLabelFontSize());
  if (typeof document !== "undefined" && "fonts" in document) {
    document.fonts.ready.then(() => updateDenseLabelFontSize());
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onViewportChange);
  window.removeEventListener("scroll", onViewportChange, true);
  denseLabelResizeObserver?.disconnect();
  denseLabelResizeObserver = undefined;
  if (textMeasureSpan?.parentElement) {
    textMeasureSpan.parentElement.removeChild(textMeasureSpan);
  }
});
</script>

<style scoped>
.card-visual {
  position: relative;
  display: grid;
  gap: 0.08rem;
  width: 100%;
  overflow: visible;
  transition: transform 220ms ease, z-index 220ms ease;
  z-index: 1;
}

.image-shell {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 3 / 5;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  padding: 0;
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  transition: transform 220ms ease;
}

.image-shell.quarter {
  aspect-ratio: 5 / 3;
}

.image-shell img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  max-width: none;
  max-height: none;
  transform-origin: center;
}

.quarter-frame {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.quarter-rotator {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(100% * 3 / 5);
  height: calc(100% * 5 / 3);
  display: grid;
  place-items: center;
  transform-origin: center center;
}

.quarter-image {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: contain;
  display: block;
}

.image-button {
  width: 100%;
  padding: 0;
  min-height: auto;
  border-radius: 12px;
  border: 0;
  background: transparent;
}

.card-visual.fit-debug .image-shell {
  outline: 2px solid rgba(255, 102, 102, 0.95);
  outline-offset: -2px;
}

.card-visual.fit-debug .image-shell img {
  outline: 2px solid rgba(112, 233, 150, 0.95);
  outline-offset: -2px;
  background: rgba(112, 233, 150, 0.15);
}

.card-visual.fit-debug .quarter-rotator {
  outline: 2px dashed rgba(255, 205, 95, 0.95);
  outline-offset: -2px;
}

.card-visual.fit-debug .meta-chip {
  outline: 2px solid rgba(92, 186, 255, 0.95);
  outline-offset: -2px;
}

.next-hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 700;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text);
  background: color-mix(in srgb, rgba(10, 10, 20, 0.82) 90%, transparent);
  pointer-events: none;
  animation: pulse-hint 2.3s ease-in-out infinite;
}

.fallback {
  aspect-ratio: 3 / 5;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 0.6rem;
  background: linear-gradient(140deg, rgba(245, 198, 111, 0.18), rgba(112, 208, 198, 0.18));
}

.meta-chip {
  display: grid;
  grid-template-rows: minmax(2.25rem, auto) auto;
  gap: 0.3rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.34rem 0.42rem;
  background: color-mix(in srgb, var(--surface) 90%, rgba(7, 7, 14, 0.95));
  min-height: 4.75rem;
  transition: background 140ms ease, border-color 140ms ease;
}

.meta-chip.wide {
  width: calc(100% + 1.15rem);
  margin-left: -0.575rem;
}

.meta-text {
  min-width: 0;
  display: grid;
  gap: 0.12rem;
}

.meta-label-line {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.1;
  color: var(--muted);
  letter-spacing: 0.01em;
}

.meta-card-name {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  font-weight: 600;
}

.meta-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.2rem;
  margin-top: auto;
}

.chip-icon {
  min-height: auto;
  width: 1.52rem;
  height: 1.52rem;
  padding: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.card-visual.compact-meta .meta-chip {
  min-height: 3.65rem;
  padding: 0.24rem 0.34rem;
}

.card-visual.compact-meta .meta-label-line {
  font-size: 0.68rem;
}

.card-visual.compact-meta .meta-card-name {
  font-size: 0.74rem;
  line-height: 1.12;
}

.chip-icon.danger:hover,
.chip-icon.danger:focus-visible {
  border-color: color-mix(in srgb, var(--danger) 54%, var(--border));
  background: color-mix(in srgb, var(--danger) 18%, var(--surface));
}

@media (hover: hover) {
  .card-visual:not(.is-face-up):hover,
  .card-visual:not(.is-face-up):focus-within {
    transform: scale(1.05);
    z-index: 220;
  }
}

.card-visual.is-expanded {
  transform: translate(var(--expand-translate-x, 0px), var(--expand-translate-y, 0px))
    scale(var(--expand-scale, 1));
  transform-origin: center center;
  z-index: 420;
}

.card-visual.is-expanded:not(.dense-meta) .meta-chip {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.08rem);
  width: calc(100% * var(--expand-scale, 1));
  transform: scale(var(--expand-inverse, 1));
  transform-origin: top left;
}

.card-visual.is-expanded .meta-chip {
  background: color-mix(in srgb, var(--surface) 99%, rgba(8, 8, 14, 0.99));
  border-color: color-mix(in srgb, var(--accent-2) 48%, var(--border));
}

.card-visual.dense-meta .meta-chip {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.05rem);
  z-index: 4;
  min-height: 1.38rem;
  padding: 0.02rem 0.08rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.card-visual.dense-meta:not(.is-expanded) .meta-chip {
  border: 0;
  background: transparent;
}

.card-visual.dense-meta.label-above:not(.is-expanded) .meta-chip {
  top: auto;
  bottom: calc(100% + 0.05rem);
  background: color-mix(in srgb, var(--surface) 56%, rgba(8, 8, 14, 0.52));
}

.card-visual.dense-meta .meta-label-line {
  width: 100%;
  margin: 0;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  text-align: center;
  display: block;
  min-height: 1.08rem;
  padding: 0 0.02rem;
  color: color-mix(in srgb, var(--text) 84%, var(--muted));
}

.card-visual.dense-meta .meta-card-name,
.card-visual.dense-meta .meta-actions {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: max-height 180ms ease, opacity 160ms ease;
}

.card-visual.dense-meta .meta-text {
  width: 100%;
  display: grid;
  align-items: center;
  justify-items: center;
  min-height: 0;
}

.card-visual.dense-meta .meta-actions {
  display: none;
  justify-content: center;
  width: 0;
  min-width: 0;
  margin: 0;
}

.card-visual.dense-meta .meta-chip.wide {
  width: 100%;
  margin-left: 0;
}

.card-visual.dense-meta.is-expanded .meta-chip {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.08rem);
  width: calc(100% * var(--expand-scale, 1));
  display: grid;
  grid-template-rows: auto minmax(1.45rem, 1fr) auto;
  align-items: stretch;
  justify-items: stretch;
  gap: 0.2rem;
  min-height: 4.75rem;
  padding: 0.34rem 0.42rem;
  transform: scale(var(--expand-inverse, 1));
  transform-origin: top left;
  background: color-mix(in srgb, var(--surface) 99%, rgba(8, 8, 14, 0.99));
}

.card-visual.dense-meta.is-expanded .meta-text {
  display: contents;
}

.card-visual.dense-meta.is-expanded .meta-label-line {
  grid-row: 1;
  justify-self: start;
  align-self: start;
  width: 100%;
  min-height: 0;
  padding: 0;
  font-size: 0.72rem;
  line-height: 1.1;
  letter-spacing: 0.01em;
  text-align: left;
  color: var(--muted);
}

.card-visual.dense-meta.is-expanded .meta-card-name,
.card-visual.dense-meta.is-expanded .meta-actions {
  max-height: none;
  opacity: 1;
  overflow: visible;
  pointer-events: auto;
}

.card-visual.dense-meta.is-expanded .meta-card-name {
  grid-row: 2;
  justify-self: center;
  align-self: center;
  font-size: 0.82rem;
  line-height: 1.2;
  text-align: center;
}

.card-visual.dense-meta.is-expanded .meta-actions {
  grid-row: 3;
  display: flex;
  justify-content: flex-end;
  justify-self: end;
  align-self: end;
  width: auto;
  margin-top: 0;
}

.card-visual.dense-meta.is-expanded .chip-icon {
  width: 1.52rem;
  height: 1.52rem;
}

@keyframes pulse-hint {
  0% {
    opacity: 0.8;
    filter: brightness(0.93);
  }
  50% {
    opacity: 0.93;
    filter: brightness(1.02);
  }
  100% {
    opacity: 0.8;
    filter: brightness(0.93);
  }
}

@media (prefers-reduced-motion: reduce) {
  .next-hint {
    animation: none;
  }
}

@media (hover: none) {
  .card-visual.dense-meta .meta-chip {
    min-height: 1.36rem;
  }

  .card-visual.dense-meta .meta-card-name,
  .card-visual.dense-meta .meta-actions {
    max-height: 0;
    opacity: 0;
    pointer-events: none;
  }
}
</style>
