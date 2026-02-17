<template>
  <section class="training-module">
    <header class="module-topbar">
      <button type="button" class="icon-btn" aria-label="Reset training module" @click="resetTrainingModule">
        <RotateCcw :size="15" />
        <span>Start over</span>
      </button>
    </header>

    <section v-if="hasStarted" class="workspace">
      <article class="card stage-card">
        <header class="stage-header">
          <h3>{{ selectedExercise?.title }}</h3>
        </header>

        <div class="board-shell">
          <CardsInPlayBoard
            :cards="cardsInPlay"
            :editable="canModifyCards"
            title=""
            empty-text="No cards in play yet. Draw a card or add one manually."
            @edit-card="onEditCard"
            @remove-card="removeCard"
          />
          <div class="board-footer">
            <div v-if="showBoardActions" class="board-actions">
              <button
                v-if="primaryActionMode"
                :key="`${primaryActionMode}-${primaryActionFlipToken}`"
                class="primary action-toggle"
                type="button"
                @click="handlePrimaryAction"
              >
                {{ primaryActionLabel }}
              </button>
              <button v-if="showAddNamedCardButton" type="button" @click="addNamedCard">Add Named Card</button>
            </div>
            <p v-if="activeStepType === 'draw' && !canDrawOverall" class="small limit-note">
              This exercise has reached its card limit. You can still edit or remove existing cards.
            </p>
            <p v-else-if="activeStepType === 'draw' && !canDrawForStep" class="small limit-note">
              Step draw requirement complete. Continue when ready.
            </p>
            <p v-else-if="activeStepType === 'manual' && !hasRequiredCardsForStep" class="small limit-note">
              Draw the required cards before you continue to the next step.
            </p>
          </div>
        </div>
      </article>

      <article class="card transcript-column">
        <header class="dialogue-header">
          <h3>Training Dialogue</h3>
          <button type="button" class="small-ghost" @click="exerciseInfoOpen = true">Exercise Notes</button>
        </header>

        <section class="exercise-status">
          <p class="small">
            {{ selectedExercise?.scenarioTemplate }}
          </p>
          <div class="deck-usage" :class="{ full: cardsRemainingOverall === 0 }">
            <div class="deck-usage-row">
              <span class="deck-usage-label">Deck Usage</span>
              <span class="deck-usage-count">{{ cardsInPlay.length }} / {{ maxCardsInPlay }}</span>
            </div>
            <div class="deck-usage-meter" role="presentation" aria-hidden="true">
              <span :style="{ width: `${deckUsagePercent}%` }"></span>
            </div>
          </div>
          <ol class="step-tracker">
            <li
              v-for="(step, index) in normalizedSteps"
              :key="`${selectedExercise?.id}-${index}`"
              :class="{
                current: index === activeStepIndex,
                complete: index < activeStepIndex,
                upcoming: index > activeStepIndex
              }"
            >
              <span class="step-number">{{ index + 1 }}</span>
              <span class="step-text">{{ step.text }}</span>
            </li>
          </ol>
        </section>

        <p class="small" v-if="!settingsStore.hasApiKey && !usesServerProxy">
          API key not set: using local mock adapter. Add key in Settings for live AI guidance.
        </p>

        <div ref="messagesRef" class="messages" aria-live="polite" @scroll="onMessagesScroll">
          <article
            v-for="(entry, index) in transcript"
            :key="`${entry.speaker}-${index}`"
            class="message"
            :class="entry.speaker"
          >
            <strong>{{ entry.speaker === "user" ? "You" : "AI" }}</strong>
            <p>{{ entry.text }}</p>
          </article>
        </div>

        <label class="dialogue-input">
          <span>Your message</span>
          <textarea
            v-model="userMessage"
            rows="4"
            placeholder="Share your interpretation or ask for a hint."
          />
        </label>

        <div class="dialogue-actions">
          <button class="primary" type="button" :disabled="isLoading || !selectedExercise || cardsInPlay.length === 0" @click="sendMessage">
            {{ isLoading ? "Thinking..." : "Send" }}
          </button>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
      </article>
    </section>

    <CardEditorDialog
      :open="editor.open"
      :initial-card-id="editor.cardId"
      :initial-reversed="editor.reversed"
      @close="closeEditor"
      @confirm="applyCardEditFromDialog"
    />

    <div
      v-if="setupOpen"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="training-setup-title"
      @click.self="closeSetup"
    >
      <article class="card setup-modal">
        <header class="setup-header">
          <h3 id="training-setup-title">Training Setup</h3>
          <button type="button" aria-label="Close setup" @click="closeSetup">Close</button>
        </header>

        <label>
          Exercise
          <select v-model="selectedExerciseId">
            <option v-for="exercise in activeExercises" :key="exercise.id" :value="exercise.id">
              {{ exercise.title }}
            </option>
          </select>
        </label>

        <p v-if="selectedExercise" class="small">{{ selectedExercise.scenarioTemplate }}</p>

        <ol v-if="selectedExercise" class="small">
          <li v-for="(step, index) in selectedExercise.flowSteps" :key="`${selectedExercise.id}-${index}`">{{ step }}</li>
        </ol>

        <div class="setup-actions">
          <button class="primary" type="button" @click="startTraining">Start Training</button>
        </div>
      </article>
    </div>

    <div
      v-if="exerciseInfoOpen && selectedExercise"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-notes-title"
      @click.self="exerciseInfoOpen = false"
    >
      <article class="card exercise-notes-modal">
        <header class="setup-header">
          <h3 id="exercise-notes-title">{{ selectedExercise.title }}</h3>
          <button type="button" aria-label="Close exercise notes" @click="exerciseInfoOpen = false">Close</button>
        </header>

        <p class="small">
          {{ selectedExercise.bookSummary || selectedExercise.scenarioTemplate }}
        </p>

        <ol class="small notes-steps">
          <li
            v-for="(step, index) in normalizedSteps"
            :key="`notes-${selectedExercise.id}-${index}`"
          >
            <strong>Step {{ index + 1 }}:</strong> {{ step.text }}
          </li>
        </ol>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RotateCcw } from "lucide-vue-next";
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { activeExercises, getExerciseById } from "@/domain/exercises";
import { cards } from "@/domain/cards";
import { drawSingleCard } from "@/domain/draw";
import CardsInPlayBoard from "@/app/components/CardsInPlayBoard.vue";
import CardEditorDialog from "@/app/components/CardEditorDialog.vue";
import { useAutoScroll } from "@/app/composables/useAutoScroll";
import { appendAssistantMessageIncremental } from "@/app/composables/useIncrementalDialogue";
import { useSettingsStore } from "@/modules/settings/settingsStore";
import { useSessionStore } from "@/app/sessionStore";
import { createLLMAdapter } from "@/ai/factory";
import { MockAdapter } from "@/ai/mockAdapter";
import { hasServerProxy } from "@/ai/apiBase";
import type { DrawMode, DrawnCard, TrainingRole } from "@/domain/types";

