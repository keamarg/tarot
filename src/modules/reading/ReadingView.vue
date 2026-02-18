<template>
  <section class="reading-module">
    <header class="module-topbar">
      <button type="button" class="icon-btn" aria-label="Reset reading module" @click="resetReadingModule">
        <RotateCcw :size="15" />
        <span>Start over</span>
      </button>
    </header>

    <section v-if="isStarted" class="workspace">
      <article class="card stage-card">
        <header class="stage-header">
          <h3>{{ activeSpread.name }}</h3>
        </header>

        <div class="board-shell">
          <template v-if="showQuestionStage">
            <section class="question-stage">
              <div class="question-stage-glow"></div>
              <div class="question-stage-content">
                <h4>{{ activeSpread.name }}</h4>
                <p class="question-stage-copy">
                  Take a breath and set one clear question before you begin.
                </p>
                <label class="question-stage-label" :class="{ empty: !ritualQuestion.trim() }">
                  <span class="visually-hidden">Question</span>
                  <textarea
                    ref="questionInputRef"
                    v-model="ritualQuestion"
                    rows="1"
                    aria-label="Question"
                    @keydown="onQuestionKeydown"
                  />
                </label>
                <div class="question-stage-actions">
                  <button type="button" @click="submitRitualQuestion({ skipped: false })">Continue</button>
                  <button type="button" @click="submitRitualQuestion({ skipped: true })">Skip question</button>
                </div>
              </div>
            </section>
          </template>

          <template v-else-if="showShuffleStage">
            <RitualShuffleDeck
              :deck-back-url="selectedDeckBackUrl"
              :reduced-motion="settingsStore.settings.reducedEffects"
              @complete="onShuffleComplete"
              @activate="onShuffleActivate"
            />
          </template>

          <template v-else-if="showFanPicker">
            <RitualFanPicker
              :candidate-count="fanCandidateCount"
              :pick-count="fanPickCount"
              :selected-indices="ritualPickOrder"
              :deck-back-url="selectedDeckBackUrl"
              :disabled="isReading"
              @update:selected-indices="updateRitualPickOrder"
              @complete="finalizeFanPick"
            />
          </template>

          <template v-else>
            <SpreadBoard
              :spread="activeSpread"
              :cards="activeCards"
              editable
              :show-header="false"
              :minimal-surface="true"
              :reveal-enabled="canRevealFromBoard"
              :revealable-index="mode === 'app_draw' ? revealedCount : -1"
              reveal-label="Turn Card"
              @edit-card="(index) => openEditor(mode, index)"
              @remove-card="(index) => removeCard(mode, index)"
              @add-card="(index) => openEditorForAdd(mode, index)"
              @reveal-card="revealCard"
            />
            <div v-if="showBoardLoading" class="board-loading">
              <div class="spinner" aria-hidden="true"></div>
              <img
                v-if="loadingCardImageUrl"
                class="board-loading-card"
                :src="loadingCardImageUrl"
                :alt="loadingCardAlt"
                :style="loadingCardStyle"
              />
              <p>{{ boardLoadingText }}</p>
            </div>
          </template>
        </div>

        <div class="board-actions">
          <button
            v-if="mode === 'upload'"
            class="primary"
            type="button"
            :disabled="uploadFullReadingDisabled"
            @click="openOrGenerateUploadFullReading(uploadNeedsUpdate)"
          >
            {{ isReading && pendingAction === 'upload-full' ? "Generating..." : uploadNeedsUpdate ? "Update Reading" : "Full Reading" }}
          </button>

          <button
            v-if="mode === 'app_draw' && canGenerateFullReading"
            class="primary"
            type="button"
            :disabled="isReading"
            @click="openOrGenerateAppFullReading(appNeedsUpdate)"
          >
            {{ isReading && pendingAction === 'full' ? "Generating..." : appNeedsUpdate ? "Update Reading" : "Full Reading" }}
          </button>
        </div>
      </article>

      <article class="card dialogue-card">
        <h3>{{ mode === "upload" ? "Upload Reading" : "How This Reading Works" }}</h3>

        <template v-if="mode === 'upload'">
          <section class="reading-status">
            <p class="small">Mode: Upload image</p>
            <p class="small">Detected spread: {{ uploadSpread.name }}</p>
            <p class="small" v-if="spreadConfidence !== null">
              Detection confidence: {{ Math.round(spreadConfidence * 100) }}%
            </p>
            <p class="small" v-if="isDetecting">Analyzing spread image...</p>
            <p class="small">
              Cards assigned: {{ uploadAssignedCount }} / {{ uploadSpread.slots.length }}
            </p>
          </section>

          <div v-if="uploadImageDataUrl" class="file-chip">
            <div>
              <p class="file-name">{{ uploadFileName || "Uploaded spread image" }}</p>
              <p class="small">Image ready for analysis</p>
            </div>
          </div>

          <div ref="uploadMessagesRef" class="messages" aria-live="polite" @scroll="onUploadMessagesScroll">
            <article
              v-for="(entry, index) in uploadDialogue"
              :key="`upload-${entry.speaker}-${index}`"
              class="message"
              :class="entry.speaker"
            >
              <strong>{{ entry.speaker === "user" ? "You" : "AI" }}</strong>
              <p>{{ entry.text }}</p>
            </article>
            <p v-if="uploadDialogue.length === 0" class="small">Analyze spread or ask a follow-up question.</p>
          </div>

          <div class="dialogue-input-wrap">
            <textarea
              v-model="uploadQuestion"
              rows="3"
              placeholder="Ask for clarification about the spread."
              aria-label="Follow up prompt"
            />
          </div>

          <div class="action-row">
            <button
              type="button"
              :disabled="!uploadQuestion.trim() || !hasUploadCards || isReading"
              :class="{ processing: pendingAction === 'upload-followup' && isReading }"
              @click="askUploadFollowUp"
            >
              <span v-if="pendingAction === 'upload-followup' && isReading" class="inline-spinner" aria-hidden="true"></span>
              {{ pendingAction === 'upload-followup' && isReading ? "Interpreting..." : "Ask Follow-up" }}
            </button>
          </div>
        </template>

        <template v-else>
          <section class="reading-guide">
            <p class="small">
              This reading mirrors a traditional tarot session, where each card position frames one layer of the situation.
            </p>
            <p class="small">
              Meanings unfold progressively: each position is read on its own, then blended into one coherent takeaway.
            </p>
            <p class="small">
              {{ spreadHowToRead }}
            </p>
          </section>

          <div ref="appMessagesRef" class="messages" aria-live="polite" @scroll="onAppMessagesScroll">
            <article
              v-for="(entry, index) in appDialogue"
              :key="`app-${entry.speaker}-${index}`"
              class="message"
              :class="entry.speaker"
            >
              <strong>{{ entry.speaker === "user" ? "You" : "AI" }}</strong>
              <p>{{ entry.text }}</p>
            </article>
            <p v-if="appDialogue.length === 0" class="small">Reveal a card to begin the dialogue.</p>
          </div>

          <div class="dialogue-input-wrap">
            <textarea
              v-model="appQuestion"
              rows="3"
              placeholder="Ask about the revealed cards."
              aria-label="Follow up prompt"
              @keydown="onAppQuestionKeydown"
            />
          </div>

          <div class="action-row">
            <button
              type="button"
              :disabled="!appQuestion.trim() || revealedCount === 0 || isReading"
              :class="{ processing: pendingAction === 'followup' && isReading }"
              @click="askAppFollowUp"
            >
              <span v-if="pendingAction === 'followup' && isReading" class="inline-spinner" aria-hidden="true"></span>
              {{ pendingAction === 'followup' && isReading ? "Interpreting..." : "Ask Follow-up" }}
            </button>
          </div>
        </template>

        <p v-if="error" class="error">{{ error }}</p>
      </article>
    </section>

    <CardEditorDialog
      :open="editor.open"
      :initial-card-id="editor.cardId"
      :initial-reversed="editor.reversed"
      :allow-reversed="editorAllowReversed"
      @close="closeEditor"
      @confirm="applyEditor"
    />

    <div
      v-if="setupOpen"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-setup-title"
      @click.self="closeSetup"
    >
      <article class="card setup-modal">
        <header class="setup-header">
          <h3 id="reading-setup-title">Reading Setup</h3>
          <button type="button" aria-label="Close setup" @click="closeSetup">Close</button>
        </header>

        <label>
          Spread type
          <select v-model="setupSpreadId">
            <option v-for="spread in spreads" :key="spread.id" :value="spread.id">
              {{ spread.name }}
            </option>
          </select>
        </label>

        <p class="small">
          Upload one image and the spread/cards will be detected automatically.
        </p>

        <div class="setup-actions">
          <button class="primary" type="button" @click="startReading">Start Reading</button>
          <button class="secondary" type="button" @click="openSetupUploadPicker">Upload Image</button>
          <input ref="setupUploadInputRef" class="visually-hidden" accept="image/*" type="file" @change="onSetupImageUpload" />
        </div>
      </article>
    </div>

    <div
      v-if="readingPopupOpen && popupReading"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="full-reading-title"
      @click.self="readingPopupOpen = false"
    >
      <article class="card full-reading-modal">
        <header class="setup-header">
          <h3 id="full-reading-title">{{ popupReading.title }}</h3>
          <button type="button" aria-label="Close full reading" @click="readingPopupOpen = false">Close</button>
        </header>

        <p class="small">{{ popupReading.spreadName }}</p>

        <div class="reading-items">
          <article
            v-for="item in popupReading.positionReadings"
            :key="`${item.slotLabel}-${item.cardName}`"
            class="reading-item"
          >
            <h4>{{ item.slotLabel }} - {{ item.cardName }}</h4>
            <p>{{ item.interpretation }}</p>
          </article>
        </div>

        <h4>Synthesis</h4>
        <p>{{ popupReading.synthesis }}</p>

        <div class="setup-actions">
          <button type="button" :disabled="!popupReading" @click="downloadCurrentPdf">Download PDF</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RotateCcw } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import SpreadBoard from "@/app/components/SpreadBoard.vue";
