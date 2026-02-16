import type { LLMAdapter, ReadingInput, ReadingOutput, TrainingTurnInput, TrainingTurnOutput, VisionDetectionResult } from "@/domain/types";
export declare class GoogleAdapter implements LLMAdapter {
    private readonly apiKey;
    private readonly model;
    constructor(apiKey: string, model: string);
    private endpoint;
    private request;
    runTrainingTurn(input: TrainingTurnInput): Promise<TrainingTurnOutput>;
    detectSpreadFromImage(input: {
        imageBase64: string;
        mimeType: string;
        quality: "low" | "standard" | "high";
    }): Promise<VisionDetectionResult>;
    runReading(input: ReadingInput): Promise<ReadingOutput>;
}
