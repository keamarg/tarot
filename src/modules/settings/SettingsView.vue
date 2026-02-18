<template>
  <section class="grid settings-grid">
    <article class="card">
      <h2>Settings</h2>
      <p class="small">Session-scoped configuration for AI and deck presentation.</p>

      <div class="form-grid">
        <label>
          Provider
          <select :value="settings.provider" @change="updateProvider">
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="google">Google</option>
          </select>
        </label>

        <label>
          Model
          <select :value="settings.model" @change="updateModel">
            <option v-for="model in providerModels" :key="model.id" :value="model.id">
              {{ model.label }}
            </option>
          </select>
        </label>

        <div class="model-tools full-width">
          <button
            type="button"
            :disabled="isLoadingModels || (!usesServerProxy && !settings.apiKeySession.trim())"
            @click="refreshModels"
          >
            {{ isLoadingModels ? "Refreshing..." : "Refresh Models" }}
          </button>
          <p v-if="modelLoadError" class="small error-text">{{ modelLoadError }}</p>
        </div>

        <label class="full-width">
          API Key (session only)
          <input
            :value="settings.apiKeySession"
            type="password"
            autocomplete="off"
            :placeholder="apiKeyPlaceholder"
            @input="updateKey"
          />
        </label>

        <label>
          Deck
          <select :value="settings.deckId" @change="updateDeck">
            <option v-for="deck in availableDecks" :key="deck.id" :value="deck.id">
              {{ deck.label }}
            </option>
          </select>
        </label>

        <label>
          Palette
          <select :value="settings.paletteId" @change="updatePalette">
            <option v-for="palette in palettes" :key="palette.id" :value="palette.id">
              {{ palette.label }}
            </option>
          </select>
        </label>

        <fieldset class="full-width">
          <legend>AI Quality</legend>
          <label class="inline"><input :checked="settings.quality === 'low'" type="radio" name="quality" @change="setQuality('low')" /> Low</label>
          <label class="inline"><input :checked="settings.quality === 'standard'" type="radio" name="quality" @change="setQuality('standard')" /> Standard</label>
          <label class="inline"><input :checked="settings.quality === 'high'" type="radio" name="quality" @change="setQuality('high')" /> High</label>
          <p class="small quality-note">{{ qualityHint }}</p>
        </fieldset>

        <fieldset class="full-width">
          <legend>Reversal mode</legend>
          <label class="inline"><input :checked="settings.reversalMode === 'none'" type="radio" name="reversal" @change="setReversal('none')" /> Upright only</label>
          <label class="inline"><input :checked="settings.reversalMode === 'balanced'" type="radio" name="reversal" @change="setReversal('balanced')" /> Balanced 50/50</label>
        </fieldset>

        <fieldset class="full-width toggle-field">
          <legend>Audio</legend>
          <div class="audio-toggles">
            <label class="checkbox-inline">
              <input :checked="settings.musicEnabled" type="checkbox" @change="toggleMusic" />
              Ambient music
            </label>
            <label class="checkbox-inline">
              <input :checked="settings.sfxEnabled" type="checkbox" @change="toggleSfx" />
              Sound effects
            </label>
            <label class="checkbox-inline">
              <input :checked="settings.voiceEnabled" type="checkbox" @change="toggleVoice" />
              Whisper voice
            </label>
          </div>
        </fieldset>

        <fieldset class="full-width toggle-field qa-toggle">
          <legend>QA Mode</legend>
          <label class="checkbox-inline">
            <input :checked="settings.qaUseMock" type="checkbox" @change="updateQaToggle" />
            Use mock responses (no API calls)
          </label>
        </fieldset>
      </div>
    </article>

    <article class="card settings-side">
      <h3>Deck Preview</h3>
      <img v-if="backImageUrl" class="back-preview" :src="backImageUrl" alt="Selected tarot card back" />
      <p class="small">{{ selectedDeck?.description }}</p>
      <p class="small source-note">Source: {{ selectedDeck?.sourceName }}</p>

      <h3>Palette Notes</h3>
      <p class="small">{{ selectedPalette?.description }}</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { fallbackModelsFor, fetchModelsForProvider, type ModelCatalogItem } from "@/ai/modelCatalog";
import { hasServerProxy } from "@/ai/apiBase";
import { useSettingsStore } from "@/modules/settings/settingsStore";
import { availableDecks, getDeckById, getPaletteById, palettes } from "@/modules/decks/deckCatalog";
import { resolveDeckBackImage } from "@/modules/decks/deckResolver";
import type { ProviderId, QualityPreset, ReversalMode, UISkin } from "@/domain/types";

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);
const providerModels = ref<ModelCatalogItem[]>(fallbackModelsFor(settings.value.provider));
const isLoadingModels = ref(false);
const modelLoadError = ref("");
const usesServerProxy = hasServerProxy();

