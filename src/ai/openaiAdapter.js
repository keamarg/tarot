import { getCardName } from "@/domain/cards";
import { prompts } from "@/ai/prompts";
import { maxTokensFromQuality, readingMaxTokensFromQuality, qualityDirective, readingTemperatureFromQuality, trainingTemperatureFromQuality, visionTemperatureFromQuality } from "@/ai/quality";
import { parseReadingResponse, parseTrainingResponse, parseVisionResponse } from "@/ai/parsers";
import { cardIdFromName } from "@/ai/cardNameMatch";
import { hasServerProxy, withApiBase } from "@/ai/apiBase";
const OPENAI_PROXY_URL = withApiBase("/api/openai/chat/completions");
const OPENAI_DIRECT_URL = "https://api.openai.com/v1/chat/completions";
const SHOULD_USE_PROXY = hasServerProxy() || import.meta.env.DEV;
function extractOpenAIText(data) {
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("OpenAI returned no content.");
    }
    if (typeof content === "string") {
        return content;
    }
    return content.map((part) => part.text ?? "").join("\n");
}
export class OpenAIAdapter {
    apiKey;
    model;
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }
    async request(params) {
        const headers = {
            "content-type": "application/json"
        };
        const trimmedKey = this.apiKey.trim();
        if (trimmedKey) {
            headers.authorization = `Bearer ${trimmedKey}`;
        }
        const response = await fetch(SHOULD_USE_PROXY ? OPENAI_PROXY_URL : OPENAI_DIRECT_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: this.model,
                temperature: params.temperature,
                max_tokens: params.maxTokens,
                messages: [
                    { role: "system", content: params.system },
                    { role: "user", content: params.user }
                ]
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
        }
        const data = (await response.json());
        return extractOpenAIText(data);
    }
    async runTrainingTurn(input) {
        const cards = input.cardsInPlay.map((card) => ({
            cardId: card.cardId,
            cardName: getCardName(card.cardId),
            reversed: card.reversed,
            faceUp: card.faceUp
        }));
        const payload = {
            instruction: "Return ONLY valid JSON with shape { assistantMessage: string, hints?: string[], autoAdvanceStep?: boolean, effortScore?: number }. Include hint-first coaching. Set autoAdvanceStep=true only when user effort is clearly sufficient for the current step.",
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
            user: JSON.stringify(payload, null, 2),
            temperature: trainingTemperatureFromQuality(input.quality),
            maxTokens: maxTokensFromQuality(input.quality)
        });
        return parseTrainingResponse(raw);
    }
    async detectSpreadFromImage(input) {
        const instruction = {
            task: "Infer tarot spread and detected cards from image.",
            qualityDirective: qualityDirective(input.quality),
            output: "Return ONLY valid JSON: { guessedSpreadId?: string, spreadConfidence?: number(0..1), cards: [{ slotId?: string, cardId?: string, cardName?: string, reversed?: boolean, confidence?: number(0..1) }] }",
            supportedSpreadIds: ["one-card-daily", "three-card", "past-present-future", "horseshoe", "celtic-cross"]
        };
        const raw = await this.request({
            system: prompts.readingUpload,
            user: [
                { type: "text", text: JSON.stringify(instruction) },
                { type: "image_url", image_url: { url: `data:${input.mimeType};base64,${input.imageBase64}` } }
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
    async runReading(input) {
        const payload = {
            instruction: "Return ONLY valid JSON with shape { title: string, spreadName: string, positionReadings: [{ slotLabel: string, cardName: string, interpretation: string }], synthesis: string }.",
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
            user: JSON.stringify(payload, null, 2),
            temperature: readingTemperatureFromQuality(input.quality),
            maxTokens: readingMaxTokensFromQuality(input.quality)
        });
        return parseReadingResponse(raw);
    }
}