import CardEditorDialog from "@/app/components/CardEditorDialog.vue";
import RitualShuffleDeck from "@/modules/ritual/components/RitualShuffleDeck.vue";
import RitualFanPicker from "@/modules/ritual/components/RitualFanPicker.vue";
import { useAutoScroll } from "@/app/composables/useAutoScroll";
import { appendAssistantMessageIncremental } from "@/app/composables/useIncrementalDialogue";
import { createLLMAdapter } from "@/ai/factory";
import { MockAdapter } from "@/ai/mockAdapter";
import { hasServerProxy } from "@/ai/apiBase";
import { cardIdFromName } from "@/ai/cardNameMatch";
import { cards } from "@/domain/cards";
import { drawCards } from "@/domain/draw";
import { getSpreadById, spreads } from "@/domain/spreads";
import { useSettingsStore } from "@/modules/settings/settingsStore";
import { useSessionStore } from "@/app/sessionStore";
import { exportReadingPdf } from "@/modules/export/readingPdf";
import { resolveDeckBackImage, resolveDeckCardImage } from "@/modules/decks/deckResolver";
import {
  READING_LIFECYCLE_VERSION,
  createInitialRitualState,
  nextReadingPhase,
  supportsFanPicking
} from "@/modules/ritual/lifecycle";
import { emitAmbienceCue } from "@/modules/ambience/audio/ambienceBus";
import { speakWhisper, stopWhisper } from "@/modules/ambience/audio/useWhisperVoice";
import type { DialogueEntry, DrawnCard, ReadingLifecyclePhase, ReadingOutput, SpreadDefinition } from "@/domain/types";

const settingsStore = useSettingsStore();
const sessionStore = useSessionStore();
const router = useRouter();
const usesServerProxy = hasServerProxy();
const defaultSpreadId = spreads[0]?.id ?? "three-card";

const isStarted = ref(sessionStore.readingDraft?.started ?? false);
const setupOpen = ref(!isStarted.value);
const mode = ref<"upload" | "app_draw">(sessionStore.readingDraft?.source ?? "app_draw");
const setupSpreadId = ref(resolveSpreadId(sessionStore.readingDraft?.spreadId));
const setupUploadInputRef = ref<HTMLInputElement | null>(null);
const ritualState = ref(createInitialRitualState(sessionStore.readingDraft?.source ?? "app_draw"));
const lifecyclePhase = ref<ReadingLifecyclePhase>(
  sessionStore.readingDraft?.ritualPhase ??
    (sessionStore.readingDraft?.source === "upload"
      ? "followup"
      : sessionStore.readingDraft?.cards?.length
        ? "reveal"
        : "setup")
);
const ritualQuestion = ref(sessionStore.readingDraft?.questionText ?? "");
const ritualQuestionSkipped = ref(Boolean(sessionStore.readingDraft?.questionSkipped));
const ritualPickOrder = ref<number[]>(sessionStore.readingDraft?.pickOrder ?? []);
const ritualCandidateCards = ref<DrawnCard[]>([]);
const questionInputRef = ref<HTMLTextAreaElement | null>(null);
const questionWhispered = ref(false);

const uploadImageDataUrl = ref(
  sessionStore.readingDraft?.source === "upload" ? sessionStore.readingDraft.uploadedImageDataUrl ?? "" : ""
);
const uploadFileName = ref(
  sessionStore.readingDraft?.source === "upload" ? sessionStore.readingDraft.uploadedFileName ?? "" : ""
);
const uploadMimeType = ref("image/png");
const uploadSpreadId = ref(
  sessionStore.readingDraft?.source === "upload" ? resolveSpreadId(sessionStore.readingDraft.spreadId) : defaultSpreadId
);
const uploadCards = ref<Array<DrawnCard | undefined>>(
  sessionStore.readingDraft?.source === "upload" ? sessionStore.readingDraft.cards : []
);
const uploadReading = ref<ReadingOutput | undefined>(
  sessionStore.readingDraft?.source === "upload" ? sessionStore.readingDraft.lastOutput : undefined
);
const uploadNeedsUpdate = ref(false);
const uploadDialogue = ref<DialogueEntry[]>(
  sessionStore.readingDraft?.source === "upload" ? sessionStore.readingDraft.dialogue ?? [] : []
);
const uploadQuestion = ref("");
const spreadConfidence = ref<number | null>(null);
const pendingUploadDetection = ref(false);

