import { describe, expect, it } from "vitest";
import { cardIdFromName } from "@/ai/cardNameMatch";

describe("card name/id normalization", () => {
  it("matches short major arcana names", () => {
    expect(cardIdFromName("hermit")).toBe("major-09-the-hermit");
    expect(cardIdFromName("world")).toBe("major-21-the-world");
  });

  it("matches minor arcana slug-like names with numerals", () => {
    expect(cardIdFromName("10-of-wands")).toBe("minor-wands-ten");
    expect(cardIdFromName("9-of-cups")).toBe("minor-cups-nine");
  });

  it("accepts canonical IDs as input", () => {
    expect(cardIdFromName("minor-cups-knight")).toBe("minor-cups-knight");
  });
});
