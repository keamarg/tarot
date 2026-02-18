import type { QualityPreset } from "@/domain/types";
import type { LLMAdapter, ReadingInput, TrainingTurnInput } from "@/domain/types";
export declare class MockAdapter implements LLMAdapter {
    runTrainingTurn(input: TrainingTurnInput): Promise<{
        assistantMessage: string;
        hints: string[];
        autoAdvanceStep: boolean;
        effortScore: number;
    }>;
    detectSpreadFromImage(input: {
        imageBase64: string;
        mimeType: string;
        quality: QualityPreset;
    }): Promise<{
        guessedSpreadId: string;
        spreadConfidence: number;
        cards: {
            slotId: string;
            cardId: string;
            cardName: string;
            reversed: boolean;
            confidence: number;
        }[];
    }>;
    runReading(input: ReadingInput): Promise<{
        title: string;
        spreadName: string;
        positionReadings: {
            slotLabel: string;
            cardName: string;
            interpretation: string;
        }[];
        synthesis: string;
    }>;
}
