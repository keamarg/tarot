import { defineStore } from "pinia";
import type { AppSettings } from "@/domain/types";
import { loadSessionState, removeSessionState, saveSessionState } from "@/app/storage";
import { fallbackModelsFor } from "@/ai/modelCatalog";

const STORAGE_KEY = "tarot.app.settings";

export const defaultSettings: AppSettings = {
  provider: "anthropic",
  model: "claude-3-7-sonnet-latest",
  apiKeySession: "",
  quality: "standard",
  cardBackId: "original",
  customCardBackDataUrl: "",
  reversalMode: "balanced",
  uiSkin: "arcana",
  qaUseMock: false
};

function createDefaultSettings(): AppSettings {
  return {
    ...defaultSettings
  };
}

function normalizeSettings(next: AppSettings): AppSettings {
  const merged: AppSettings = {
    ...createDefaultSettings(),
    ...next
  };

  if (merged.model.trim()) {
    return merged;
  }
  const availableModels = fallbackModelsFor(merged.provider);
  return {
    ...merged,
    model: availableModels[0]?.id ?? "claude-3-7-sonnet-latest"
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
