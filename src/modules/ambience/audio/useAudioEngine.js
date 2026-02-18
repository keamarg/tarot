import { onBeforeUnmount, ref } from "vue";
import { publicAssetUrl } from "@/app/publicAsset";
const state = {
    activeSfx: new Set(),
    started: false
};
const defaultAudioSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    masterVolume: 0.5,
    musicVolume: 0.4,
    sfxVolume: 0.45
};
const AUDIO_REV = "20260218c";
const ambienceTrackUrl = publicAssetUrl(`audio/ambience-894.mp3?v=${AUDIO_REV}`);
const cardCueUrl = publicAssetUrl(`audio/card-cue-2792.mp3?v=${AUDIO_REV}`);
const airCueUrl = publicAssetUrl(`audio/air-cue-2605.mp3?v=${AUDIO_REV}`);
const musicTrackByMode = {
    warm: ambienceTrackUrl,
    cool: ambienceTrackUrl,
    neutral: ambienceTrackUrl
};
const cueLayers = {
    "shuffle-start": [
        { url: ambienceTrackUrl, volume: 0.05, playbackRate: 0.84 },
        { url: airCueUrl, volume: 0.045, playbackRate: 0.78, delayMs: 110 }
    ],
    "shuffle-end": [{ url: airCueUrl, volume: 0.038, playbackRate: 0.76 }],
    "deck-activate": [{ url: cardCueUrl, volume: 0.028, playbackRate: 0.7 }],
    "card-pick": [{ url: cardCueUrl, volume: 0.032, playbackRate: 0.74 }],
    "card-reveal": [{ url: cardCueUrl, volume: 0.036, playbackRate: 0.72 }],
    "step-advance": [{ url: cardCueUrl, volume: 0.03, playbackRate: 0.76 }],
    "modal-open": [{ url: airCueUrl, volume: 0.03, playbackRate: 0.74 }],
    "modal-close": [{ url: airCueUrl, volume: 0.028, playbackRate: 0.72 }]
};
let currentSettings = { ...defaultAudioSettings };
let currentMusicMode = "neutral";
function clampVolume(value) {
    return Math.max(0, Math.min(1, value));
}
function getTargetMusicVolume() {
    if (!currentSettings.musicEnabled) {
        return 0;
    }
    return clampVolume(currentSettings.masterVolume) * clampVolume(currentSettings.musicVolume) * 0.16;
}
function getSfxGainScale() {
    if (!currentSettings.sfxEnabled) {
        return 0;
    }
    return clampVolume(currentSettings.masterVolume) * clampVolume(currentSettings.sfxVolume);
}
function getMusicPlaybackRate() {
    if (currentMusicMode === "warm") {
        return 0.96;
    }
    if (currentMusicMode === "cool") {
        return 1.02;
    }
    return 1;
}
function createLoopTrack(url) {
    if (typeof window === "undefined") {
        return undefined;
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = getTargetMusicVolume();
    audio.playbackRate = getMusicPlaybackRate();
    return audio;
}
function ensureAmbienceTrack() {
    if (typeof window === "undefined") {
        return undefined;
    }
    const targetUrl = musicTrackByMode[currentMusicMode];
    if (!state.ambienceTrack) {
        state.ambienceTrack = createLoopTrack(targetUrl);
        return state.ambienceTrack;
    }
    if (state.ambienceTrack.src.endsWith(targetUrl)) {
        return state.ambienceTrack;
    }
    const previous = state.ambienceTrack;
    const previousProgress = previous.duration > 0 ? previous.currentTime / previous.duration : 0;
    previous.pause();
    state.ambienceTrack = createLoopTrack(targetUrl);
    if (state.ambienceTrack?.duration && previousProgress > 0) {
        state.ambienceTrack.currentTime = state.ambienceTrack.duration * previousProgress;
    }
    return state.ambienceTrack;
}
async function syncAmbiencePlayback() {
    const track = ensureAmbienceTrack();
    if (!track) {
        return;
    }
    track.volume = getTargetMusicVolume();
    track.playbackRate = getMusicPlaybackRate();
    if (!state.started || !currentSettings.musicEnabled) {
        track.pause();
        return;
    }
    try {
        await track.play();
    }
    catch {
        // Browser gesture restrictions are expected before the first click/tap.
    }
}
function playOneShot(layer) {
    if (typeof window === "undefined") {
        return;
    }
    const scaledVolume = clampVolume(layer.volume * getSfxGainScale());
    if (scaledVolume <= 0) {
        return;
    }
    const source = new Audio(layer.url);
    source.preload = "auto";
    source.volume = scaledVolume;
    source.playbackRate = layer.playbackRate ?? 1;
    const cleanup = () => {
        source.pause();
        source.src = "";
        state.activeSfx.delete(source);
    };
    source.addEventListener("ended", cleanup, { once: true });
    source.addEventListener("error", cleanup, { once: true });
    state.activeSfx.add(source);
    void source.play().catch(() => {
        cleanup();
    });
}
function playCue(cue) {
    if (!state.started || !currentSettings.sfxEnabled) {
        return;
    }
    const layers = cueLayers[cue];
    if (!layers?.length) {
        return;
    }
    for (const layer of layers) {
        const delayMs = Math.max(0, layer.delayMs ?? 0);
        if (delayMs > 0 && typeof window !== "undefined") {
            window.setTimeout(() => playOneShot(layer), delayMs);
        }
        else {
            playOneShot(layer);
        }
    }
}
function stopAllSfx() {
    for (const player of state.activeSfx) {
        player.pause();
        player.src = "";
    }
    state.activeSfx.clear();
}
export function useAudioEngine() {
    const isReady = ref(false);
    async function ensureStarted() {
        state.started = true;
        await syncAmbiencePlayback();
        isReady.value = true;
    }
    function applySettings(settings) {
        currentSettings = {
            ...currentSettings,
            ...settings
        };
        void syncAmbiencePlayback();
        if (!currentSettings.sfxEnabled) {
            stopAllSfx();
        }
    }
    function setDeckMusicMode(mode) {
        currentMusicMode = mode;
        void syncAmbiencePlayback();
    }
    function triggerCue(cue) {
        playCue(cue);
    }
    onBeforeUnmount(() => {
        state.started = false;
        state.ambienceTrack?.pause();
        stopAllSfx();
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
