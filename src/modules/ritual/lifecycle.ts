import type { ReadingLifecyclePhase, RitualState } from "@/domain/types";

export const READING_LIFECYCLE_VERSION = 2;

const FAN_PICKING_SPREAD_IDS = new Set(["one-card-daily", "three-card"]);

export function supportsFanPicking(spreadId: string): boolean {
  return FAN_PICKING_SPREAD_IDS.has(spreadId);
}

export function createInitialRitualState(mode: "upload" | "app_draw"): RitualState {
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

export function nextReadingPhase(current: ReadingLifecyclePhase, options: {
  mode: "upload" | "app_draw";
  spreadId: string;
}): ReadingLifecyclePhase {
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

export function shouldShowQuestionPrompt(phase: ReadingLifecyclePhase, ritualEnabled: boolean): boolean {
  return ritualEnabled && phase === "question";
}

export function isRitualCinematicPhase(phase: ReadingLifecyclePhase): boolean {
  return phase === "question" || phase === "shuffle" || phase === "pick";
}
