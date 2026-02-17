export interface WhisperRequest {
  text: string;
  enabled: boolean;
  volume: number;
}

export function speakWhisper(request: WhisperRequest): void {
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

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.rate = 0.86;
  utterance.pitch = 0.72;
  utterance.volume = Math.max(0, Math.min(1, request.volume));
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopWhisper(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
}
