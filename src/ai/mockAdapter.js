import { getCardName } from "@/domain/cards";
export class MockAdapter {
    async runTrainingTurn(input) {
        const cardNames = input.cardsInPlay.map((card) => `${getCardName(card.cardId)}${card.reversed ? " (reversed)" : ""}`);
        const progress = `Step ${input.progress.stepIndex + 1} (${input.progress.stepType}): ${input.progress.stepText}. ` +
            `Next action key: ${input.progress.requiredAction}.`;
        return {
            assistantMessage: `Practice mode mock response for ${input.exercise.title}. ` +
                `${progress}. Limit: ${input.exercise.rules.maxCardsInPlay} cards. ` +
                `Role: ${input.role}. Cards in play: ${cardNames.join(", ") || "none"}. ` +
                "Add your API key in Settings to enable live AI coaching.",
            hints: ["Start by naming one dominant symbol.", "Connect that symbol to the slot meaning."]
        };
    }
    async detectSpreadFromImage() {
        return {
            guessedSpreadId: "three-card",
            spreadConfidence: 0.42,
            cards: []
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
