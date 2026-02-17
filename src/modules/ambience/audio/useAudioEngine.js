import { onBeforeUnmount, ref } from "vue";
const state = {
    started: false
};
const defaultAudioSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    masterVolume: 0.5,
    musicVolume: 0.4,
    sfxVolume: 0.45
};
let currentSettings = { ...defaultAudioSettings };
function clampVolume(value) {
    return Math.max(0, Math.min(1, value));
}
function getTargetMusicGain() {
    if (!currentSettings.musicEnabled) {
        return 0;
    }
    return clampVolume(currentSettings.masterVolume) * clampVolume(currentSettings.musicVolume) * 0.14;
}
function getSfxGainScale() {
    if (!currentSettings.sfxEnabled) {
        return 0;
    }
    return clampVolume(currentSettings.masterVolume) * clampVolume(currentSettings.sfxVolume);
}
function ensureContext() {
    if (typeof window === "undefined") {
        return undefined;
    }
    if (!state.context) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) {
            return undefined;
        }
        state.context = new AudioCtor();
    }
    return state.context;
}
function setupAmbienceNodes(context) {
    if (state.ambienceGain && state.ambienceOscillatorA && state.ambienceOscillatorB) {
        return;
    }
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(context.destination);
    const oscillatorA = context.createOscillator();
    oscillatorA.type = "sine";
    oscillatorA.frequency.value = 146.83;
    const oscillatorB = context.createOscillator();
    oscillatorB.type = "triangle";
    oscillatorB.frequency.value = 220;
    oscillatorA.connect(gain);
    oscillatorB.connect(gain);
    oscillatorA.start();
    oscillatorB.start();
    state.ambienceGain = gain;
    state.ambienceOscillatorA = oscillatorA;
    state.ambienceOscillatorB = oscillatorB;
}
function setMusicMode(mode) {
    if (!state.ambienceOscillatorA || !state.ambienceOscillatorB) {
        return;
    }
    if (mode === "warm") {
        state.ambienceOscillatorA.frequency.value = 130.81;
        state.ambienceOscillatorB.frequency.value = 196;
        return;
    }
    if (mode === "cool") {
        state.ambienceOscillatorA.frequency.value = 174.61;
        state.ambienceOscillatorB.frequency.value = 261.63;
        return;
    }
    state.ambienceOscillatorA.frequency.value = 146.83;
    state.ambienceOscillatorB.frequency.value = 220;
}
function rampAmbienceGain(duration = 0.6) {
    const context = state.context;
    const gain = state.ambienceGain;
    if (!context || !gain) {
        return;
    }
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(getTargetMusicGain(), now + duration);
}
function playClickSfx(frequency, durationSec, gainScale) {
    const context = ensureContext();
    if (!context || gainScale <= 0) {
        return;
    }
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    gain.gain.value = gainScale * 0.12;
    osc.connect(gain);
    gain.connect(context.destination);
    const now = context.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.start(now);
    osc.stop(now + durationSec);
}
function playCue(cue) {
    const sfxScale = getSfxGainScale();
    if (cue === "shuffle-start") {
        playClickSfx(160, 0.25, sfxScale);
        return;
    }
    if (cue === "shuffle-end") {
        playClickSfx(240, 0.2, sfxScale);
        return;
    }
    if (cue === "deck-activate") {
        playClickSfx(320, 0.16, sfxScale);
        return;
    }
    if (cue === "card-pick") {
        playClickSfx(360, 0.14, sfxScale);
        return;
    }
    if (cue === "card-reveal") {
        playClickSfx(430, 0.18, sfxScale);
        return;
    }
    if (cue === "modal-open") {
        playClickSfx(280, 0.16, sfxScale);
        return;
    }
    if (cue === "modal-close") {
        playClickSfx(220, 0.16, sfxScale);
    }
}
export function useAudioEngine() {
    const isReady = ref(false);
    async function ensureStarted() {
        const context = ensureContext();
        if (!context) {
            return;
        }
        if (context.state === "suspended") {
            await context.resume();
        }
        setupAmbienceNodes(context);
        rampAmbienceGain(0.8);
        state.started = true;
        isReady.value = true;
    }
    function applySettings(settings, options) {
        currentSettings = {
            ...currentSettings,
            ...settings
        };
        if (options?.ritualSilence) {
            if (state.ambienceGain && state.context) {
                const now = state.context.currentTime;
                state.ambienceGain.gain.cancelScheduledValues(now);
                state.ambienceGain.gain.setValueAtTime(state.ambienceGain.gain.value, now);
                state.ambienceGain.gain.linearRampToValueAtTime(0.001, now + 0.35);
            }
            return;
        }
        rampAmbienceGain(0.35);
    }
    function setDeckMusicMode(mode) {
        setMusicMode(mode);
    }
    function triggerCue(cue) {
        playCue(cue);
    }
    onBeforeUnmount(() => {
        isReady.value = false;
    });
    return {
        isReady,
        ensureStarted,
        applySettings,
        setDeckMusicMode,
        triggerCue
    };
}
