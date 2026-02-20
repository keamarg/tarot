import { defineStore } from "pinia";
import type { AppSettings } from "@/domain/types";
import { loadSessionState, removeSessionState, saveSessionState } from "@/app/storage";
import { fallbackModelsFor } from "@/ai/modelCatalog";
import { ambientScenes, availableDecks, palettes } from "@/modules/decks/deckCatalog";

const STORAGE_KEY = "tarot.app.settings";
const DEFAULT_DECK_ID = availableDecks[0]?.id ?? "original-rws";
const DEFAULT_PALETTE_ID = palettes[0]?.id ?? "arcana";
const DEFAULT_SCENE_ID = ambientScenes[0]?.id ?? "fortune-house";

function clamp01(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, value));
}

export const defaultSettings: AppSettings = {
  provider: "anthropic",
  model: "claude-haiku-4-5-20251001",
  apiKeySession: "",
  quality: "standard",
  cardBackId: "original",
  customCardBackDataUrl: "",
  reversalMode: "balanced",
  uiSkin: "arcana",
  paletteId: DEFAULT_PALETTE_ID,
  deckId: DEFAULT_DECK_ID,
  sceneId: DEFAULT_SCENE_ID,
  musicEnabled: false,
  sfxEnabled: true,
  voiceEnabled: false,
  masterVolume: 0.58,
  musicVolume: 0.44,
  sfxVolume: 0.48,
  voiceVolume: 0.36,
  animationIntensity: "standard",
  ritualPromptsEnabled: true,
  ritualSilenceMode: false,
  reducedEffects: false,
  qaUseMock: false
};

function createDefaultSettings(): AppSettings {
  return {
    ...defaultSettings
  };
}

export function normalizeSettings(next: Partial<AppSettings>): AppSettings {
  const merged: AppSettings = {
    ...createDefaultSettings(),
    ...next
  };

  const requestedPaletteId =
    (typeof next.paletteId === "string" && next.paletteId.trim()) ||
    (typeof next.uiSkin === "string" && next.uiSkin.trim()) ||
    "";
  const resolvedPaletteId = requestedPaletteId || merged.paletteId?.trim() || merged.uiSkin || DEFAULT_PALETTE_ID;
  const resolvedDeckId = merged.deckId?.trim() || DEFAULT_DECK_ID;
  const resolvedSceneId = merged.sceneId?.trim() || DEFAULT_SCENE_ID;
  const availablePalette = palettes.some((palette) => palette.id === resolvedPaletteId)
    ? resolvedPaletteId
    : DEFAULT_PALETTE_ID;
  const availableDeck = availableDecks.some((deck) => deck.id === resolvedDeckId)
    ? resolvedDeckId
    : DEFAULT_DECK_ID;
  const availableScene = ambientScenes.some((scene) => scene.id === resolvedSceneId)
    ? resolvedSceneId
    : DEFAULT_SCENE_ID;

  const baseWithSanitizedFields: AppSettings = {
    ...merged,
    uiSkin: availablePalette as AppSettings["uiSkin"],
    paletteId: availablePalette,
    deckId: availableDeck,
    sceneId: availableScene,
    musicEnabled: Boolean(merged.musicEnabled),
    sfxEnabled: Boolean(merged.sfxEnabled),
    voiceEnabled: Boolean(merged.voiceEnabled),
    masterVolume: clamp01(merged.masterVolume, 0.58),
    musicVolume: clamp01(merged.musicVolume, 0.44),
    sfxVolume: clamp01(merged.sfxVolume, 0.48),
    voiceVolume: clamp01(merged.voiceVolume, 0.36)
  };

  if (baseWithSanitizedFields.model.trim()) {
    return baseWithSanitizedFields;
  }
  const availableModels = fallbackModelsFor(baseWithSanitizedFields.provider);
  return {
    ...baseWithSanitizedFields,
    model: availableModels[0]?.id ?? "claude-haiku-4-5-20251001"
  };
}

export const useSettingsStore = defineStore("settings", {
  state: (): { settings: AppSettings } => ({
    settings: normalizeSettings(loadSessionState<AppSettings>(STORAGE_KEY, createDefaultSettings()))
  }),
  getters: {
    hasApiKey(state): boolean {
      return Boolean(state.settings.apiKeySession.trim());
    }
  },
  actions: {
    updateSettings(next: Partial<AppSettings>) {
      this.settings = normalizeSettings({
        ...this.settings,
        ...next
      });
      saveSessionState(STORAGE_KEY, this.settings);
    },
    clearApiKey() {
      this.settings.apiKeySession = "";
      saveSessionState(STORAGE_KEY, this.settings);
    },
    resetToDefaults() {
      this.settings = createDefaultSettings();
      removeSessionState(STORAGE_KEY);
    }
  }
});
