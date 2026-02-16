import type { LLMAdapter, ReadingInput, TrainingTurnInput } from "@/domain/types";
export declare class MockAdapter implements LLMAdapter {
    runTrainingTurn(input: TrainingTurnInput): Promise<{
        assistantMessage: string;
        hints: string[];
    }>;
    detectSpreadFromImage(): Promise<{
        guessedSpreadId: string;
        spreadConfidence: number;
        cards: never[];
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
