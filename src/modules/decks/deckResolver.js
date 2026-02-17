import { publicAssetUrl } from "@/app/publicAsset";
import { getCardById } from "@/domain/cards";
import { getDeckById } from "@/modules/decks/deckCatalog";
export function resolveDeckCardPath(deckId, cardId) {
    const deck = getDeckById(deckId);
    const card = getCardById(cardId);
    const overridePath = deck.cardOverrides?.[cardId];
    if (overridePath) {
        return overridePath;
    }
    return `${deck.cardsBasePath}/${card.image}`;
}
export function resolveDeckCardImage(deckId, cardId) {
    return publicAssetUrl(resolveDeckCardPath(deckId, cardId));
}
export function resolveDeckBackImage(deckId) {
    const deck = getDeckById(deckId);
    return publicAssetUrl(deck.cardBackPath);
}
export function resolveDeckFrontFilter(deckId) {
    const deck = getDeckById(deckId);
    return deck.frontFilter ?? "none";
}
export function resolveDeckShadowTint(deckId) {
    const deck = getDeckById(deckId);
    return deck.shadowTint ?? "rgba(0, 0, 0, 0.25)";
}
