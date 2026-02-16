import type { DrawnCard, ReadingInput, SpreadDefinition } from "@/domain/types";
export declare function toReadingInput(spread: SpreadDefinition, drawnCards: DrawnCard[]): ReadingInput;
export declare function applyCardEdit(cards: DrawnCard[], cardIndex: number, cardId: string, reversed: boolean): DrawnCard[];
