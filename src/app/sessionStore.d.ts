import type { ReadingDraft, TrainingDraft } from "@/domain/types";
interface SessionState {
    readingDraft?: ReadingDraft;
    trainingDraft?: TrainingDraft;
}
export declare const useSessionStore: import("pinia").StoreDefinition<"session", SessionState, {}, {
    setReadingDraft(next: ReadingDraft): void;
    setTrainingDraft(next: TrainingDraft): void;
    clearReadingDraft(): void;
    clearTrainingDraft(): void;
    resetReading(): void;
    resetTraining(): void;
    resetAll(): void;
}>;
export {};
