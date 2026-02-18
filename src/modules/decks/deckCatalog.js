import rawOriginalDeck from "@data/decks/original-rws.json";
import rawRadiantDeck from "@data/decks/radiant-rws.json";
import rawMarseilleDeck from "@data/decks/marseille-heritage.json";
import rawPalettes from "@data/palettes.json";
import rawScenes from "@data/ambience-scenes.json";
import { ambientScenesSchema, decksSchema, palettesSchema } from "@/domain/schemas";
const parsedDecks = decksSchema.parse([rawOriginalDeck, rawRadiantDeck, rawMarseilleDeck]);
const parsedPalettes = palettesSchema.parse(rawPalettes);
const parsedScenes = ambientScenesSchema.parse(rawScenes);
export const decks = parsedDecks;
export const availableDecks = parsedDecks.filter((deck) => deck.enabled !== false);
export const palettes = parsedPalettes;
export const ambientScenes = parsedScenes;
const deckById = new Map(availableDecks.map((deck) => [deck.id, deck]));
const paletteById = new Map(parsedPalettes.map((palette) => [palette.id, palette]));
const sceneById = new Map(parsedScenes.map((scene) => [scene.id, scene]));
export function getDeckById(deckId) {
    const resolved = deckById.get(deckId) ?? availableDecks[0];
    if (!resolved) {
        throw new Error("No deck definitions available.");
    }
    return resolved;
}
export function getPaletteById(paletteId) {
    const resolved = paletteById.get(paletteId) ?? parsedPalettes[0];
    if (!resolved) {
        throw new Error("No palette definitions available.");
    }
    return resolved;
}
export function getAmbientSceneById(sceneId) {
    const resolved = sceneById.get(sceneId) ?? parsedScenes[0];
    if (!resolved) {
        throw new Error("No ambience scene definitions available.");
    }
    return resolved;
}
