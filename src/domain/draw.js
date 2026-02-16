import { cards } from "@/domain/cards";
import { createRandom } from "@/domain/random";
function shouldReverse(mode, random) {
    if (mode === "none") {
        return false;
    }
    return random() >= 0.5;
}
export function drawCards(options) {
    const { count, reversalMode, seed } = options;
    if (count <= 0) {
        return [];
    }
    if (count > cards.length) {
        throw new Error(`Cannot draw ${count} cards from a ${cards.length} card deck.`);
    }
    const random = createRandom(seed);
    const deck = [...cards.map((card) => card.id)];
    for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.slice(0, count).map((cardId) => ({
        cardId,
        reversed: shouldReverse(reversalMode, random),
        faceUp: true
    }));
}
export function drawSingleCard(options) {
    const { existingCardIds, reversalMode, seed, iteration = 0 } = options;
    const random = createRandom(seed ? `${seed}:${iteration}:${existingCardIds.length}` : undefined);
    const available = cards.filter((card) => !existingCardIds.includes(card.id));
    if (available.length === 0) {
        throw new Error("No cards left to draw.");
    }
    const index = Math.floor(random() * available.length);
    return {
        cardId: available[index].id,
        reversed: shouldReverse(reversalMode, random),
        faceUp: true
    };
}
export function estimateBalancedReversalRatio(sampleSize = 1000, seed = "ratio") {
    const draws = drawCards({ count: Math.min(78, sampleSize), reversalMode: "balanced", seed });
    const reversedCount = draws.filter((card) => card.reversed).length;
    return reversedCount / draws.length;
}
