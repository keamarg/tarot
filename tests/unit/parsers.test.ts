import { describe, expect, it } from "vitest";
import { parseReadingResponse } from "@/ai/parsers";

describe("reading parser", () => {
  it("repairs missing commas between position reading objects", () => {
    const raw = `{
      "title": "Full Reading",
      "spreadName": "Three-Card Spread",
      "positionReadings": [
        {
          "slotLabel": "Past",
          "cardName": "The Fool",
          "interpretation": "A beginning."
        }
        {
          "slotLabel": "Present",
          "cardName": "The Magician",
          "interpretation": "Focused agency."
        }
      ],
      "synthesis": "You are moving from curiosity into agency."
    }`;

    const parsed = parseReadingResponse(raw);
    expect(parsed.positionReadings).toHaveLength(2);
    expect(parsed.positionReadings[0]?.slotLabel).toBe("Past");
    expect(parsed.positionReadings[1]?.slotLabel).toBe("Present");
  });

  it("falls back to safe reading output when JSON is unrecoverable", () => {
    const raw = "This response is malformed and does not contain JSON.";
    const parsed = parseReadingResponse(raw);

    expect(parsed.title).toBe("Reading");
    expect(parsed.spreadName).toBe("Tarot Reading");
    expect(parsed.positionReadings).toEqual([]);
    expect(parsed.synthesis).toContain("malformed");
  });

  it("does not expose raw JSON blob in synthesis when response is truncated", () => {
    const raw = `{
      "title": "Journey to Emotional Fulfillment",
      "spreadName": "Horseshoe",
      "positionReadings": [
        {
          "slotLabel": "Past",
          "cardName": "The Hermit",
          "interpretation": "Reflection."
        }
      ],
      "synthesis": "This reading shows`;

    const parsed = parseReadingResponse(raw);
    expect(parsed.title).toBe("Reading");
    expect(parsed.spreadName).toBe("Tarot Reading");
    expect(parsed.positionReadings).toEqual([]);
    expect(parsed.synthesis).toContain("truncated or malformed");
  });
});
