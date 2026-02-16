import { getCardById } from "@/domain/cards";
export function toReadingInput(spread, drawnCards) {
    return {
        spread,
        cards: spread.slots.map((slot, index) => {
            const draw = drawnCards[index];
            if (!draw) {
                throw new Error(`Missing card for slot ${slot.id}`);
            }
            const card = getCardById(draw.cardId);
            return {
                slot,
                card,
                reversed: draw.reversed
            };
        }),
        quality: "standard"
    };
}
export function applyCardEdit(cards, cardIndex, cardId, reversed) {
    return cards.map((card, index) => {
        if (index !== cardIndex) {
            return card;
        }
        return {
            ...card,
            cardId,
            reversed
        };
    });
}
