import type { DrawnCard, ReversalMode } from "@/domain/types";
export interface DrawOptions {
    count: number;
    reversalMode: ReversalMode;
    seed?: string;
}
export declare function drawCards(options: DrawOptions): DrawnCard[];
export declare function drawSingleCard(options: {
    existingCardIds: string[];
    reversalMode: ReversalMode;
    seed?: string;
    iteration?: number;
}): DrawnCard;
export declare function estimateBalancedReversalRatio(sampleSize?: number, seed?: string): number;