const selectedDeck = computed(() => getDeckById(settings.value.deckId));
const selectedPalette = computed(() => getPaletteById(settings.value.paletteId));

const apiKeyPlaceholder = computed(() => {
  if (usesServerProxy && !settings.value.apiKeySession.trim()) {
    return "Optional (handled by server proxy)";
  }
  if (settings.value.provider === "openai") {
    return "sk-...";
  }
  if (settings.value.provider === "google") {
    return "AIza...";
  }
  return "sk-ant-...";
});

const backImageUrl = computed(() => resolveDeckBackImage(settings.value.deckId));

const qualityHint = computed(() => {
  if (settings.value.quality === "low") {
    return "Low: faster and concise responses.";
  }
  if (settings.value.quality === "high") {
    return "High: slower and richer responses.";
  }
  return "Standard: balanced speed and detail.";
});

function updateModel(event: Event) {
  const target = event.target as HTMLSelectElement;
  settingsStore.updateSettings({ model: target.value });
}

function updateProvider(event: Event) {
  const target = event.target as HTMLSelectElement;
  const provider = target.value as ProviderId;
  const fallback = fallbackModelsFor(provider);
  providerModels.value = fallback;
  settingsStore.updateSettings({
    provider,
    model: fallback[0]?.id ?? settingsStore.settings.model,
    apiKeySession: ""
  });
  modelLoadError.value = "";
}

function updateKey(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ apiKeySession: target.value });
}

function updateDeck(event: Event) {
  const target = event.target as HTMLSelectElement;
  settingsStore.updateSettings({ deckId: target.value, cardBackId: "deck" });
}

function updatePalette(event: Event) {
  const target = event.target as HTMLSelectElement;
  settingsStore.updateSettings({ paletteId: target.value, uiSkin: target.value as UISkin });
}

function setQuality(quality: QualityPreset) {
  settingsStore.updateSettings({ quality });
}

function setReversal(reversalMode: ReversalMode) {
  settingsStore.updateSettings({ reversalMode });
}

function toggleMusic(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({
    musicEnabled: target.checked
  });
}

function toggleSfx(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({
    sfxEnabled: target.checked
  });
}

function toggleVoice(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({
    voiceEnabled: target.checked
  });
}

function updateQaToggle(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ qaUseMock: target.checked });
}

async function refreshModels() {
  if (isLoadingModels.value) {
    return;
  }

  const provider = settings.value.provider;
  const apiKey = settings.value.apiKeySession.trim();
  if (!apiKey && !usesServerProxy) {
    providerModels.value = fallbackModelsFor(provider);
    modelLoadError.value = "";
    return;
  }

  isLoadingModels.value = true;
  modelLoadError.value = "";
  try {
    const fetched = await fetchModelsForProvider(provider, apiKey);
    providerModels.value = fetched;
    if (!fetched.some((model) => model.id === settings.value.model)) {
      settingsStore.updateSettings({ model: fetched[0]?.id ?? settings.value.model });
    }
  } catch (error) {
    providerModels.value = fallbackModelsFor(provider);
    modelLoadError.value = error instanceof Error ? error.message : "Failed to load models.";
  } finally {
    isLoadingModels.value = false;
  }
}

watch(
  () => settings.value.provider,
  (provider) => {
    const fallback = fallbackModelsFor(provider);
    providerModels.value = fallback;
    if (fallback.length && !fallback.some((model) => model.id === settings.value.model)) {
      settingsStore.updateSettings({ model: fallback[0].id });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.settings-grid {
  grid-template-columns: 2fr 1fr;
  align-items: start;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

label {
  display: grid;
  gap: 0.35rem;
}

input:not([type="checkbox"]):not([type="radio"]),
select {
  width: min(420px, 100%);
}

fieldset {
  margin: 0;
  padding: 0.45rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

legend {
  padding: 0 0.4rem;
}

.inline {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.checkbox-inline {
  min-width: 220px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.42rem;
}

.audio-toggles {
  width: 100%;
  display: grid;
  gap: 0.22rem;
}

.quality-note {
  width: 100%;
  margin: 0.12rem 0 0;
}

.model-tools {
  display: grid;
  align-content: end;
  gap: 0.3rem;
}

.error-text {
  margin: 0;
  color: var(--danger);
}

.full-width {
  grid-column: 1 / -1;
}

.toggle-field {
  margin: 0;
  padding: 0.55rem 0.62rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  display: grid;
  justify-items: start;
  gap: 0.32rem;
  background: color-mix(in srgb, var(--surface) 70%, transparent);
}

.qa-toggle {
  align-content: start;
}

.settings-side {
  display: grid;
  gap: 0.65rem;
}

.settings-side h3 {
  margin: 0;
}

.back-preview {
  width: min(300px, 100%);
  aspect-ratio: 3 / 5;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 75%, transparent);
}

.source-note {
  color: var(--muted);
}

@media (max-width: 980px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
