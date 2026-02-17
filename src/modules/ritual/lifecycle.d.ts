import type { ReadingLifecyclePhase, RitualState } from "@/domain/types";
export declare const READING_LIFECYCLE_VERSION = 2;
export declare function supportsFanPicking(spreadId: string): boolean;
export declare function createInitialRitualState(mode: "upload" | "app_draw"): RitualState;
export declare function nextReadingPhase(current: ReadingLifecyclePhase, options: {
    mode: "upload" | "app_draw";
    spreadId: string;
}): ReadingLifecyclePhase;
export declare function shouldShowQuestionPrompt(phase: ReadingLifecyclePhase, ritualEnabled: boolean): boolean;
export declare function isRitualCinematicPhase(phase: ReadingLifecyclePhase): boolean;