const appSpreadId = ref(
  sessionStore.readingDraft?.source === "app_draw" ? resolveSpreadId(sessionStore.readingDraft.spreadId) : defaultSpreadId
);
const appCards = ref<Array<DrawnCard | undefined>>(
  sessionStore.readingDraft?.source === "app_draw" ? sessionStore.readingDraft.cards : []
);
const appReading = ref<ReadingOutput | undefined>(
  sessionStore.readingDraft?.source === "app_draw" ? sessionStore.readingDraft.lastOutput : undefined
);
const appNeedsUpdate = ref(false);
const appDialogue = ref<DialogueEntry[]>(
  sessionStore.readingDraft?.source === "app_draw" ? sessionStore.readingDraft.dialogue ?? [] : []
);
const appQuestion = ref("");
const revealedCount = ref(
  sessionStore.readingDraft?.source === "app_draw"
    ? sessionStore.readingDraft.revealedCount ?? countRevealedCards(sessionStore.readingDraft.cards)
    : 0
);

const isDetecting = ref(false);
const isReading = ref(false);
const pendingAction = ref<"next" | "full" | "followup" | "upload-full" | "upload-followup" | "none">("none");
const error = ref("");
const readingPopupOpen = ref(false);
const loadingCardPreview = ref<DrawnCard | undefined>(undefined);

const editor = reactive({
  open: false,
  source: "upload" as "upload" | "app_draw",
  index: -1,
  cardId: "major-00-the-fool",
  reversed: false
});
const editorAllowReversed = computed(() => {
  if (!editor.open || editor.index < 0) {
    return true;
  }
  const spread = editor.source === "upload" ? uploadSpread.value : appSpread.value;
  return !shouldForceUpright(spread, editor.index);
});

const uploadSpread = computed<SpreadDefinition>(() => getSpreadById(uploadSpreadId.value));
const appSpread = computed<SpreadDefinition>(() => getSpreadById(appSpreadId.value));
const activeSpread = computed(() => (mode.value === "upload" ? uploadSpread.value : appSpread.value));
const activeCards = computed(() => (mode.value === "upload" ? uploadCards.value : appCards.value));
const popupReading = computed(() => (mode.value === "upload" ? uploadReading.value : appReading.value));
const hasUploadCards = computed(() => uploadCards.value.some((card) => Boolean(card)));
const uploadAssignedCount = computed(() => uploadCards.value.filter((card) => Boolean(card)).length);
const canRevealNext = computed(
  () =>
    mode.value === "app_draw" &&
    (lifecyclePhase.value === "reveal" || lifecyclePhase.value === "followup") &&
    revealedCount.value < appSpread.value.slots.length
);
const spreadHowToRead = computed(() => {
  const bySpread: Record<string, string> = {
    "one-card-daily": "One-card spreads focus the session on one clear theme and one practical direction.",
    "three-card": "Three-card spreads map movement across Past, Present, and Future before synthesizing direction.",
    "past-present-future": "Past-Present-Future readings track what shaped the moment, what is active now, and what is emerging.",
    "horseshoe": "Horseshoe spreads describe influences, challenges, and likely outcomes across a broader arc.",
    "celtic-cross": "Celtic Cross readings provide a layered portrait of situation, influences, tensions, and trajectory."
  };
  return bySpread[appSpread.value.id] ?? "Spread positions are interpreted individually, then combined into one cohesive reading.";
});
const canGenerateFullReading = computed(
  () => mode.value === "app_draw" && revealedCount.value === appSpread.value.slots.length && appCards.value.every(Boolean)
);
const uploadFullReadingDisabled = computed(
  () => isReading.value || (!uploadReading.value && !hasUploadCards.value)
);
const showBoardLoading = computed(
  () =>
    isReading.value &&
    (pendingAction.value === "next" || pendingAction.value === "full" || pendingAction.value === "upload-full")
);
const boardLoadingText = computed(() => {
  if (pendingAction.value === "next") {
    return "Interpreting this card...";
  }
  if (pendingAction.value === "full") {
    return "Generating full spread reading...";
  }
  if (pendingAction.value === "upload-full") {
    return "Generating full reading...";
  }
  return "Working...";
});
const loadingCardImageUrl = computed(() => {
  if (pendingAction.value !== "next" || !loadingCardPreview.value) {
    return "";
  }
  return resolveDeckCardImage(settingsStore.settings.deckId, loadingCardPreview.value.cardId);
});
const loadingCardAlt = computed(() => {
  if (!loadingCardPreview.value) {
    return "";
  }
  const card = cardFromId(loadingCardPreview.value.cardId);
  return card.name;
});
const loadingCardStyle = computed(() => ({
  transform: loadingCardPreview.value?.reversed ? "rotate(180deg)" : "none"
}));
const selectedDeckBackUrl = computed(() => resolveDeckBackImage(settingsStore.settings.deckId));
const showQuestionStage = computed(
  () => lifecyclePhase.value === "question"
);
const showShuffleStage = computed(
  () => mode.value === "app_draw" && lifecyclePhase.value === "shuffle"
);
const showFanPicker = computed(
  () => mode.value === "app_draw" && lifecyclePhase.value === "pick"
);
const canRevealFromBoard = computed(
  () =>
    mode.value === "upload" ||
    (mode.value === "app_draw" &&
      (lifecyclePhase.value === "reveal" || lifecyclePhase.value === "followup" || lifecyclePhase.value === "full") &&
      !isReading.value)
);
const fanPickCount = computed(() => {
  if (appSpread.value.id === "one-card-daily") {
    return 1;
  }
  if (appSpread.value.id === "three-card") {
    return 3;
  }
  return 0;
});
const fanCandidateCount = computed(() => cards.length);

const { containerRef: uploadMessagesRef, handleScroll: onUploadMessagesScroll, scrollToBottom: scrollUploadToBottom } = useAutoScroll(
  computed(() => uploadDialogue.value.length)
);
const { containerRef: appMessagesRef, handleScroll: onAppMessagesScroll, scrollToBottom: scrollAppToBottom } = useAutoScroll(
  computed(() => appDialogue.value.length)
);

watch(
  showQuestionStage,
  (visible) => {
    if (!visible) {
      return;
    }
    void nextTick(() => {
      questionInputRef.value?.focus();
    });
  },
  { immediate: true }
);

