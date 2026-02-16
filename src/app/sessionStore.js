import { defineStore } from "pinia";
import { loadSessionState, removeSessionState, saveSessionState } from "@/app/storage";
const STORAGE_KEY = "tarot.app.session";
function persistSessionState(state) {
    saveSessionState(STORAGE_KEY, state);
}
export const useSessionStore = defineStore("session", {
    state: () => loadSessionState(STORAGE_KEY, {}),
    actions: {
        setReadingDraft(next) {
            this.readingDraft = next;
            persistSessionState({
                readingDraft: this.readingDraft,
                trainingDraft: this.trainingDraft
            });
        },
        setTrainingDraft(next) {
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
