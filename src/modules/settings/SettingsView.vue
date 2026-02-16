<template>
  <section class="grid settings-grid">
    <article class="card">
      <h2>Settings</h2>
      <p class="small">Session-scoped configuration for model, visuals, and draw behavior.</p>

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

        <div class="model-tools">
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
          API Key (session only, provider-specific; optional when server proxy is configured)
          <input
            :value="settings.apiKeySession"
            type="password"
            autocomplete="off"
            :placeholder="apiKeyPlaceholder"
            @input="updateKey"
          />
        </label>
        <p v-if="usesServerProxy" class="small full-width">
          Server proxy mode detected via <code>VITE_API_BASE_URL</code>: provider secrets can be kept server-side.
        </p>

        <label>
          UI Skin
          <select :value="settings.uiSkin" @change="updateSkin">
            <option value="arcana">Arcana</option>
            <option value="classic">Classic</option>
            <option value="prism">Prism</option>
          </select>
        </label>

        <label>
          Card back
          <select :value="settings.cardBackId" @change="updateCardBack">
            <option value="original">Original</option>
            <option value="centennial">Centennial</option>
            <option value="prism">Prism (bright)</option>
            <option value="eros">Eros (symbolic)</option>
            <option v-if="settings.customCardBackDataUrl" value="custom">Custom upload</option>
          </select>
        </label>

        <label class="full-width">
          Optional custom card back upload
          <input accept="image/*" type="file" @change="onCustomBackUpload" />
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
          <label class="inline"><input :checked="settings.reversalMode === 'none'" type="radio" name="reversal" @change="setReversal('none')" /> 0% (upright only)</label>
          <label class="inline"><input :checked="settings.reversalMode === 'balanced'" type="radio" name="reversal" @change="setReversal('balanced')" /> 50% (balanced)</label>
        </fieldset>

        <label class="full-width qa-toggle">
          <span>QA mode</span>
          <span class="inline">
            <input :checked="settings.qaUseMock" type="checkbox" @change="updateQaToggle" />
            Use premade answers (no API calls)
          </span>
        </label>
      </div>
    </article>

    <article class="card settings-side">
      <h3>Card Back Preview</h3>
      <img v-if="backImageUrl" class="back-preview" :src="backImageUrl" alt="Selected tarot card back" />
      <div v-else class="back-fallback">No back image loaded</div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { fallbackModelsFor, fetchModelsForProvider, type ModelCatalogItem } from "@/ai/modelCatalog";
import { useSettingsStore } from "@/modules/settings/settingsStore";
import { hasApiBaseOverride } from "@/ai/apiBase";
import type { ProviderId, QualityPreset, ReversalMode, UISkin } from "@/domain/types";

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);
const providerModels = ref<ModelCatalogItem[]>(fallbackModelsFor(settings.value.provider));
const isLoadingModels = ref(false);
const modelLoadError = ref("");
const usesServerProxy = hasApiBaseOverride();

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

const backImageUrl = computed(() => {
  if (settings.value.cardBackId === "custom" && settings.value.customCardBackDataUrl) {
    return settings.value.customCardBackDataUrl;
  }
  if (settings.value.cardBackId === "prism") {
    return "/backs/prism.svg";
  }
  if (settings.value.cardBackId === "eros") {
    return "/backs/eros.svg";
  }
  if (settings.value.cardBackId === "centennial") {
    return "/backs/centennial.webp";
  }
  return "/backs/original.webp";
});

const qualityHint = computed(() => {
  if (settings.value.quality === "low") {
    return "Low: faster and concise responses with lower output token budget.";
  }
  if (settings.value.quality === "high") {
    return "High: slower but more detailed responses with larger token budget and richer elaboration.";
  }
  return "Standard: balanced speed, detail, and token budget.";
});

function updateModel(event: Event) {
  const target = event.target as HTMLSelectElement;
  if (target.value === settingsStore.settings.model) {
    return;
  }
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

function updateSkin(event: Event) {
  const target = event.target as HTMLSelectElement;
  settingsStore.updateSettings({ uiSkin: target.value as UISkin });
}

function setQuality(quality: QualityPreset) {
  settingsStore.updateSettings({ quality });
}

function setReversal(reversalMode: ReversalMode) {
  settingsStore.updateSettings({ reversalMode });
}

function updateCardBack(event: Event) {
  const target = event.target as HTMLSelectElement;
  settingsStore.updateSettings({ cardBackId: target.value });
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

function onCustomBackUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const value = String(reader.result ?? "");
    settingsStore.updateSettings({ cardBackId: "custom", customCardBackDataUrl: value });
  };
  reader.readAsDataURL(file);
}

watch(
  () => settings.value.provider,
  (provider) => {
    const fallback = fallbackModelsFor(provider);
    providerModels.value = fallback;
    if (fallback.length && !fallback.some((model) => model.id === settings.value.model)) {
      settingsStore.updateSettings({ model: fallback[0].id });
    }
    if (!settings.value.apiKeySession.trim() && !usesServerProxy) {
      modelLoadError.value = "";
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
  width: min(360px, 100%);
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

.back-fallback {
  border: 1px dashed var(--border);
  border-radius: 10px;
  min-height: 180px;
  display: grid;
  place-items: center;
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
