import rawCards from "@data/cards.json";
import { cardsSchema } from "@/domain/schemas";
import type { CardRef } from "@/domain/types";

const parsed = cardsSchema.parse(rawCards);

export const cards: CardRef[] = parsed;

const byId = new Map(cards.map((card) => [card.id, card]));

export function getCardById(cardId: string): CardRef {
  const card = byId.get(cardId);
  if (!card) {
    throw new Error(`Unknown card id: ${cardId}`);
  }
  return card;
}

export function getCardName(cardId: string): string {
  return getCardById(cardId).name;
}