type StepType = "draw" | "manual";
interface NormalizedStep {
  text: string;
  type: StepType;
  drawCount: number;
}

const settingsStore = useSettingsStore();
const sessionStore = useSessionStore();
const router = useRouter();
const usesServerProxy = hasServerProxy();

const selectedExerciseId = ref(sessionStore.trainingDraft?.exerciseId ?? activeExercises[0]?.id ?? "");
const drawMode = ref<DrawMode>(sessionStore.trainingDraft?.drawMode ?? "app");
const cardsInPlay = ref<DrawnCard[]>(sessionStore.trainingDraft?.cardsInPlay ?? []);
const transcript = ref(sessionStore.trainingDraft?.transcript ?? []);
const hasStarted = ref(sessionStore.trainingDraft?.hasStarted ?? Boolean(cardsInPlay.value.length || transcript.value.length));
const stepIndex = ref(sessionStore.trainingDraft?.stepIndex ?? 0);
const setupOpen = ref(!hasStarted.value);
const exerciseInfoOpen = ref(false);

const userMessage = ref("");
const isLoading = ref(false);
const error = ref("");

const editor = reactive({
  open: false,
  cardId: "",
  reversed: false,
  index: -1
});

const selectedExercise = computed(() => getExerciseById(selectedExerciseId.value));
const exerciseRules = computed(
  () =>
    selectedExercise.value?.rules ?? {
      maxCardsInPlay: 3,
      allowAddNamedCard: true,
      allowEditCards: true,
      allowRemoveCards: true
    }
);
const normalizedSteps = computed<NormalizedStep[]>(() =>
  (() => {
    const exercise = selectedExercise.value;
    if (!exercise) {
      return [{ text: "Draw a card to begin.", type: "draw", drawCount: 1 }];
    }

    if (exercise.stepPlan?.length) {
      return exercise.stepPlan.map((step) => ({
        text: step.text,
        type: step.action,
        drawCount: step.drawCount
      }));
    }

    return exercise.flowSteps.map((text, index) => ({
      text,
      type: index === 0 ? "draw" : "manual",
      drawCount: index === 0 ? 1 : 0
    }));
  })()
);
const totalSteps = computed(() => Math.max(1, normalizedSteps.value.length));
const activeStepIndex = computed(() => Math.min(stepIndex.value, totalSteps.value - 1));
const activeStepText = computed(() => normalizedSteps.value[activeStepIndex.value]?.text ?? "Draw a card to begin.");
const activeStepType = computed<StepType>(() => normalizedSteps.value[activeStepIndex.value]?.type ?? "draw");
const role = computed<TrainingRole>(() => selectedExercise.value?.defaultRole ?? selectedExercise.value?.supportedRoles[0] ?? "coach");
const maxCardsInPlay = computed(() => exerciseRules.value.maxCardsInPlay);
const canDrawOverall = computed(() => cardsInPlay.value.length < maxCardsInPlay.value);
const canAddNamedCard = computed(() => exerciseRules.value.allowAddNamedCard && canDrawOverall.value);
const canModifyCards = computed(() => exerciseRules.value.allowEditCards || exerciseRules.value.allowRemoveCards);
const cardsRemainingOverall = computed(() => Math.max(0, maxCardsInPlay.value - cardsInPlay.value.length));
const deckUsagePercent = computed(() => {
  if (maxCardsInPlay.value <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((cardsInPlay.value.length / maxCardsInPlay.value) * 100));
});
const requiredCardsForStep = computed(() =>
  normalizedSteps.value
    .slice(0, activeStepIndex.value + 1)
    .reduce((sum, step) => sum + (step.type === "draw" ? step.drawCount : 0), 0)
);
const drawTargetForCurrentStep = computed(() => {
  if (activeStepType.value !== "draw") {
    return requiredCardsForStep.value;
  }

  return normalizedSteps.value
    .slice(0, activeStepIndex.value + 1)
    .reduce((sum, step) => sum + (step.type === "draw" ? step.drawCount : 0), 0);
});
const drawsRemainingThisStep = computed(() =>
  activeStepType.value === "draw" ? Math.max(0, drawTargetForCurrentStep.value - cardsInPlay.value.length) : 0
);
const hasRequiredCardsForStep = computed(() => cardsInPlay.value.length >= requiredCardsForStep.value);
const canDrawForStep = computed(
  () => activeStepType.value === "draw" && drawsRemainingThisStep.value > 0 && canDrawOverall.value
);
const canAdvanceStep = computed(
  () =>
    activeStepType.value === "manual" &&
    hasRequiredCardsForStep.value &&
    activeStepIndex.value < totalSteps.value - 1
);
const needsCatchUpDraw = computed(
  () => activeStepType.value === "manual" && !hasRequiredCardsForStep.value && canDrawOverall.value
);
const primaryActionMode = computed<"draw" | "next" | null>(() => {
  if (canDrawForStep.value || needsCatchUpDraw.value) {
    return "draw";
  }
  if (canAdvanceStep.value) {
    return "next";
  }
  return null;
});
const primaryActionLabel = computed(() => (primaryActionMode.value === "draw" ? "Draw Card" : "Next Step"));
const showAddNamedCardButton = computed(() => primaryActionMode.value === "draw" && canAddNamedCard.value);
const showBoardActions = computed(
  () => Boolean(primaryActionMode.value) || showAddNamedCardButton.value
);
const primaryActionFlipToken = ref(0);

