import type { AudioSettings } from "@/domain/types";
import type { AmbienceCue } from "@/modules/ambience/audio/ambienceBus";
export declare function useAudioEngine(): {
    isReady: import("vue").Ref<boolean, boolean>;
    ensureStarted: () => Promise<void>;
    applySettings: (settings: Partial<AudioSettings>, options?: {
        ritualSilence?: boolean;
    }) => void;
    setDeckMusicMode: (mode: "warm" | "cool" | "neutral") => void;
    triggerCue: (cue: AmbienceCue) => void;
};
