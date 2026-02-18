import { cards, getCardName } from "@/domain/cards";
import { getSpreadById, spreads } from "@/domain/spreads";
function stableHash(input) {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) || 1;
}
function inferSpreadId(payloadLength, hash) {
    if (payloadLength < 135_000) {
        return "one-card-daily";
    }
    if (payloadLength < 450_000) {
        return hash % 4 === 0 ? "past-present-future" : "three-card";
    }
    if (payloadLength < 750_000) {
        return hash % 5 === 0 ? "horseshoe" : "three-card";
    }
    return "three-card";
}
export class MockAdapter {
    async runTrainingTurn(input) {
        const cardNames = input.cardsInPlay.map((card) => `${getCardName(card.cardId)}${card.reversed ? " (reversed)" : ""}`);
        const progress = `Step ${input.progress.stepIndex + 1} (${input.progress.stepType}): ${input.progress.stepText}. ` +
            `Next action key: ${input.progress.requiredAction}.`;
        const userWordCount = input.userMessage.trim().split(/\s+/).filter(Boolean).length;
        const autoAdvanceStep = input.progress.stepType === "manual" && userWordCount >= 24;
        const effortScore = Math.max(0, Math.min(1, userWordCount / 40));
        return {
            assistantMessage: `Practice mode mock response for ${input.exercise.title}. ` +
                `${progress}. Limit: ${input.exercise.rules.maxCardsInPlay} cards. ` +
                `Role: ${input.role}. Cards in play: ${cardNames.join(", ") || "none"}. ` +
                "Add your API key in Settings to enable live AI coaching.",
            hints: ["Start by naming one dominant symbol.", "Connect that symbol to the slot meaning."],
            autoAdvanceStep,
            effortScore
        };
    }
    async detectSpreadFromImage(input) {
        const payload = input.imageBase64 ?? "";
        const seed = stableHash(`${payload.slice(0, 4096)}|${payload.length}|${input.mimeType}|${input.quality}`);
        const guessedSpreadId = inferSpreadId(payload.length, seed);
        const fallbackSpreadId = spreads[0]?.id ?? "one-card-daily";
        const spread = getSpreadById(spreads.some((entry) => entry.id === guessedSpreadId) ? guessedSpreadId : fallbackSpreadId);
        const usedCardIndices = new Set();
        const detectedCards = spread.slots.map((slot, index) => {
            let candidateCardIndex = (seed + index * 37) % cards.length;
            while (usedCardIndices.has(candidateCardIndex)) {
                candidateCardIndex = (candidateCardIndex + 1) % cards.length;
            }
            usedCardIndices.add(candidateCardIndex);
            const card = cards[candidateCardIndex];
            return {
                slotId: slot.id,
                cardId: card.id,
                cardName: card.name,
                reversed: ((seed >> (index % 24)) & 1) === 1,
                confidence: Math.min(0.96, 0.56 + ((seed + index * 29) % 36) / 100)
            };
        });
        return {
            guessedSpreadId: spread.id,
            spreadConfidence: Math.min(0.93, 0.62 + (seed % 24) / 100),
            cards: detectedCards
        };
    }
    async runReading(input) {
        const context = input.context
            ? ` [${input.context.mode} | ${input.context.phase} | ${input.context.revealedCount}/${input.context.totalSlots}${input.context.ritualPhase ? ` | ritual:${input.context.ritualPhase}` : ""}${input.context.deckId ? ` | deck:${input.context.deckId}` : ""}]`
            : "";
        const questionContext = input.context?.questionText?.trim()
            ? ` Question focus: ${input.context.questionText.trim()}`
            : "";
        return {
            title: `${input.spread.name} Reading (Mock)`,
            spreadName: input.spread.name,
            positionReadings: input.cards.map((entry) => ({
                slotLabel: entry.slot.label,
                cardName: entry.card.name,
                interpretation: `Mock interpretation for ${entry.card.name}${entry.reversed ? " (reversed)" : ""} in ${entry.slot.label}.` +
                    context +
                    questionContext
            })),
            synthesis: "Add an Anthropic API key in Settings for full expert reading generation. This mock keeps the UI flow testable."
        };
    }
}