watch(
  [showQuestionStage, mode, () => settingsStore.settings.voiceEnabled, () => settingsStore.settings.voiceVolume],
  ([questionVisible, currentMode, voiceEnabled, voiceVolume]) => {
    if (!questionVisible || currentMode !== "app_draw" || !voiceEnabled || questionWhispered.value) {
      return;
    }
    questionWhispered.value = true;
    speakWhisper({
      text: "ask your question",
      enabled: true,
      volume: Math.max(0.14, Math.min(0.34, voiceVolume * 0.75))
    });
  },
  { immediate: true }
);

watch(uploadSpreadId, () => {
  uploadCards.value = normalizeCards(uploadSpread.value, uploadCards.value);
});

watch(appSpreadId, () => {
  appCards.value = normalizeCards(appSpread.value, appCards.value);
  revealedCount.value = Math.min(revealedCount.value, appSpread.value.slots.length);
});

watch(readingPopupOpen, (open) => {
  emitAmbienceCue(open ? "modal-open" : "modal-close");
});

onBeforeUnmount(() => {
  stopWhisper();
});

watch(
  [
    mode,
    isStarted,
    uploadSpreadId,
    uploadCards,
    uploadReading,
    uploadImageDataUrl,
    uploadFileName,
    uploadDialogue,
    appSpreadId,
    appCards,
    appReading,
    appDialogue,
    revealedCount,
    lifecyclePhase,
    ritualQuestion,
    ritualQuestionSkipped,
    ritualPickOrder,
    () => settingsStore.settings.deckId
  ],
  () => {
    if (!isStarted.value) {
      sessionStore.clearReadingDraft();
      return;
    }

    if (mode.value === "upload") {
      sessionStore.setReadingDraft({
        source: "upload",
        started: true,
        spreadId: uploadSpreadId.value,
        cards: uploadCards.value,
        lastOutput: uploadReading.value,
        uploadedImageDataUrl: uploadImageDataUrl.value,
        uploadedFileName: uploadFileName.value,
        revealedCount: uploadCards.value.filter((card) => Boolean(card)).length,
        dialogue: uploadDialogue.value,
        ritualPhase: lifecyclePhase.value,
        questionText: ritualQuestion.value,
        questionSkipped: ritualQuestionSkipped.value,
        pickOrder: ritualPickOrder.value,
        selectedDeckId: settingsStore.settings.deckId,
        lifecycleVersion: READING_LIFECYCLE_VERSION
      });
      return;
    }

    sessionStore.setReadingDraft({
      source: "app_draw",
      started: true,
      spreadId: appSpreadId.value,
      cards: appCards.value,
      lastOutput: appReading.value,
      revealedCount: revealedCount.value,
      nextRevealIndex: revealedCount.value,
      dialogue: appDialogue.value,
      ritualPhase: lifecyclePhase.value,
      questionText: ritualQuestion.value,
      questionSkipped: ritualQuestionSkipped.value,
      pickOrder: ritualPickOrder.value,
      selectedDeckId: settingsStore.settings.deckId,
      lifecycleVersion: READING_LIFECYCLE_VERSION
    });
  },
  { deep: true }
);

function countRevealedCards(cardsInDraft: Array<DrawnCard | undefined> = []): number {
  return cardsInDraft.filter((card) => card?.faceUp).length;
}

function resolveSpreadId(spreadId?: string): string {
  if (spreadId && spreads.some((spread) => spread.id === spreadId)) {
    return spreadId;
  }
  return defaultSpreadId;
}

function normalizeCards(spread: SpreadDefinition, nextCards: Array<DrawnCard | undefined>): Array<DrawnCard | undefined> {
  return spread.slots.map((_, index) => {
    const card = nextCards[index];
    if (!card) {
      return undefined;
    }
    return {
      ...card,
      reversed: shouldForceUpright(spread, index) ? false : card.reversed
    };
  });
}

function syncAppRevealState(nextCards: Array<DrawnCard | undefined>): Array<DrawnCard | undefined> {
  let contiguousRevealed = 0;
  for (let index = 0; index < nextCards.length; index += 1) {
    if (nextCards[index]?.faceUp) {
      contiguousRevealed += 1;
    } else {
      break;
    }
  }

  revealedCount.value = contiguousRevealed;
  return nextCards.map((card, index) => {
    if (!card) {
      return undefined;
    }
    return {
      ...card,
      faceUp: index < contiguousRevealed
    };
  });
}

function getAdapter() {
  if (settingsStore.settings.qaUseMock) {
    return new MockAdapter();
  }
  if (settingsStore.hasApiKey || usesServerProxy) {
    return createLLMAdapter({
      provider: settingsStore.settings.provider,
      apiKey: settingsStore.settings.apiKeySession.trim(),
      model: settingsStore.settings.model
    });
  }
  return new MockAdapter();
}

function cardFromId(cardId: string) {
  return cards.find((card) => card.id === cardId) ?? cards[0];
}

function shouldForceUpright(spread: SpreadDefinition, slotIndex: number): boolean {
  const slot = spread.slots[slotIndex];
  return spread.id === "celtic-cross" && slot?.id === "challenge";
}

function buildReadingInputFromIndices(
  spread: SpreadDefinition,
  sourceCards: Array<DrawnCard | undefined>,
  indices: number[],
  options: {
    userIntent?: string;
    mode: "upload" | "app_draw";
    phase: "turn" | "followup" | "full";
    revealedCount: number;
    currentSlotId?: string;
  }
) {
  const uniqueIndices = Array.from(new Set(indices)).filter((index) => index >= 0 && index < spread.slots.length);
  const slots = uniqueIndices.map((index) => spread.slots[index]).filter(Boolean);
  const entries = uniqueIndices.reduce<
    Array<{ slot: SpreadDefinition["slots"][number]; card: ReturnType<typeof cardFromId>; reversed: boolean }>
  >((accumulator, index) => {
    const draw = sourceCards[index];
    if (!draw) {
      return accumulator;
    }
    accumulator.push({
      slot: spread.slots[index],
      card: cardFromId(draw.cardId),
      reversed: draw.reversed
    });
    return accumulator;
  }, []);

  if (!slots.length || !entries.length) {
    return undefined;
  }

  const subsetSpread: SpreadDefinition = {
    ...spread,
    id: `${spread.id}-subset-${slots.map((slot) => slot.id).join("-")}`,
    name: spread.name,
    slots
  };

  return {
    spread: subsetSpread,
    cards: entries,
    userIntent: options.userIntent ?? "",
    quality: settingsStore.settings.quality,
    context: {
      mode: options.mode,
      phase: options.phase,
      revealedCount: options.revealedCount,
      totalSlots: spread.slots.length,
      currentSlotId: options.currentSlotId,
      questionText: ritualQuestion.value.trim(),
      deckId: settingsStore.settings.deckId,
      ritualPhase: lifecyclePhase.value,
      isUploadMode: options.mode === "upload"
    }
  };
}

function initializeAppDrawDeck() {
  const nextCards = drawCards({
    count: appSpread.value.slots.length,
    reversalMode: settingsStore.settings.reversalMode,
    seed: undefined
  }).map((card, index) => ({
    ...card,
    reversed: shouldForceUpright(appSpread.value, index) ? false : card.reversed,
    faceUp: false
  }));

  appCards.value = normalizeCards(appSpread.value, nextCards);
  revealedCount.value = 0;
  appReading.value = undefined;
  appDialogue.value = [];
  appQuestion.value = "";
}

