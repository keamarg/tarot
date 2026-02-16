import { describe, expect, it } from "vitest";
import { cards } from "@/domain/cards";

describe("cards dataset", () => {
  it("contains exactly 78 unique cards", () => {
    expect(cards).toHaveLength(78);
    const uniqueIds = new Set(cards.map((card) => card.id));
    expect(uniqueIds.size).toBe(78);
  });

  it("contains 22 major and 56 minor arcana cards", () => {
    const major = cards.filter((card) => card.arcana === "major");
    const minor = cards.filter((card) => card.arcana === "minor");

    expect(major).toHaveLength(22);
    expect(minor).toHaveLength(56);
  });
});
