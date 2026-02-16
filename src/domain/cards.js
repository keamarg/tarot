import rawCards from "@data/cards.json";
import { cardsSchema } from "@/domain/schemas";
const parsed = cardsSchema.parse(rawCards);
export const cards = parsed;
const byId = new Map(cards.map((card) => [card.id, card]));
export function getCardById(cardId) {
    const card = byId.get(cardId);
    if (!card) {
        throw new Error(`Unknown card id: ${cardId}`);
    }
    return card;
}
export function getCardName(cardId) {
    return getCardById(cardId).name;
}
