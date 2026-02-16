<template>
  <div v-if="open" class="overlay" role="dialog" aria-modal="true" aria-labelledby="card-editor-title">
    <div class="panel card">
      <h3 id="card-editor-title">Edit Card</h3>
      <label>
        Card
        <select v-model="selectedCardId">
          <option v-for="card in cards" :key="card.id" :value="card.id">
            {{ card.name }}
          </option>
        </select>
      </label>

      <div class="preview-shell" aria-label="Selected card preview">
        <img v-if="selectedCardImage" :src="selectedCardImage" alt="" />
      </div>

      <label class="toggle-row">
        <input v-model="reversed" :disabled="allowReversed === false" type="checkbox" />
        Reversed
      </label>

      <div class="actions">
        <button type="button" @click="$emit('close')">Cancel</button>
        <button class="primary" type="button" @click="confirm">Apply</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { publicAssetUrl } from "@/app/publicAsset";
import { cards } from "@/domain/cards";

const props = defineProps<{
  open: boolean;
  initialCardId?: string;
  initialReversed?: boolean;
  allowReversed?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [cardId: string, reversed: boolean];
}>();

const selectedCardId = ref(cards[0]?.id ?? "");
const reversed = ref(false);
const selectedCardImage = computed(() => {
  const selectedCard = cards.find((card) => card.id === selectedCardId.value);
  if (!selectedCard) {
    return "";
  }
  return publicAssetUrl(`cards/${selectedCard.image}`);
});

watch(
  () => [props.open, props.initialCardId, props.initialReversed, props.allowReversed],
  () => {
    selectedCardId.value = props.initialCardId ?? cards[0]?.id ?? "";
    reversed.value = props.allowReversed === false ? false : Boolean(props.initialReversed);
  },
  { immediate: true }
);

function confirm() {
  emit("confirm", selectedCardId.value, props.allowReversed === false ? false : reversed.value);
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1200;
  padding: 1rem;
}

.panel {
  width: min(560px, 100%);
  display: grid;
  gap: 0.7rem;
}

label {
  display: grid;
  gap: 0.4rem;
}

.preview-shell {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  padding: 0.5rem;
  display: grid;
  place-items: center;
}

.preview-shell img {
  width: min(240px, 100%);
  aspect-ratio: 3 / 5;
  object-fit: contain;
  border-radius: 8px;
}

select {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.45rem;
}

.toggle-row {
  grid-template-columns: auto 1fr;
  align-items: center;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
