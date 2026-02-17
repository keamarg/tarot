import { publicAssetUrl } from "@/app/publicAsset";
import { getCardById } from "@/domain/cards";
import { getDeckById } from "@/modules/decks/deckCatalog";

export function resolveDeckCardPath(deckId: string, cardId: string): string {
  const deck = getDeckById(deckId);
  const card = getCardById(cardId);
  const overridePath = deck.cardOverrides?.[cardId];
  if (overridePath) {
    return overridePath;
  }
  return `${deck.cardsBasePath}/${card.image}`;
}

export function resolveDeckCardImage(deckId: string, cardId: string): string {
  return publicAssetUrl(resolveDeckCardPath(deckId, cardId));
}

export function resolveDeckBackImage(deckId: string): string {
  const deck = getDeckById(deckId);
  return publicAssetUrl(deck.cardBackPath);
}

export function resolveDeckFrontFilter(deckId: string): string {
  const deck = getDeckById(deckId);
  return deck.frontFilter ?? "none";
}

export function resolveDeckShadowTint(deckId: string): string {
  const deck = getDeckById(deckId);
  return deck.shadowTint ?? "rgba(0, 0, 0, 0.25)";
}
