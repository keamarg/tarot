import type { LLMAdapter, ReadingInput, TrainingTurnInput, VisionDetectionResult, ReadingOutput, TrainingTurnOutput } from "@/domain/types";
export declare class AnthropicAdapter implements LLMAdapter {
    private readonly apiKey;
    private readonly model;
    constructor(apiKey: string, model: string);
    private request;
    runTrainingTurn(input: TrainingTurnInput): Promise<TrainingTurnOutput>;
    detectSpreadFromImage(input: {
        imageBase64: string;
        mimeType: string;
        quality: "low" | "standard" | "high";
    }): Promise<VisionDetectionResult>;
    runReading(input: ReadingInput): Promise<ReadingOutput>;
}
