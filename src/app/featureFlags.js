function envFlag(name, defaultValue) {
    const raw = String(import.meta.env[name] ?? "").trim().toLowerCase();
    if (!raw) {
        return defaultValue;
    }
    return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
export const featureFlags = {
    cinematicRitual: envFlag("VITE_FEATURE_CINEMATIC_RITUAL", true),
    fanPicking: envFlag("VITE_FEATURE_FAN_PICKING", true),
    ambienceScene: envFlag("VITE_FEATURE_AMBIENCE_SCENE", true),
    generatedAudio: envFlag("VITE_FEATURE_GENERATED_AUDIO", true),
    whisperVoice: envFlag("VITE_FEATURE_WHISPER_VOICE", true)
};
