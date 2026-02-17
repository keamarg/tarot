import type { AmbientScene, DeckDefinition, PaletteDefinition } from "@/domain/types";
export declare const decks: DeckDefinition[];
export declare const availableDecks: DeckDefinition[];
export declare const palettes: PaletteDefinition[];
export declare const ambientScenes: AmbientScene[];
export declare function getDeckById(deckId: string): DeckDefinition;
export declare function getPaletteById(paletteId: string): PaletteDefinition;
export declare function getAmbientSceneById(sceneId: string): AmbientScene;
