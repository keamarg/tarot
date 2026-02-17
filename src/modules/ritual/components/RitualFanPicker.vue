<template>
  <section class="fan-picker" aria-label="Fan card selection">
    <p class="small fan-copy">
      Choose {{ pickCount }} card<span v-if="pickCount > 1">s</span> in your preferred order.
    </p>

    <div class="fan-cards" role="list">
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
        <img :src="deckBackUrl" alt="Card back" />
        <span v-if="selectionOrder(index - 1) >= 0" class="pick-badge">{{ selectionOrder(index - 1) + 1 }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

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

const selectedSet = computed(() => new Set(props.selectedIndices));
const isSelectionLocked = computed(() => props.selectedIndices.length >= props.pickCount);

function selectionOrder(index: number): number {
  return props.selectedIndices.indexOf(index);
}

function fanCardStyle(index: number): Record<string, string> {
  const center = (props.candidateCount - 1) / 2;
  const offset = index - center;
  const rotation = offset * 4.4;
  const lift = Math.abs(offset) * 0.9;
  return {
    transform: `translateX(${offset * 12}px) translateY(${lift}px) rotate(${rotation}deg)`,
    zIndex: String(100 + index)
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
</script>

<style scoped>
.fan-picker {
  display: grid;
  gap: 0.5rem;
}

.fan-copy {
  margin: 0;
}

.fan-cards {
  position: relative;
  min-height: 220px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-inline: 0.5rem;
}

.fan-card {
  position: relative;
  width: clamp(78px, 9vw, 106px);
  aspect-ratio: 3 / 5;
  border: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
  border-radius: 10px;
  overflow: hidden;
  padding: 0;
  margin-left: -1.5rem;
  background: transparent;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.fan-card:first-child {
  margin-left: 0;
}

.fan-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fan-card:hover,
.fan-card:focus-visible {
  transform: translateY(-8px) !important;
  border-color: color-mix(in srgb, var(--accent) 65%, var(--border));
  box-shadow: 0 12px 24px rgba(4, 7, 16, 0.48);
}

.fan-card.selected {
  border-color: color-mix(in srgb, var(--accent-2) 75%, var(--border));
  box-shadow: 0 12px 26px rgba(22, 46, 66, 0.5);
}

.pick-badge {
  position: absolute;
  top: 0.28rem;
  right: 0.28rem;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #101019;
  background: color-mix(in srgb, var(--accent) 84%, white 16%);
}

@media (max-width: 980px) {
  .fan-cards {
    min-height: 190px;
  }

  .fan-card {
    margin-left: -1.1rem;
  }
}
</style>
