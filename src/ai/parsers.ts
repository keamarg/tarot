import { z } from "zod";

const visionSchema = z.object({
  guessedSpreadId: z.string().optional(),
  spreadConfidence: z.number().min(0).max(1).optional(),
  cards: z
    .array(
      z.object({
        slotId: z.string().optional(),
        cardId: z.string().optional(),
        cardName: z.string().optional(),
        reversed: z.boolean().optional(),
        confidence: z.number().min(0).max(1).optional()
      })
    )
    .default([])
});

const readingSchema = z.object({
  title: z.string(),
  spreadName: z.string(),
  positionReadings: z.array(
    z.object({
      slotLabel: z.string(),
      cardName: z.string(),
      interpretation: z.string()
    })
  ),
  synthesis: z.string()
});

const trainingSchema = z.object({
  assistantMessage: z.string(),
  hints: z.array(z.string()).optional(),
  autoAdvanceStep: z.boolean().optional(),
  effortScore: z.number().min(0).max(1).optional()
});

function extractFirstJsonBlock(text: string): string {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fencedMatch?.[1] ?? text;
  const start = source.indexOf("{");
  if (start === -1) {
    throw new Error("No JSON object found in model response.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error("Could not find a complete JSON object in model response.");
}

function repairLikelyJson(text: string): string {
  return text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/}\s*(?={)/g, "},")
    .replace(/]\s*(?=\[)/g, "],");
}

function parseJsonWithRepair(rawText: string): unknown {
  const block = extractFirstJsonBlock(rawText);
  const attempts = [block, repairLikelyJson(block)];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to parse JSON model response.");
}

function asReadingOutputCandidate(rawText: string, candidate: unknown) {
  const object = candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>) : {};
  const rawPositionReadings = Array.isArray(object.positionReadings) ? object.positionReadings : [];
  const positionReadings = rawPositionReadings.reduce<Array<{ slotLabel: string; cardName: string; interpretation: string }>>(
    (accumulator, entry, index) => {
      if (!entry || typeof entry !== "object") {
        return accumulator;
      }
      const item = entry as Record<string, unknown>;
      const slotLabel =
        typeof item.slotLabel === "string" && item.slotLabel.trim().length > 0
          ? item.slotLabel.trim()
          : `Position ${index + 1}`;
      const cardName =
        typeof item.cardName === "string" && item.cardName.trim().length > 0
          ? item.cardName.trim()
          : "Unknown Card";
      const interpretation =
        typeof item.interpretation === "string" && item.interpretation.trim().length > 0
          ? item.interpretation.trim()
          : "";
      accumulator.push({ slotLabel, cardName, interpretation });
      return accumulator;
    },
    []
  );

  const rawSynthesis =
    typeof object.synthesis === "string" && object.synthesis.trim().length > 0
      ? object.synthesis.trim()
      : rawText.replace(/```/g, "").trim();
  const looksJsonLike =
    rawSynthesis.startsWith("{") ||
    rawSynthesis.startsWith("[") ||
    rawSynthesis.includes('"positionReadings"') ||
    rawSynthesis.includes('"spreadName"');
  const synthesis =
    rawSynthesis.length > 0 && !looksJsonLike
      ? rawSynthesis
      : "The model response was truncated or malformed before valid reading JSON could be completed. Please retry the reading.";

  return {
    title:
      typeof object.title === "string" && object.title.trim().length > 0 ? object.title.trim() : "Reading",
    spreadName:
      typeof object.spreadName === "string" && object.spreadName.trim().length > 0
        ? object.spreadName.trim()
        : "Tarot Reading",
    positionReadings,
    synthesis
  };
}

export function parseVisionResponse(rawText: string) {
  const json = parseJsonWithRepair(rawText);
  return visionSchema.parse(json);
}

export function parseReadingResponse(rawText: string) {
  try {
    const json = parseJsonWithRepair(rawText);
    return readingSchema.parse(json);
  } catch {
    const candidate = (() => {
      try {
        return parseJsonWithRepair(rawText);
      } catch {
        return undefined;
      }
    })();
    return readingSchema.parse(asReadingOutputCandidate(rawText, candidate));
  }
}

export function parseTrainingResponse(rawText: string) {
  const json = parseJsonWithRepair(rawText);
  return trainingSchema.parse(json);
}
