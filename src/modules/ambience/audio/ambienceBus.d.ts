export type AmbienceCue = "shuffle-start" | "shuffle-end" | "deck-activate" | "card-pick" | "card-reveal" | "modal-open" | "modal-close";
export declare function emitAmbienceCue(cue: AmbienceCue): void;
export declare function subscribeAmbienceCue(listener: (cue: AmbienceCue) => void): () => void;
