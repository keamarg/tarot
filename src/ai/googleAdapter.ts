import { getCardName } from "@/domain/cards";
import { prompts } from "@/ai/prompts";
import {
  maxTokensFromQuality,
  readingMaxTokensFromQuality,
  qualityDirective,
  readingTemperatureFromQuality,
  trainingTemperatureFromQuality,
  visionTemperatureFromQuality
} from "@/ai/quality";
import { parseReadingResponse, parseTrainingResponse, parseVisionResponse } from "@/ai/parsers";
import { cardIdFromName } from "@/ai/cardNameMatch";
import { hasServerProxy, withApiBase } from "@/ai/apiBase";
import type {
  LLMAdapter,
  ReadingInput,
  ReadingOutput,
  TrainingTurnInput,
  TrainingTurnOutput,
  VisionDetectionResult
} from "@/domain/types";

interface GooglePartText {
  text: string;
}

interface GooglePartInline {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

interface GoogleResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function extractGoogleText(data: GoogleResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part) => part.text ?? "").join("\n").trim();
  if (!text) {
    throw new Error("Google returned no content.");
  }
  return text;
}

export class GoogleAdapter implements LLMAdapter {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  private endpoint(): string {
    const trimmedKey = this.apiKey.trim();
    const keyQuery = trimmedKey ? `?key=${encodeURIComponent(trimmedKey)}` : "";
    if (hasServerProxy()) {
      return withApiBase(`/api/google/models/${this.model}:generateContent`);
    }
    if (import.meta.env.DEV) {
      return `/api/google/models/${this.model}:generateContent${keyQuery}`;
    }
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent${keyQuery}`;
  }

  private async request(params: {
    system: string;
    userParts: Array<GooglePartText | GooglePartInline>;
    temperature: number;
    maxTokens: number;
  }): Promise<string> {
    const response = await fetch(this.endpoint(), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: params.system }]
        },
        contents: [
          {
            role: "user",
            parts: params.userParts
          }
        ],
        generationConfig: {
          temperature: params.temperature,
          maxOutputTokens: params.maxTokens
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as GoogleResponse;
    return extractGoogleText(data);
  }

  async runTrainingTurn(input: TrainingTurnInput): Promise<TrainingTurnOutput> {
    const cards = input.cardsInPlay.map((card) => ({
      cardId: card.cardId,
      cardName: getCardName(card.cardId),
      reversed: card.reversed,
      faceUp: card.faceUp
    }));

    const payload = {
      instruction:
        "Return ONLY valid JSON with shape { assistantMessage: string, hints?: string[] }. Include hint-first coaching.",
      roleMode: input.role,
      drawMode: input.drawMode,
      exercise: {
        id: input.exercise.id,
        title: input.exercise.title,
        scenarioTemplate: input.exercise.scenarioTemplate,
        flowSteps: input.exercise.flowSteps,
        rules: input.exercise.rules
      },
      progress: input.progress,
      qualityMode: input.quality,
      qualityDirective: qualityDirective(input.quality),
      cardsInPlay: cards,
      userMessage: input.userMessage
    };

    const raw = await this.request({
      system: prompts.training,
      userParts: [{ text: JSON.stringify(payload, null, 2) }],
      temperature: trainingTemperatureFromQuality(input.quality),
      maxTokens: maxTokensFromQuality(input.quality)
    });
    return parseTrainingResponse(raw);
  }

  async detectSpreadFromImage(input: {
    imageBase64: string;
    mimeType: string;
    quality: "low" | "standard" | "high";
  }): Promise<VisionDetectionResult> {
    const instruction = {
      task: "Infer tarot spread and detected cards from image.",
      qualityDirective: qualityDirective(input.quality),
      output:
        "Return ONLY valid JSON: { guessedSpreadId?: string, spreadConfidence?: number(0..1), cards: [{ slotId?: string, cardId?: string, cardName?: string, reversed?: boolean, confidence?: number(0..1) }] }",
      supportedSpreadIds: ["one-card-daily", "three-card", "past-present-future", "horseshoe", "celtic-cross"]
    };

    const raw = await this.request({
      system: prompts.readingUpload,
      userParts: [
        { text: JSON.stringify(instruction) },
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.imageBase64
          }
        }
      ],
      temperature: visionTemperatureFromQuality(input.quality),
      maxTokens: maxTokensFromQuality(input.quality)
    });

    const parsed = parseVisionResponse(raw);
    return {
      ...parsed,
      cards: parsed.cards.map((card) => ({
        ...card,
        cardId: cardIdFromName(card.cardId) ?? cardIdFromName(card.cardName)
      }))
    };
  }

  async runReading(input: ReadingInput): Promise<ReadingOutput> {
    const payload = {
      instruction:
        "Return ONLY valid JSON with shape { title: string, spreadName: string, positionReadings: [{ slotLabel: string, cardName: string, interpretation: string }], synthesis: string }.",
      spread: {
        id: input.spread.id,
        name: input.spread.name,
        slots: input.spread.slots.map((slot) => ({
          id: slot.id,
          label: slot.label,
          meaning: slot.meaning
        }))
      },
      cards: input.cards.map((entry) => ({
        slotId: entry.slot.id,
        slotLabel: entry.slot.label,
        slotMeaning: entry.slot.meaning,
        cardId: entry.card.id,
        cardName: entry.card.name,
        reversed: entry.reversed
      })),
      context: input.context ?? null,
      qualityMode: input.quality,
      qualityDirective: qualityDirective(input.quality),
      userIntent: input.userIntent ?? "",
      format: "position-by-position then synthesis"
    };

    const raw = await this.request({
      system: prompts.readingAppDraw,
      userParts: [{ text: JSON.stringify(payload, null, 2) }],
      temperature: readingTemperatureFromQuality(input.quality),
      maxTokens: readingMaxTokensFromQuality(input.quality)
    });

    return parseReadingResponse(raw);
  }
}
