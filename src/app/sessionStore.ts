import { defineStore } from "pinia";
import { loadSessionState, removeSessionState, saveSessionState } from "@/app/storage";
import type { ReadingDraft, TrainingDraft } from "@/domain/types";

interface SessionState {
  readingDraft?: ReadingDraft;
  trainingDraft?: TrainingDraft;
}

const STORAGE_KEY = "tarot.app.session";

function persistSessionState(state: SessionState): void {
  saveSessionState(STORAGE_KEY, state);
}

export const useSessionStore = defineStore("session", {
  state: (): SessionState => loadSessionState<SessionState>(STORAGE_KEY, {}),
  actions: {
    setReadingDraft(next: ReadingDraft) {
      this.readingDraft = next;
      persistSessionState({
        readingDraft: this.readingDraft,
        trainingDraft: this.trainingDraft
      });
    },
    setTrainingDraft(next: TrainingDraft) {
      this.trainingDraft = next;
      persistSessionState({
        readingDraft: this.readingDraft,
        trainingDraft: this.trainingDraft
      });
    },
    clearReadingDraft() {
      this.readingDraft = undefined;
      if (!this.trainingDraft) {
        removeSessionState(STORAGE_KEY);
        return;
      }
      persistSessionState({
        readingDraft: this.readingDraft,
        trainingDraft: this.trainingDraft
      });
    },
    clearTrainingDraft() {
      this.trainingDraft = undefined;
      if (!this.readingDraft) {
        removeSessionState(STORAGE_KEY);
        return;
      }
      persistSessionState({
        readingDraft: this.readingDraft,
        trainingDraft: this.trainingDraft
      });
    },
    resetReading() {
      this.clearReadingDraft();
    },
    resetTraining() {
      this.clearTrainingDraft();
    },
    resetAll() {
      this.readingDraft = undefined;
      this.trainingDraft = undefined;
      removeSessionState(STORAGE_KEY);
    }
  }
});
