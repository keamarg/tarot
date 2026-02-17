export interface WhisperRequest {
    text: string;
    enabled: boolean;
    volume: number;
}
export declare function speakWhisper(request: WhisperRequest): void;
export declare function stopWhisper(): void;
