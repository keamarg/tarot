export type AmbienceCue =
  | "shuffle-start"
  | "shuffle-end"
  | "deck-activate"
  | "card-pick"
  | "card-reveal"
  | "modal-open"
  | "modal-close";

const cueTarget = new EventTarget();

export function emitAmbienceCue(cue: AmbienceCue): void {
  cueTarget.dispatchEvent(new CustomEvent<AmbienceCue>("ambience-cue", { detail: cue }));
}

export function subscribeAmbienceCue(listener: (cue: AmbienceCue) => void): () => void {
  const handler = (event: Event) => {
    const typed = event as CustomEvent<AmbienceCue>;
    listener(typed.detail);
  };
  cueTarget.addEventListener("ambience-cue", handler);
  return () => cueTarget.removeEventListener("ambience-cue", handler);
}
