import type { AppSettings } from "@/domain/types";
export declare const defaultSettings: AppSettings;
export declare function normalizeSettings(next: Partial<AppSettings>): AppSettings;
export declare const useSettingsStore: import("pinia").StoreDefinition<"settings", {
    settings: AppSettings;
}, {
    hasApiKey(state: {
        settings: {
            provider: import("@/domain/types").ProviderId;
            model: string;
            apiKeySession: string;
            quality: import("@/domain/types").QualityPreset;
            cardBackId: string;
            customCardBackDataUrl?: string | undefined;
            reversalMode: import("@/domain/types").ReversalMode;
            uiSkin: import("@/domain/types").UISkin;
            paletteId: string;
            deckId: string;
            sceneId: string;
            musicEnabled: boolean;
            sfxEnabled: boolean;
            voiceEnabled: boolean;
            masterVolume: number;
            musicVolume: number;
            sfxVolume: number;
            voiceVolume: number;
            animationIntensity: import("@/domain/types").AnimationIntensity;
            ritualPromptsEnabled: boolean;
            ritualSilenceMode: boolean;
            reducedEffects: boolean;
            qaUseMock: boolean;
        };
    } & import("pinia").PiniaCustomStateProperties<{
        settings: AppSettings;
    }>): boolean;
}, {
    updateSettings(next: Partial<AppSettings>): void;
    clearApiKey(): void;
    resetToDefaults(): void;
}>;
