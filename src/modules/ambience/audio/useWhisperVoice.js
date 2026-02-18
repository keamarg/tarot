const femaleVoiceHints = [
    "female",
    "woman",
    "girl",
    "samantha",
    "zira",
    "aria",
    "siri",
    "victoria",
    "karen",
    "ava",
    "allison",
    "zoe",
    "serena",
    "moira",
    "fiona"
];
function pickWhisperVoice(voices) {
    if (!voices.length) {
        return undefined;
    }
    const lowerIncludesHint = (voice) => {
        const value = `${voice.name} ${voice.lang}`.toLowerCase();
        return femaleVoiceHints.some((hint) => value.includes(hint));
    };
    const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
    const hintedEnglish = englishVoices.find(lowerIncludesHint);
    if (hintedEnglish) {
        return hintedEnglish;
    }
    const hintedAny = voices.find(lowerIncludesHint);
    if (hintedAny) {
        return hintedAny;
    }
    return undefined;
}
export function speakWhisper(request) {
    if (!request.enabled) {
        return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }
    const trimmed = request.text.trim();
    if (!trimmed) {
        return;
    }
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (!voices.length) {
        const retry = () => {
            synth.removeEventListener("voiceschanged", retry);
            speakWhisper(request);
        };
        synth.addEventListener("voiceschanged", retry, { once: true });
        return;
    }
    const preferredVoice = pickWhisperVoice(voices);
    if (!preferredVoice) {
        return;
    }
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.rate = 0.74;
    utterance.pitch = 1.05;
    utterance.volume = Math.max(0, Math.min(0.4, request.volume));
    utterance.voice = preferredVoice;
    synth.cancel();
    synth.speak(utterance);
}
export function stopWhisper() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }
    window.speechSynthesis.cancel();
}
