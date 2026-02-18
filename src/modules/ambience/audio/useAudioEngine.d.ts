import type { AudioSettings } from "@/domain/types";
import type { AmbienceCue } from "@/modules/ambience/audio/ambienceBus";
type MusicMode = "warm" | "cool" | "neutral";
export declare function useAudioEngine(): {
    isReady: import("vue").Ref<boolean, boolean>;
    ensureStarted: () => Promise<void>;
    applySettings: (settings: Partial<AudioSettings>) => void;
    setDeckMusicMode: (mode: MusicMode) => void;
    triggerCue: (cue: AmbienceCue) => void;
};
export {};
