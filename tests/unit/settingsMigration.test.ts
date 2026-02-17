import { describe, expect, it } from "vitest";
import { normalizeSettings } from "@/modules/settings/settingsStore";

describe("settings migration", () => {
  it("hydrates missing ritual and ambience fields from defaults", () => {
    const normalized = normalizeSettings({
      provider: "anthropic",
      model: "claude-3-7-sonnet-latest",
      apiKeySession: "",
      quality: "standard",
      cardBackId: "original",
      reversalMode: "balanced",
      uiSkin: "classic",
      qaUseMock: false
    });

    expect(normalized.deckId.length).toBeGreaterThan(0);
    expect(normalized.paletteId).toBe("classic");
    expect(normalized.ritualPromptsEnabled).toBe(true);
    expect(normalized.musicEnabled).toBe(true);
    expect(normalized.masterVolume).toBeGreaterThan(0);
  });
});