function prepareFanCandidates() {
  if (!supportsFanPicking(appSpread.value.id) || fanPickCount.value <= 0) {
    ritualCandidateCards.value = [];
    ritualPickOrder.value = [];
    return;
  }

  ritualCandidateCards.value = drawCards({
    count: Math.min(cards.length, fanCandidateCount.value),
    reversalMode: settingsStore.settings.reversalMode,
    seed: undefined
  }).map((card) => ({
    ...card,
    faceUp: false
  }));
  ritualPickOrder.value = [];
}

function onShuffleComplete() {
  ritualState.value.shuffleCompleted = true;
  emitAmbienceCue("shuffle-end");
}

function onShuffleActivate() {
  ritualState.value.deckActivated = true;
  emitAmbienceCue("deck-activate");

  if (supportsFanPicking(appSpread.value.id) && fanPickCount.value > 0) {
    prepareFanCandidates();
    lifecyclePhase.value = "pick";
    return;
  }

  initializeAppDrawDeck();
  lifecyclePhase.value = "reveal";
}

function updateRitualPickOrder(indices: number[]) {
  ritualPickOrder.value = indices;
  if (indices.length > 0) {
    emitAmbienceCue("card-pick");
  }
}

function finalizeFanPick(indices: number[]) {
  if (!indices.length || fanPickCount.value <= 0) {
    return;
  }

  const selected = indices
    .slice(0, fanPickCount.value)
    .map((index) => ritualCandidateCards.value[index])
    .filter(Boolean)
    .map((card, index) => ({
      ...card,
      reversed: shouldForceUpright(appSpread.value, index) ? false : card.reversed,
      faceUp: false
    }));

  if (selected.length !== fanPickCount.value) {
    return;
  }

  appCards.value = normalizeCards(appSpread.value, selected);
  revealedCount.value = 0;
  appReading.value = undefined;
  appNeedsUpdate.value = false;
  appDialogue.value = [];
  appQuestion.value = "";
  lifecyclePhase.value = "reveal";
  emitAmbienceCue("card-pick");
}

function submitRitualQuestion(payload: { skipped: boolean }) {
  ritualQuestionSkipped.value = payload.skipped;
  ritualQuestion.value = payload.skipped ? "" : ritualQuestion.value.trim();
  ritualState.value.questionText = ritualQuestion.value;
  ritualState.value.questionSkipped = payload.skipped;

  const nextPhase = nextReadingPhase(lifecyclePhase.value, {
    mode: mode.value,
    spreadId: mode.value === "upload" ? uploadSpreadId.value : appSpreadId.value
  });
  lifecyclePhase.value = nextPhase;

  if (mode.value === "upload") {
    pendingUploadDetection.value = true;
    maybeRunPendingUploadDetection();
    return;
  }

  if (nextPhase === "shuffle") {
    emitAmbienceCue("shuffle-start");
  }
}

function onQuestionKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) {
    return;
  }
  event.preventDefault();
  if (!ritualQuestion.value.trim()) {
    return;
  }
  submitRitualQuestion({ skipped: false });
}

function onAppQuestionKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) {
    return;
  }
  event.preventDefault();
  if (!appQuestion.value.trim() || revealedCount.value === 0 || isReading.value) {
    return;
  }
  void askAppFollowUp();
}

function startReading() {
  mode.value = "app_draw";
  appSpreadId.value = setupSpreadId.value;
  ritualState.value = createInitialRitualState("app_draw");
  lifecyclePhase.value = "question";
  ritualQuestion.value = "";
  ritualQuestionSkipped.value = false;
  questionWhispered.value = false;
  ritualPickOrder.value = [];
  ritualCandidateCards.value = [];
  appCards.value = [];
  revealedCount.value = 0;
  appReading.value = undefined;
  appNeedsUpdate.value = false;
  appDialogue.value = [];
  appQuestion.value = "";
  error.value = "";
  readingPopupOpen.value = false;

  isStarted.value = true;
  setupOpen.value = false;
}

function closeSetup() {
  setupOpen.value = false;
  if (!isStarted.value) {
    sessionStore.clearReadingDraft();
    router.push({ name: "home" });
  }
}

function openSetupUploadPicker() {
  error.value = "";
  setupUploadInputRef.value?.click();
}

function onSetupImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  setupSpreadId.value = setupSpreadId.value || defaultSpreadId;
  uploadSpreadId.value = setupSpreadId.value;
  mode.value = "upload";
  ritualState.value = createInitialRitualState("upload");
  lifecyclePhase.value = "question";
  ritualQuestion.value = "";
  ritualQuestionSkipped.value = false;
  questionWhispered.value = false;
  ritualPickOrder.value = [];
  isStarted.value = true;
  setupOpen.value = false;
  uploadCards.value = normalizeCards(uploadSpread.value, []);
  uploadDialogue.value = [];
  uploadQuestion.value = "";
  readingPopupOpen.value = false;
  pendingUploadDetection.value = true;

  applyUploadFile(file, false);
  target.value = "";
}

function resetReadingModule() {
  const activeMode = mode.value;
  isStarted.value = false;
  setupOpen.value = true;
  mode.value = activeMode;
  setupSpreadId.value = defaultSpreadId;

  uploadImageDataUrl.value = "";
  uploadFileName.value = "";
  uploadMimeType.value = "image/png";
  uploadSpreadId.value = defaultSpreadId;
  uploadCards.value = [];
  uploadReading.value = undefined;
  uploadNeedsUpdate.value = false;
  uploadDialogue.value = [];
  uploadQuestion.value = "";
  spreadConfidence.value = null;
  pendingUploadDetection.value = false;

  appSpreadId.value = defaultSpreadId;
  appCards.value = [];
  appReading.value = undefined;
  appNeedsUpdate.value = false;
  appDialogue.value = [];
  appQuestion.value = "";
  revealedCount.value = 0;
  ritualState.value = createInitialRitualState(activeMode);
  lifecyclePhase.value = "setup";
  ritualQuestion.value = "";
  ritualQuestionSkipped.value = false;
  questionWhispered.value = false;
  ritualPickOrder.value = [];
  ritualCandidateCards.value = [];

  error.value = "";
  readingPopupOpen.value = false;
  loadingCardPreview.value = undefined;
  sessionStore.resetReading();
}

function applyUploadFile(file: File, detectImmediately = true) {
  uploadMimeType.value = file.type || "image/png";
  uploadFileName.value = file.name;

  const reader = new FileReader();
  reader.onload = () => {
    uploadImageDataUrl.value = String(reader.result ?? "");
    uploadReading.value = undefined;
    uploadNeedsUpdate.value = false;
    spreadConfidence.value = null;
    error.value = "";
    if (detectImmediately) {
      void detectSpread();
      return;
    }
    maybeRunPendingUploadDetection();
  };
  reader.readAsDataURL(file);
}

