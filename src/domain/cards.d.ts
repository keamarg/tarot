import type { CardRef } from "@/domain/types";
export declare const cards: CardRef[];
export declare const cardIds: string[];
export declare function getCardById(cardId: string): CardRef;
export declare function getCardName(cardId: string): string;
export declare function getAllCardIds(): string[];
