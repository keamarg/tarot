import { describe, expect, it } from "vitest";
import { drawCards } from "@/domain/draw";
describe("draw engine", () => {
    it("draws unique cards within one spread", () => {
        const result = drawCards({ count: 10, reversalMode: "balanced", seed: "abc" });
        const unique = new Set(result.map((card) => card.cardId));
        expect(unique.size).toBe(10);
    });
    it("uses deterministic output when seed is fixed", () => {
        const first = drawCards({ count: 10, reversalMode: "balanced", seed: "same-seed" });
        const second = drawCards({ count: 10, reversalMode: "balanced", seed: "same-seed" });
        expect(first).toEqual(second);
    });
    it("uses no reversed cards when reversal mode is none", () => {
        const result = drawCards({ count: 30, reversalMode: "none", seed: "none" });
        expect(result.every((card) => card.reversed === false)).toBe(true);
    });
    it("balanced mode includes both reversed and upright cards over a large sample", () => {
        const result = drawCards({ count: 78, reversalMode: "balanced", seed: "ratio-check" });
        const reversedCount = result.filter((card) => card.reversed).length;
        expect(reversedCount).toBeGreaterThan(15);
        expect(reversedCount).toBeLessThan(63);
    });
});