function maybeRunPendingUploadDetection() {
  if (!pendingUploadDetection.value || !uploadImageDataUrl.value || isDetecting.value) {
    return;
  }
  pendingUploadDetection.value = false;
  void detectSpread();
}

async function detectSpread() {
  if (!uploadImageDataUrl.value) {
    return;
  }

  isDetecting.value = true;
  error.value = "";

  try {
    const base64 = uploadImageDataUrl.value.split(",")[1];
    const adapter = getAdapter();
    const detection = await adapter.detectSpreadFromImage({
      imageBase64: base64,
      mimeType: uploadMimeType.value,
      quality: settingsStore.settings.quality
    });

    if (detection.guessedSpreadId && spreads.some((spread) => spread.id === detection.guessedSpreadId)) {
      uploadSpreadId.value = detection.guessedSpreadId;
      setupSpreadId.value = detection.guessedSpreadId;
    }

    spreadConfidence.value = detection.spreadConfidence ?? null;

    const nextCards = normalizeCards(uploadSpread.value, []);
    const slotIndexById = new Map(uploadSpread.value.slots.map((slot, index) => [slot.id, index]));
    let fallbackIndex = 0;

    for (const detected of detection.cards) {
      const resolvedCardId = resolveDetectedCardId(detected.cardId, detected.cardName);
      if (!resolvedCardId) {
        continue;
      }

      let targetIndex: number | undefined;
      if (detected.slotId && slotIndexById.has(detected.slotId)) {
        targetIndex = slotIndexById.get(detected.slotId);
      } else {
        while (fallbackIndex < nextCards.length && nextCards[fallbackIndex]) {
          fallbackIndex += 1;
        }
        if (fallbackIndex < nextCards.length) {
          targetIndex = fallbackIndex;
          fallbackIndex += 1;
        }
      }

      if (targetIndex === undefined || targetIndex < 0 || targetIndex >= nextCards.length) {
        continue;
      }

      nextCards[targetIndex] = {
        cardId: resolvedCardId,
        reversed: shouldForceUpright(uploadSpread.value, targetIndex) ? false : Boolean(detected.reversed),
        faceUp: true
      };
    }

    uploadCards.value = nextCards;
    uploadReading.value = undefined;
    uploadNeedsUpdate.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to analyze spread.";
  } finally {
    isDetecting.value = false;
  }
}

function resolveDetectedCardId(detectedCardId?: string, detectedCardName?: string): string | undefined {
  const normalizedDirect = cards.find((card) => card.id === detectedCardId)?.id;
  if (normalizedDirect) {
    return normalizedDirect;
  }

  const normalizedFromId = cardIdFromName(detectedCardId);
  if (normalizedFromId) {
    return normalizedFromId;
  }

  return cardIdFromName(detectedCardName);
}

function openEditor(source: "upload" | "app_draw", index: number) {
  const targetCards = source === "upload" ? uploadCards.value : appCards.value;
  const card = targetCards[index];
  if (!card) {
    return;
  }
  editor.open = true;
  editor.source = source;
  editor.index = index;
  editor.cardId = card.cardId;
  editor.reversed = card.reversed;
}

function openEditorForAdd(source: "upload" | "app_draw", index: number) {
  const existing = new Set(
    (source === "upload" ? uploadCards.value : appCards.value)
      .map((card) => card?.cardId)
      .filter((cardId): cardId is string => Boolean(cardId))
  );
  const firstAvailableCard = cards.find((card) => !existing.has(card.id));
  editor.open = true;
  editor.source = source;
  editor.index = index;
  editor.cardId = firstAvailableCard?.id ?? cards[0]?.id ?? "major-00-the-fool";
  editor.reversed = false;
}

function closeEditor() {
  editor.open = false;
}

async function applyEditor(cardId: string, reversed: boolean) {
  const targetCards = editor.source === "upload" ? uploadCards.value : appCards.value;
  const spread = editor.source === "upload" ? uploadSpread.value : appSpread.value;
  const next = normalizeCards(spread, targetCards);
  const hasDuplicate = next.some((entry, index) => index !== editor.index && entry?.cardId === cardId);
  if (hasDuplicate) {
    error.value = "This card is already used in the current spread.";
    return;
  }

  next[editor.index] = {
    cardId,
    reversed: shouldForceUpright(spread, editor.index) ? false : reversed,
    faceUp: editor.source === "app_draw" ? editor.index < revealedCount.value : true
  };

  if (editor.source === "upload") {
    if (uploadReading.value) {
      uploadNeedsUpdate.value = true;
    }
    uploadCards.value = next;
  } else {
    if (appReading.value) {
      appNeedsUpdate.value = true;
    }
    appCards.value = syncAppRevealState(next);
  }

  const source = editor.source;
  const index = editor.index;
  const shouldInterpretUpdatedCard = source === "upload" || index < revealedCount.value;
  closeEditor();
  if (shouldInterpretUpdatedCard) {
    await interpretUpdatedCard(source, index);
  }
}

