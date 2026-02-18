export declare function parseVisionResponse(rawText: string): {
    cards: {
        slotId?: string | undefined;
        cardId?: string | undefined;
        cardName?: string | undefined;
        reversed?: boolean | undefined;
        confidence?: number | undefined;
    }[];
    guessedSpreadId?: string | undefined;
    spreadConfidence?: number | undefined;
};
export declare function parseReadingResponse(rawText: string): {
    title: string;
    spreadName: string;
    positionReadings: {
        cardName: string;
        slotLabel: string;
        interpretation: string;
    }[];
    synthesis: string;
};
export declare function parseTrainingResponse(rawText: string): {
    assistantMessage: string;
    hints?: string[] | undefined;
    autoAdvanceStep?: boolean | undefined;
    effortScore?: number | undefined;
};
