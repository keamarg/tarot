import type { DrawnCard, ReadingOutput, SpreadDefinition } from "@/domain/types";
export declare function exportReadingPdf(params: {
    fileName: string;
    reading: ReadingOutput;
    spread: SpreadDefinition;
    cards: DrawnCard[];
    deckId?: string;
    sourceImageDataUrl?: string;
    disclaimer?: string;
}): Promise<void>;