async function interpretUpdatedCard(source: "upload" | "app_draw", index: number) {
  const spread = source === "upload" ? uploadSpread.value : appSpread.value;
  const sourceCards = source === "upload" ? uploadCards.value : appCards.value;
  const revealed = source === "upload"
    ? sourceCards.filter((card) => Boolean(card)).length
    : revealedCount.value;

  const input = buildReadingInputFromIndices(spread, sourceCards, [index], {
    mode: source,
    phase: source === "upload" ? "followup" : "turn",
    revealedCount: revealed,
    currentSlotId: spread.slots[index]?.id
  });
  if (!input) {
    return;
  }

  isReading.value = true;
  pendingAction.value = source === "upload" ? "upload-followup" : "followup";
  error.value = "";

  try {
    const adapter = getAdapter();
    const reading = await adapter.runReading(input);
    const slotReading = reading.positionReadings[0];
    const message = slotReading
      ? `Updated ${slotReading.slotLabel}: ${slotReading.interpretation}`
      : reading.synthesis;

    if (source === "upload") {
      await appendAssistantMessageIncremental(uploadDialogue, message, {
        onChunk: () => scrollUploadToBottom(true)
      });
      return;
    }

    await appendAssistantMessageIncremental(appDialogue, message, {
      onChunk: () => scrollAppToBottom(true)
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to interpret updated card.";
  } finally {
    isReading.value = false;
    pendingAction.value = "none";
  }
}

function removeCard(source: "upload" | "app_draw", index: number) {
  const targetCards = source === "upload" ? uploadCards.value : appCards.value;
  const next = [...targetCards];
  next[index] = undefined;

  if (source === "upload") {
    if (uploadReading.value) {
      uploadNeedsUpdate.value = true;
      uploadDialogue.value = [...uploadDialogue.value, { speaker: "assistant", text: "Card removed. Press Update Reading to refresh interpretation." }];
    }
    uploadCards.value = normalizeCards(uploadSpread.value, next);
  } else {
    if (appReading.value) {
      appNeedsUpdate.value = true;
      appDialogue.value = [...appDialogue.value, { speaker: "assistant", text: "Card removed. Press Update Reading to refresh interpretation." }];
    }
    appCards.value = syncAppRevealState(normalizeCards(appSpread.value, next));
  }
}

async function openOrGenerateUploadFullReading(forceRefresh = false) {
  if (uploadReading.value && !forceRefresh) {
    readingPopupOpen.value = true;
    return;
  }

  const input = buildReadingInputFromIndices(
    uploadSpread.value,
    uploadCards.value,
    uploadSpread.value.slots.map((_, index) => index),
    {
      mode: "upload",
      phase: "full",
      revealedCount: uploadCards.value.filter((card) => Boolean(card)).length
    }
  );

  if (!input) {
    error.value = "Add at least one card before generating a reading.";
    return;
  }

  isReading.value = true;
  pendingAction.value = "upload-full";
  error.value = "";
  lifecyclePhase.value = "full";

  try {
    const adapter = getAdapter();
    const reading = await adapter.runReading(input);
    uploadReading.value = reading;
    uploadNeedsUpdate.value = false;
    await appendAssistantMessageIncremental(uploadDialogue, reading.synthesis, {
      onChunk: () => scrollUploadToBottom(true)
    });
    readingPopupOpen.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to generate reading.";
  } finally {
    isReading.value = false;
    pendingAction.value = "none";
  }
}

async function askUploadFollowUp() {
  const question = uploadQuestion.value.trim();
  if (!question) {
    return;
  }

  const input = buildReadingInputFromIndices(
    uploadSpread.value,
    uploadCards.value,
    uploadSpread.value.slots.map((_, index) => index),
    {
      userIntent: question,
      mode: "upload",
      phase: "followup",
      revealedCount: uploadCards.value.filter((card) => Boolean(card)).length
    }
  );

  if (!input) {
    return;
  }

  uploadDialogue.value = [...uploadDialogue.value, { speaker: "user", text: question }];
  await scrollUploadToBottom(true);
  uploadQuestion.value = "";
  isReading.value = true;
  pendingAction.value = "upload-followup";
  lifecyclePhase.value = "followup";

  try {
    const adapter = getAdapter();
    const reading = await adapter.runReading(input);
    uploadReading.value = reading;
    uploadNeedsUpdate.value = false;
    await appendAssistantMessageIncremental(uploadDialogue, reading.synthesis, {
      onChunk: () => scrollUploadToBottom(true)
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to process follow-up.";
  } finally {
    isReading.value = false;
    pendingAction.value = "none";
  }
}

async function revealCard(index: number) {
  if (!canRevealNext.value || index !== revealedCount.value) {
    return;
  }

  const card = appCards.value[index];
  if (!card) {
    error.value = "Card slot is empty. Use the add-card action first.";
    return;
  }
  emitAmbienceCue("card-reveal");
  loadingCardPreview.value = card;

  appCards.value = appCards.value.map((entry, cardIndex) => {
    if (!entry) {
      return undefined;
    }
    if (cardIndex === index) {
      return { ...entry, faceUp: true };
    }
    return entry;
  });

  revealedCount.value += 1;
  isReading.value = true;
  pendingAction.value = "next";

  try {
    const input = buildReadingInputFromIndices(appSpread.value, appCards.value, [index], {
      mode: "app_draw",
      phase: "turn",
      revealedCount: revealedCount.value,
      currentSlotId: appSpread.value.slots[index]?.id
    });
    if (!input) {
      return;
    }

    const adapter = getAdapter();
    const reading = await adapter.runReading(input);
    const slotReading = reading.positionReadings[0];
    const message = slotReading
      ? `${slotReading.slotLabel}: ${slotReading.interpretation}`
      : reading.synthesis;
    await appendAssistantMessageIncremental(appDialogue, message, {
      onChunk: () => scrollAppToBottom(true)
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to read next card.";
  } finally {
    isReading.value = false;
    pendingAction.value = "none";
    loadingCardPreview.value = undefined;
  }
}

async function askAppFollowUp() {
  const question = appQuestion.value.trim();
  if (!question || revealedCount.value === 0) {
    return;
  }

  const indices = appSpread.value.slots.map((_, index) => index).filter((index) => index < revealedCount.value);
  const input = buildReadingInputFromIndices(appSpread.value, appCards.value, indices, {
    userIntent: question,
    mode: "app_draw",
    phase: "followup",
    revealedCount: revealedCount.value
  });
  if (!input) {
    return;
  }

  appDialogue.value = [...appDialogue.value, { speaker: "user", text: question }];
  await scrollAppToBottom(true);
  appQuestion.value = "";
  isReading.value = true;
  pendingAction.value = "followup";
  lifecyclePhase.value = "followup";

  try {
    const adapter = getAdapter();
    const reading = await adapter.runReading(input);
    await appendAssistantMessageIncremental(appDialogue, reading.synthesis, {
      onChunk: () => scrollAppToBottom(true)
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to process follow-up.";
  } finally {
    isReading.value = false;
    pendingAction.value = "none";
  }
}

async function openOrGenerateAppFullReading(forceRefresh = false) {
  if (appReading.value && !forceRefresh) {
    readingPopupOpen.value = true;
    return;
  }

  if (!canGenerateFullReading.value) {
    return;
  }

  const indices = appSpread.value.slots.map((_, index) => index);
  const input = buildReadingInputFromIndices(appSpread.value, appCards.value, indices, {
    mode: "app_draw",
    phase: "full",
    revealedCount: revealedCount.value
  });
  if (!input) {
    return;
  }

  isReading.value = true;
  pendingAction.value = "full";
  lifecyclePhase.value = "full";

  try {
    const adapter = getAdapter();
    const reading = await adapter.runReading(input);
    appReading.value = reading;
    appNeedsUpdate.value = false;
    await appendAssistantMessageIncremental(appDialogue, reading.synthesis, {
      onChunk: () => scrollAppToBottom(true)
    });
    readingPopupOpen.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to generate full reading.";
  } finally {
    isReading.value = false;
    pendingAction.value = "none";
  }
}

async function downloadCurrentPdf() {
  const reading = popupReading.value;
  if (!reading) {
    return;
  }

  if (mode.value === "upload") {
    await exportReadingPdf({
      fileName: "tarot-reading-upload.pdf",
      reading,
      spread: uploadSpread.value,
      cards: uploadCards.value as DrawnCard[],
      deckId: settingsStore.settings.deckId,
      sourceImageDataUrl: uploadImageDataUrl.value,
      disclaimer: "Reflective use only. This reading is not medical, legal, or financial professional advice."
    });
    return;
  }

  await exportReadingPdf({
    fileName: "tarot-reading-deck-draw.pdf",
    reading,
    spread: appSpread.value,
    cards: appCards.value as DrawnCard[],
    deckId: settingsStore.settings.deckId,
    disclaimer: "Reflective use only. This reading is not medical, legal, or financial professional advice."
  });
}
</script>

<style scoped>
.reading-module {
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
  grid-template-columns: minmax(0, 2fr) minmax(340px, 1fr);
  gap: 0.65rem;
  align-items: stretch;
  height: clamp(680px, calc(100vh - 10rem), 900px);
}

.stage-card {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
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
  min-height: 0;
  overflow: visible;
  padding-right: 0.1rem;
  padding-bottom: 0.25rem;
}

.question-stage {
  position: relative;
  min-height: min(52vh, 420px);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 26%, color-mix(in srgb, var(--accent-2) 22%, transparent), transparent 42%),
    radial-gradient(circle at 68% 62%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 45%),
    color-mix(in srgb, var(--surface) 78%, transparent);
  display: grid;
  place-items: center;
}

.question-stage-glow {
  position: absolute;
  width: min(380px, 44vw);
  aspect-ratio: 1;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent-2) 42%, transparent);
  background:
    radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.26), transparent 34%),
    radial-gradient(circle at 52% 52%, color-mix(in srgb, var(--accent-2) 26%, transparent), color-mix(in srgb, var(--surface) 84%, transparent));
  filter: blur(0.2px) saturate(1.08);
  box-shadow:
    0 0 38px color-mix(in srgb, var(--accent-2) 24%, transparent),
    inset 0 0 24px color-mix(in srgb, var(--accent) 18%, transparent);
  animation: question-halo 4.6s ease-in-out infinite;
}

.question-stage-content {
  position: relative;
  z-index: 1;
  width: min(480px, 88%);
  text-align: center;
  display: grid;
  gap: 0.32rem;
}

.question-stage-content h4 {
  margin: 0;
  font-size: clamp(1.2rem, 2.2vw, 1.8rem);
}

.question-stage-copy {
  margin: 0;
  font-size: 1rem;
  color: color-mix(in srgb, var(--text) 92%, white 8%);
}

.question-stage-label {
  position: relative;
  display: block;
  min-height: 1.95rem;
  margin: 0.1rem 0 0;
}

.question-stage-label.empty::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 0.24rem;
  transform: translateX(-50%);
  width: 1.5px;
  height: 1.15rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-2) 78%, var(--accent));
  opacity: 0.95;
  animation: question-cursor 1s steps(1, end) infinite;
  pointer-events: none;
}

