<template>
  <section class="grid settings-grid">
    <article class="card">
      <h2>Settings</h2>
      <p class="small">Session-scoped configuration for AI, ritual flow, decks, ambience, and performance.</p>

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

        <label>
          Scene
          <select :value="settings.sceneId" @change="updateScene">
            <option v-for="scene in ambientScenes" :key="scene.id" :value="scene.id">
              {{ scene.label }}
            </option>
          </select>
        </label>

        <label>
          Animation intensity
          <select :value="settings.animationIntensity" @change="updateAnimationIntensity">
            <option value="low">Low</option>
            <option value="standard">Standard</option>
            <option value="high">High</option>
          </select>
        </label>

        <fieldset class="full-width">
          <legend>Quality</legend>
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

        <fieldset class="full-width">
          <legend>Audio</legend>
          <label class="inline checkbox-inline"><input :checked="settings.musicEnabled" type="checkbox" @change="toggleMusic" /> Music</label>
          <label class="inline checkbox-inline"><input :checked="settings.sfxEnabled" type="checkbox" @change="toggleSfx" /> SFX</label>
          <label class="inline checkbox-inline"><input :checked="settings.voiceEnabled" type="checkbox" @change="toggleVoice" /> Whisper voice</label>

          <label class="slider-row">
            Master
            <input :value="settings.masterVolume" type="range" min="0" max="1" step="0.01" @input="updateRange('masterVolume', $event)" />
          </label>
          <label class="slider-row">
            Music
            <input :value="settings.musicVolume" type="range" min="0" max="1" step="0.01" @input="updateRange('musicVolume', $event)" />
          </label>
          <label class="slider-row">
            SFX
            <input :value="settings.sfxVolume" type="range" min="0" max="1" step="0.01" @input="updateRange('sfxVolume', $event)" />
          </label>
          <label class="slider-row">
            Voice
            <input :value="settings.voiceVolume" type="range" min="0" max="1" step="0.01" @input="updateRange('voiceVolume', $event)" />
          </label>
        </fieldset>

        <fieldset class="full-width">
          <legend>Ritual</legend>
          <label class="inline checkbox-inline"><input :checked="settings.ritualPromptsEnabled" type="checkbox" @change="toggleRitualPrompts" /> Show question ritual</label>
          <label class="inline checkbox-inline"><input :checked="settings.ritualSilenceMode" type="checkbox" @change="toggleRitualSilence" /> Ritual silence during question</label>
          <label class="inline checkbox-inline"><input :checked="settings.reducedEffects" type="checkbox" @change="toggleReducedEffects" /> Reduce visual effects</label>
        </fieldset>

        <label class="full-width qa-toggle">
          <span>QA mode</span>
          <span class="inline">
            <input :checked="settings.qaUseMock" type="checkbox" @change="updateQaToggle" />
            Use mock responses (no API calls)
          </span>
        </label>
      </div>
    </article>

    <article class="card settings-side">
      <h3>Deck Preview</h3>
      <img v-if="backImageUrl" class="back-preview" :src="backImageUrl" alt="Selected tarot card back" />
      <p class="small">{{ selectedDeck?.description }}</p>

      <h3>Scene Notes</h3>
      <p class="small">{{ selectedScene?.description }}</p>

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
import { ambientScenes, availableDecks, getAmbientSceneById, getDeckById, getPaletteById, palettes } from "@/modules/decks/deckCatalog";
import { resolveDeckBackImage } from "@/modules/decks/deckResolver";
import type { AnimationIntensity, ProviderId, QualityPreset, ReversalMode, UISkin } from "@/domain/types";

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);
const providerModels = ref<ModelCatalogItem[]>(fallbackModelsFor(settings.value.provider));
const isLoadingModels = ref(false);
const modelLoadError = ref("");
const usesServerProxy = hasServerProxy();

const selectedDeck = computed(() => getDeckById(settings.value.deckId));
const selectedPalette = computed(() => getPaletteById(settings.value.paletteId));
const selectedScene = computed(() => getAmbientSceneById(settings.value.sceneId));

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

function updateScene(event: Event) {
  const target = event.target as HTMLSelectElement;
  settingsStore.updateSettings({ sceneId: target.value });
}

function updateAnimationIntensity(event: Event) {
  const target = event.target as HTMLSelectElement;
  settingsStore.updateSettings({ animationIntensity: target.value as AnimationIntensity });
}

function setQuality(quality: QualityPreset) {
  settingsStore.updateSettings({ quality });
}

function setReversal(reversalMode: ReversalMode) {
  settingsStore.updateSettings({ reversalMode });
}

function toggleMusic(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ musicEnabled: target.checked });
}

function toggleSfx(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ sfxEnabled: target.checked });
}

function toggleVoice(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ voiceEnabled: target.checked });
}

function toggleRitualPrompts(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ ritualPromptsEnabled: target.checked });
}

function toggleRitualSilence(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ ritualSilenceMode: target.checked });
}

function toggleReducedEffects(event: Event) {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ reducedEffects: target.checked });
}

function updateRange(key: "masterVolume" | "musicVolume" | "sfxVolume" | "voiceVolume", event: Event) {
  const target = event.target as HTMLInputElement;
  const parsed = Number(target.value);
  settingsStore.updateSettings({ [key]: Number.isFinite(parsed) ? parsed : 0 } as Partial<typeof settings.value>);
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

input,
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
  min-width: 180px;
}

.slider-row {
  width: 100%;
  align-items: center;
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

.qa-toggle {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.48rem 0.55rem;
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
