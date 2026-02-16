import { getCardName } from "@/domain/cards";
import { prompts } from "@/ai/prompts";
import { maxTokensFromQuality, readingMaxTokensFromQuality, qualityDirective, readingTemperatureFromQuality, trainingTemperatureFromQuality, visionTemperatureFromQuality } from "@/ai/quality";
import { parseReadingResponse, parseTrainingResponse, parseVisionResponse } from "@/ai/parsers";
import { cardIdFromName } from "@/ai/cardNameMatch";
import { withApiBase } from "@/ai/apiBase";
const ANTHROPIC_PROXY_URL = withApiBase("/api/anthropic/messages");
const ANTHROPIC_DIRECT_URL = "https://api.anthropic.com/v1/messages";
function extractTextResponse(data) {
    return data.content.filter((item) => item.type === "text").map((item) => item.text).join("\n");
}
export class AnthropicAdapter {
    apiKey;
    model;
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }
    async request(body) {
        const trimmedKey = this.apiKey.trim();
        const headers = {
            "content-type": "application/json",
            "anthropic-version": "2023-06-01"
        };
        if (trimmedKey) {
            headers["x-api-key"] = trimmedKey;
            // Anthropic requires this for browser-originated CORS requests.
            // Keeping it enabled also works through the local Vite proxy.
            headers["anthropic-dangerous-direct-browser-access"] = "true";
        }
        let response;
        try {
            response = await fetch(ANTHROPIC_PROXY_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            });
        }
        catch {
            response = await fetch(ANTHROPIC_DIRECT_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            });
        }
        if (response.status === 404 || response.status === 405 || response.status === 502 || response.status === 504) {
            response = await fetch(ANTHROPIC_DIRECT_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            });
        }
        if (!response.ok) {
            const errorText = await response.text();
            const shouldRetryDirect = response.status === 401 &&
                errorText.toLowerCase().includes("anthropic-dangerous-direct-browser-access");
            if (shouldRetryDirect) {
                const directRetry = await fetch(ANTHROPIC_DIRECT_URL, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body)
                });
                if (directRetry.ok) {
                    const data = (await directRetry.json());
                    return extractTextResponse(data);
                }
                const retryErrorText = await directRetry.text();
                throw new Error(`Anthropic API error (${directRetry.status}): ${retryErrorText}`);
            }
            throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
        }
        const data = (await response.json());
        return extractTextResponse(data);
    }
    async runTrainingTurn(input) {
        const cards = input.cardsInPlay.map((card) => ({
            cardId: card.cardId,
            cardName: getCardName(card.cardId),
            reversed: card.reversed,
            faceUp: card.faceUp
        }));
        const payload = {
            instruction: "Return ONLY valid JSON with shape { assistantMessage: string, hints?: string[] }. Include hint-first coaching.",
            roleMode: input.role,
            drawMode: input.drawMode,
            exercise: {
                id: input.exercise.id,
                title: input.exercise.title,
                scenarioTemplate: input.exercise.scenarioTemplate,
                bookSummary: input.exercise.bookSummary ?? "",
                flowSteps: input.exercise.flowSteps,
                stepPlan: input.exercise.stepPlan ?? [],
                rules: input.exercise.rules
            },
            progress: {
                drawCount: input.progress.drawCount,
                stepIndex: input.progress.stepIndex,
                stepText: input.progress.stepText,
                stepType: input.progress.stepType,
                requiredAction: input.progress.requiredAction,
                totalSteps: input.progress.totalSteps,
                drawTargetForStep: input.progress.drawTargetForStep,
                cardsRemainingOverall: input.progress.cardsRemainingOverall
            },
            qualityMode: input.quality,
            qualityDirective: qualityDirective(input.quality),
            cardsInPlay: cards,
            userMessage: input.userMessage
        };
        const raw = await this.request({
            model: this.model,
            max_tokens: maxTokensFromQuality(input.quality),
            temperature: trainingTemperatureFromQuality(input.quality),
            system: prompts.training,
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }]
                }
            ]
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
            model: this.model,
            max_tokens: maxTokensFromQuality(input.quality),
            temperature: visionTemperatureFromQuality(input.quality),
            system: prompts.readingUpload,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(instruction)
                        },
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: input.mimeType,
                                data: input.imageBase64
                            }
                        }
                    ]
                }
            ]
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
            model: this.model,
            max_tokens: readingMaxTokensFromQuality(input.quality),
            temperature: readingTemperatureFromQuality(input.quality),
            system: prompts.readingAppDraw,
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }]
                }
            ]
        });
        return parseReadingResponse(raw);
    }
}
