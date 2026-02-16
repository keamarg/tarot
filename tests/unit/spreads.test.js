import { describe, expect, it } from "vitest";
import { spreads } from "@/domain/spreads";
const requiredSpreadIds = [
    "one-card-daily",
    "three-card",
    "past-present-future",
    "horseshoe",
    "celtic-cross"
];
describe("spread definitions", () => {
    it("includes all required v1 spreads", () => {
        const ids = new Set(spreads.map((spread) => spread.id));
        for (const id of requiredSpreadIds) {
            expect(ids.has(id)).toBe(true);
        }
    });
    it("ensures every spread has slot geometry", () => {
        for (const spread of spreads) {
            expect(spread.slots.length).toBeGreaterThan(0);
            for (const slot of spread.slots) {
                expect(slot.x).toBeGreaterThanOrEqual(0);
                expect(slot.x).toBeLessThanOrEqual(100);
                expect(slot.y).toBeGreaterThanOrEqual(0);
                expect(slot.y).toBeLessThanOrEqual(100);
            }
        }
    });
});
