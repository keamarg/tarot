export const READING_LIFECYCLE_VERSION = 2;
const FAN_PICKING_SPREAD_IDS = new Set(["one-card-daily", "three-card"]);
export function supportsFanPicking(spreadId) {
    return FAN_PICKING_SPREAD_IDS.has(spreadId);
}
export function createInitialRitualState(mode) {
    return {
        mode,
        phase: "setup",
        questionText: "",
        questionSkipped: false,
        pickOrder: [],
        shuffleCompleted: false,
        deckActivated: false
    };
}
export function nextReadingPhase(current, options) {
    if (current === "setup") {
        return "question";
    }
    if (current === "question") {
        if (options.mode === "upload") {
            return "followup";
        }
        return "shuffle";
    }
    if (current === "shuffle") {
        return supportsFanPicking(options.spreadId) ? "pick" : "reveal";
    }
    if (current === "pick") {
        return "reveal";
    }
    return current;
}
export function shouldShowQuestionPrompt(phase, ritualEnabled) {
    return ritualEnabled && phase === "question";
}
export function isRitualCinematicPhase(phase) {
    return phase === "question" || phase === "shuffle" || phase === "pick";
}