watch(primaryActionLabel, () => {
  primaryActionFlipToken.value += 1;
});

const { containerRef: messagesRef, handleScroll: onMessagesScroll, scrollToBottom } = useAutoScroll(
  computed(() => transcript.value.length)
);

watch(
  [selectedExerciseId, drawMode, cardsInPlay, transcript, hasStarted, stepIndex],
  () => {
    if (!selectedExercise.value) {
      return;
    }

    const isDraftEmpty = !hasStarted.value && cardsInPlay.value.length === 0 && transcript.value.length === 0;
    if (isDraftEmpty) {
      sessionStore.clearTrainingDraft();
      return;
    }

    sessionStore.setTrainingDraft({
      exerciseId: selectedExerciseId.value,
      role: role.value,
      drawMode: drawMode.value,
      hasStarted: hasStarted.value,
      drawCount: cardsInPlay.value.length,
      stepIndex: activeStepIndex.value,
      cardsInPlay: cardsInPlay.value,
      transcript: transcript.value
    });
  },
  { deep: true }
);

watch(selectedExerciseId, () => {
  if (!hasStarted.value) {
    stepIndex.value = 0;
  }
});

function startTraining() {
  hasStarted.value = true;
  setupOpen.value = false;
  exerciseInfoOpen.value = false;
  cardsInPlay.value = [];
  transcript.value = [];
  userMessage.value = "";
  error.value = "";
  stepIndex.value = 0;
}

