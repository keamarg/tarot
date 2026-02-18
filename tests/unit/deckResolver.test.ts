import { describe, expect, it } from "vitest";
import { availableDecks } from "@/modules/decks/deckCatalog";
import { resolveDeckBackImage, resolveDeckCardPath } from "@/modules/decks/deckResolver";

describe("deck resolver", () => {
  it("includes the required premium deck options", () => {
    const ids = new Set(availableDecks.map((deck) => deck.id));
    expect(ids.has("original-rws")).toBe(true);
    expect(ids.has("radiant-rws")).toBe(true);
    expect(ids.has("marseille-heritage")).toBe(true);
  });

  it("resolves card path and back path for each enabled deck", () => {
    for (const deck of availableDecks) {
      const path = resolveDeckCardPath(deck.id, "major-00-the-fool");
      expect(path.length).toBeGreaterThan(0);
      expect(path.includes("major-00-the-fool")).toBe(true);

      const back = resolveDeckBackImage(deck.id);
      expect(back.length).toBeGreaterThan(0);
      expect(back.includes("backs/")).toBe(true);
    }
  });
});
