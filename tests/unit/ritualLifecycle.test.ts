import { describe, expect, it } from "vitest";
import { nextReadingPhase, supportsFanPicking } from "@/modules/ritual/lifecycle";

describe("ritual lifecycle", () => {
  it("moves app draw from setup to question to shuffle", () => {
    expect(nextReadingPhase("setup", { mode: "app_draw", spreadId: "three-card" })).toBe("question");
    expect(nextReadingPhase("question", { mode: "app_draw", spreadId: "three-card" })).toBe("shuffle");
  });

  it("moves upload from question to followup", () => {
    expect(nextReadingPhase("question", { mode: "upload", spreadId: "three-card" })).toBe("followup");
  });

  it("routes shuffle to pick only for one and three card spreads", () => {
    expect(supportsFanPicking("one-card-daily")).toBe(true);
    expect(supportsFanPicking("three-card")).toBe(true);
    expect(supportsFanPicking("celtic-cross")).toBe(false);

    expect(nextReadingPhase("shuffle", { mode: "app_draw", spreadId: "three-card" })).toBe("pick");
    expect(nextReadingPhase("shuffle", { mode: "app_draw", spreadId: "horseshoe" })).toBe("reveal");
  });
});