function closeSetup() {
  setupOpen.value = false;
  exerciseInfoOpen.value = false;
  if (!hasStarted.value) {
    sessionStore.clearTrainingDraft();
    router.push({ name: "home" });
  }
}

function advanceStep() {
  if (activeStepIndex.value >= totalSteps.value - 1) {
    return;
  }
  stepIndex.value = activeStepIndex.value + 1;
}

function handlePrimaryAction() {
  if (primaryActionMode.value === "draw") {
    drawCard();
    return;
  }
  if (primaryActionMode.value === "next") {
    advanceStep();
  }
}

function advanceAfterDraw() {
  if (activeStepType.value !== "draw" || !hasRequiredCardsForStep.value) {
    return;
  }
  if (activeStepIndex.value >= totalSteps.value - 1) {
    return;
  }
  stepIndex.value = activeStepIndex.value + 1;
}

function drawCard() {
  if (activeStepType.value !== "draw" && !needsCatchUpDraw.value) {
    error.value = "Use Next Step for this part of the exercise.";
    return;
  }

  if (!canDrawOverall.value) {
    error.value = `Card limit reached for this exercise (${maxCardsInPlay.value}).`;
    return;
  }

  try {
    drawMode.value = "app";
    const drawn = drawSingleCard({
      existingCardIds: cardsInPlay.value.map((card) => card.cardId),
      reversalMode: settingsStore.settings.reversalMode,
      seed: undefined,
      iteration: cardsInPlay.value.length
    });
    cardsInPlay.value = [...cardsInPlay.value, drawn];
    advanceAfterDraw();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unable to draw card.";
  }
}

function addNamedCard() {
  if (primaryActionMode.value !== "draw") {
    error.value = "Add named card is only available when drawing is required.";
    return;
  }

  if (!canAddNamedCard.value) {
    error.value = `Cannot add more cards for this exercise (max ${maxCardsInPlay.value}).`;
    return;
  }

  drawMode.value = "physical";
  const existing = new Set(cardsInPlay.value.map((card) => card.cardId));
  const firstAvailableCard = cards.find((card) => !existing.has(card.id));
  editor.open = true;
  editor.index = cardsInPlay.value.length;
  editor.cardId = firstAvailableCard?.id ?? "major-00-the-fool";
  editor.reversed = false;
}