.question-stage-label textarea {
  width: 100%;
  min-height: 1.9rem;
  max-height: 7rem;
  resize: none;
  margin: 0;
  border: 0 !important;
  border-radius: 0;
  padding: 0;
  background: transparent !important;
  color: var(--text);
  text-align: center;
  line-height: 1.35;
  caret-color: color-mix(in srgb, var(--accent-2) 76%, white 24%);
  box-shadow: none;
}

.question-stage-label.empty textarea {
  caret-color: transparent;
}

.question-stage-label textarea:focus-visible {
  outline: none;
  border: 0;
}

.question-stage-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.28rem;
  margin-top: 0.02rem;
}

.question-stage-actions button {
  min-height: 1.9rem;
  padding: 0.28rem 0.74rem;
  border: 0 !important;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--surface) 92%, transparent),
      color-mix(in srgb, var(--surface) 38%, transparent) 50%,
      color-mix(in srgb, var(--surface) 92%, transparent)
    );
  color: color-mix(in srgb, var(--text) 96%, white 4%);
  box-shadow: none;
}

.question-stage-actions button:hover,
.question-stage-actions button:focus-visible {
  transform: none;
  border: 0;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--surface) 90%, transparent),
      color-mix(in srgb, var(--surface) 32%, transparent) 50%,
      color-mix(in srgb, var(--surface) 90%, transparent)
    );
}

.board-loading {
  position: absolute;
  inset: 0.3rem;
  border-radius: 10px;
  background: color-mix(in srgb, rgba(8, 8, 12, 0.7) 80%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--accent) 36%, var(--border));
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.65rem;
  text-align: center;
  z-index: 300;
}

.board-loading p {
  margin: 0.12rem 0 0;
  font-size: 0.9rem;
  color: var(--text);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 3px solid color-mix(in srgb, var(--accent) 65%, transparent);
  border-top-color: transparent;
  animation: spin 760ms linear infinite;
}

.board-loading-card {
  width: min(240px, 32vw);
  max-height: min(46vh, 340px);
  object-fit: contain;
  object-position: center;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--border) 74%, transparent);
  box-shadow: 0 14px 28px rgba(6, 8, 15, 0.44);
  background: rgba(8, 8, 12, 0.12);
}

.board-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.dialogue-card {
  position: relative;
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.55rem;
  overflow: visible;
}

.reading-guide {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.42rem;
}

.reading-guide p {
  margin: 0;
  line-height: 1.42;
  max-width: 42ch;
}

label {
  display: grid;
  gap: 0.3rem;
}

.dialogue-input-wrap {
  display: grid;
  gap: 0.3rem;
}

.reading-status {
  display: grid;
  gap: 0.22rem;
}

.reading-status.compact {
  gap: 0.3rem;
}

.reading-status p {
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

.file-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.42rem 0.5rem;
  background: color-mix(in srgb, var(--surface) 80%, transparent);
}

.file-name {
  margin: 0;
  font-weight: 600;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.action-row button.processing {
  border-color: color-mix(in srgb, var(--accent) 72%, var(--border));
  background: color-mix(in srgb, var(--accent) 30%, var(--surface));
}

.messages {
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 0.42rem;
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

.dialogue-card textarea {
  width: 100%;
  min-height: 7.4rem;
  max-height: 14rem;
}

.setup-modal {
  width: min(720px, calc(100vw - 1.5rem));
  display: grid;
  gap: 0.6rem;
}

.setup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.65rem;
}

.setup-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.full-reading-modal {
  width: min(860px, calc(100vw - 1.4rem));
  max-height: calc(100vh - 1.5rem);
  overflow: auto;
  display: grid;
  gap: 0.6rem;
}

.reading-items {
  display: grid;
  gap: 0.4rem;
}

.reading-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.5rem;
  background: color-mix(in srgb, var(--surface) 34%, transparent);
}

.reading-item h4,
.reading-item p {
  margin: 0;
}

.reading-item h4 {
  margin-bottom: 0.18rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes question-halo {
  0% {
    transform: scale(1);
    opacity: 0.84;
  }
  50% {
    transform: scale(1.03);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.84;
  }
}

@keyframes question-cursor {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

.inline-spinner {
  width: 0.88rem;
  height: 0.88rem;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--accent) 80%, transparent);
  border-top-color: transparent;
  animation: spin 760ms linear infinite;
  margin-right: 0.36rem;
  display: inline-block;
  vertical-align: -0.12rem;
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: 1fr;
    height: auto;
  }

  .dialogue-card {
    grid-template-rows: auto minmax(230px, 1fr) auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-top-color: color-mix(in srgb, var(--accent) 65%, transparent);
  }

  .inline-spinner {
    animation: none;
    border-top-color: color-mix(in srgb, var(--accent) 80%, transparent);
  }
}
</style>
