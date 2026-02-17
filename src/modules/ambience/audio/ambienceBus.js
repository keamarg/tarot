const cueTarget = new EventTarget();
export function emitAmbienceCue(cue) {
    cueTarget.dispatchEvent(new CustomEvent("ambience-cue", { detail: cue }));
}
export function subscribeAmbienceCue(listener) {
    const handler = (event) => {
        const typed = event;
        listener(typed.detail);
    };
    cueTarget.addEventListener("ambience-cue", handler);
    return () => cueTarget.removeEventListener("ambience-cue", handler);
}