function resetTrainingModule() {
  cardsInPlay.value = [];
  transcript.value = [];
  userMessage.value = "";
  error.value = "";
  stepIndex.value = 0;
  hasStarted.value = false;
  setupOpen.value = true;
  exerciseInfoOpen.value = false;
  sessionStore.resetTraining();
}

function onEditCard(index: number) {
  if (!exerciseRules.value.allowEditCards) {
    return;
  }

  const target = cardsInPlay.value[index];
  if (!target) {
    return;
  }
  editor.open = true;
  editor.index = index;
  editor.cardId = target.cardId;
  editor.reversed = target.reversed;
}

function removeCard(index: number) {
  if (!exerciseRules.value.allowRemoveCards) {
    return;
  }

  cardsInPlay.value = cardsInPlay.value.filter((_, cardIndex) => cardIndex !== index);
}

function closeEditor() {
  editor.open = false;
}

function applyCardEditFromDialog(cardId: string, reversed: boolean) {
  const duplicateIndex = cardsInPlay.value.findIndex(
    (card, index) => card.cardId === cardId && index !== editor.index
  );
  if (duplicateIndex !== -1) {
    error.value = "This card is already in play for this exercise.";
    return;
  }

  const isNewCard = editor.index >= cardsInPlay.value.length;

  if (isNewCard) {
    cardsInPlay.value = [...cardsInPlay.value, { cardId, reversed, faceUp: true }];
    advanceAfterDraw();
  } else {
    cardsInPlay.value = cardsInPlay.value.map((card, index) =>
      index === editor.index ? { ...card, cardId, reversed } : card
    );
  }

  closeEditor();
}

async function sendMessage() {
  if (!selectedExercise.value || !userMessage.value.trim()) {
    return;
  }

  isLoading.value = true;
  error.value = "";

  const canUseLiveAdapter = settingsStore.hasApiKey || usesServerProxy;
  const adapter = canUseLiveAdapter
    ? settingsStore.settings.qaUseMock
      ? new MockAdapter()
      : createLLMAdapter({
          provider: settingsStore.settings.provider,
          apiKey: settingsStore.settings.apiKeySession.trim(),
          model: settingsStore.settings.model
        })
    : new MockAdapter();

  const message = userMessage.value.trim();
  transcript.value = [...transcript.value, { speaker: "user", text: message }];
  await scrollToBottom(true);
  userMessage.value = "";

  try {
    const response = await adapter.runTrainingTurn({
      exercise: selectedExercise.value,
      role: role.value,
      drawMode: drawMode.value,
      cardsInPlay: cardsInPlay.value,
      userMessage: message,
      quality: settingsStore.settings.quality,
      progress: {
        drawCount: cardsInPlay.value.length,
        stepIndex: activeStepIndex.value,
        stepText: activeStepText.value,
        stepType: activeStepType.value,
        requiredAction: activeStepType.value === "draw" ? "draw" : "next_step",
        totalSteps: totalSteps.value,
        drawTargetForStep: drawTargetForCurrentStep.value,
        cardsRemainingOverall: cardsRemainingOverall.value
      }
    });

    const hintText = response.hints?.length ? `\nHints: ${response.hints.join(" | ")}` : "";
    await appendAssistantMessageIncremental(transcript, `${response.assistantMessage}${hintText}`, {
      onChunk: () => scrollToBottom(true)
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to get response.";
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.training-module {
  display: grid;
  gap: 0.65rem;
}

.module-topbar {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 0.65rem;
  align-items: stretch;
  height: clamp(680px, calc(100vh - 10rem), 900px);
}

.stage-card {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.55rem;
  min-height: 0;
  overflow: visible;
}

.stage-header h3 {
  margin: 0;
}

.board-shell {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 0.48rem;
  min-height: 0;
  overflow: visible;
  padding-right: 0.08rem;
  padding-bottom: 0.2rem;
}

.board-footer {
  display: grid;
  gap: 0.36rem;
}

.board-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.action-toggle {
  animation: flip-action 280ms ease;
  transform-origin: center;
}

.limit-note {
  margin: 0;
}

.transcript-column {
  position: relative;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto auto 1fr auto auto;
  gap: 0.55rem;
  overflow: visible;
}

.dialogue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.dialogue-header h3 {
  margin: 0;
}

.small-ghost {
  min-height: auto;
  padding: 0.24rem 0.52rem;
  font-size: 0.78rem;
}

.exercise-status {
  display: grid;
  gap: 0.8rem;
}

.exercise-status p {
  margin: 0;
}

.deck-usage {
  display: grid;
  gap: 0.2rem;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: 9px;
  padding: 0.22rem 0.34rem;
  background: color-mix(in srgb, var(--surface) 72%, transparent);
}

.deck-usage.full {
  border-color: color-mix(in srgb, var(--accent) 70%, var(--border));
}

.deck-usage-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
}

.deck-usage-label {
  color: var(--muted);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.deck-usage-count {
  font-weight: 700;
}

.deck-usage-meter {
  height: 0.3rem;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--border) 58%, transparent);
}

.deck-usage-meter span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
}

.step-tracker {
  margin: 0.05rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.22rem;
  max-height: 10.4rem;
  overflow: auto;
}

.step-tracker li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.35rem;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--border) 66%, transparent);
  border-radius: 9px;
  padding: 0.22rem 0.3rem;
  background: color-mix(in srgb, var(--surface) 64%, transparent);
  opacity: 0.58;
}

.step-tracker li.complete {
  opacity: 0.72;
  border-color: color-mix(in srgb, var(--accent-2) 44%, var(--border));
}

.step-tracker li.current {
  opacity: 1;
  border-color: color-mix(in srgb, var(--accent) 72%, var(--border));
  background: color-mix(in srgb, var(--accent) 18%, var(--surface));
}

.step-number {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
}

.step-text {
  font-size: 0.79rem;
  line-height: 1.18;
}

.messages {
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 0.4rem;
}

.message {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.5rem;
  background: color-mix(in srgb, var(--surface) 44%, transparent);
}

.message.user {
  border-color: color-mix(in srgb, var(--accent) 48%, var(--border));
}

.message.assistant {
  border-color: color-mix(in srgb, var(--accent-2) 48%, var(--border));
}

.message p {
  margin: 0.18rem 0 0;
  white-space: pre-wrap;
}

.dialogue-input {
  display: grid;
  gap: 0.3rem;
}

.dialogue-input textarea {
  width: 100%;
  min-height: 8rem;
  max-height: 15rem;
}

.dialogue-actions {
  display: flex;
  justify-content: flex-end;
}

.setup-modal {
  width: min(760px, calc(100vw - 1.5rem));
  display: grid;
  gap: 0.6rem;
}

.setup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.65rem;
}

.setup-modal label {
  display: grid;
  gap: 0.32rem;
}

.setup-modal select {
  width: min(560px, 100%);
}

.setup-actions {
  display: flex;
  justify-content: flex-end;
}

.exercise-notes-modal {
  width: min(760px, calc(100vw - 1.5rem));
  display: grid;
  gap: 0.55rem;
}

.notes-steps {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.24rem;
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: 1fr;
    height: auto;
  }

  .stage-card,
  .transcript-column {
    min-height: 0;
  }

  .transcript-column {
    grid-template-rows: auto auto auto minmax(230px, 1fr) auto auto;
  }

  .step-tracker {
    max-height: 9rem;
  }
}

@keyframes flip-action {
  from {
    transform: rotateX(88deg);
    opacity: 0.15;
  }
  to {
    transform: rotateX(0deg);
    opacity: 1;
  }
}
</style>
