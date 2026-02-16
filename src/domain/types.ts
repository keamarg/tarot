export type ProviderId = "anthropic" | "openai" | "google";

export type QualityPreset = "low" | "standard" | "high";
export type ReversalMode = "none" | "balanced";
export type TrainingRole = "coach" | "client" | "co_learner";
export type DrawMode = "app" | "physical";
export type UISkin = "arcana" | "classic" | "prism";
export type ExerciseStepAction = "draw" | "manual";

export interface AppSettings {
  provider: ProviderId;
  model: string;
  apiKeySession: string;
  quality: QualityPreset;
  cardBackId: string;
  customCardBackDataUrl?: string;
  reversalMode: ReversalMode;
  uiSkin: UISkin;
  qaUseMock: boolean;
}

export interface CardRef {
  id: string;
  name: string;
  arcana: "major" | "minor";
  suit?: "cups" | "pentacles" | "swords" | "wands";
  rank?: string;
  image: string;
}

export interface DrawnCard {
  cardId: string;
  reversed: boolean;
  faceUp: boolean;
}

export interface SpreadSlot {
  id: string;
  label: string;
  meaning: string;
  x: number;
  y: number;
  rotationDeg: number;
  faceDownAllowed: boolean;
}

export interface SpreadDefinition {
  id: string;
  name: string;
  description: string;
  slots: SpreadSlot[];
}

export interface ExerciseSpec {
  id: string;
  title: string;
  status: "active" | "coming_soon";
  scenarioTemplate: string;
  bookSummary?: string;
  defaultRole: TrainingRole;
  supportedRoles: TrainingRole[];
  flowSteps: string[];
  stepPlan?: Array<{
    text: string;
    action: ExerciseStepAction;
    drawCount: number;
  }>;
  rules: {
    maxCardsInPlay: number;
    allowAddNamedCard: boolean;
    allowEditCards: boolean;
    allowRemoveCards: boolean;
  };
}

export interface DialogueEntry {
  speaker: "user" | "assistant";
  text: string;
}

export interface VisionDetectionCard {
  slotId?: string;
  cardId?: string;
  cardName?: string;
  reversed?: boolean;
  confidence?: number;
}

export interface VisionDetectionResult {
  guessedSpreadId?: string;
  spreadConfidence?: number;
  cards: VisionDetectionCard[];
}

export interface ReadingOutput {
  title: string;
  spreadName: string;
  positionReadings: Array<{ slotLabel: string; cardName: string; interpretation: string }>;
  synthesis: string;
}

export interface TrainingTurnInput {
  exercise: ExerciseSpec;
  role: TrainingRole;
  drawMode: DrawMode;
  cardsInPlay: DrawnCard[];
  userMessage: string;
  quality: QualityPreset;
  progress: {
    drawCount: number;
    stepIndex: number;
    stepText: string;
    stepType: "draw" | "manual";
    requiredAction: "draw" | "next_step";
    totalSteps: number;
    drawTargetForStep: number;
    cardsRemainingOverall: number;
  };
}

export interface TrainingTurnOutput {
  assistantMessage: string;
  hints?: string[];
}

export interface ReadingInput {
  spread: SpreadDefinition;
  cards: Array<{ slot: SpreadSlot; card: CardRef; reversed: boolean }>;
  userIntent?: string;
  quality: QualityPreset;
  context?: {
    mode: "upload" | "app_draw";
    phase: "turn" | "followup" | "full";
    revealedCount: number;
    totalSlots: number;
    currentSlotId?: string;
  };
}

export interface LLMAdapter {
  runTrainingTurn(input: TrainingTurnInput): Promise<TrainingTurnOutput>;
  detectSpreadFromImage(input: {
    imageBase64: string;
    mimeType: string;
    quality: QualityPreset;
  }): Promise<VisionDetectionResult>;
  runReading(input: ReadingInput): Promise<ReadingOutput>;
}

export interface ReadingDraft {
  source: "upload" | "app_draw";
  spreadId: string;
  cards: Array<DrawnCard | undefined>;
  lastOutput?: ReadingOutput;
  uploadedImageDataUrl?: string;
  uploadedFileName?: string;
  started?: boolean;
  revealedCount?: number;
  nextRevealIndex?: number;
  dialogue?: DialogueEntry[];
}

export interface TrainingDraft {
  exerciseId: string;
  role?: TrainingRole;
  drawMode?: DrawMode;
  hasStarted?: boolean;
  drawCount?: number;
  stepIndex?: number;
  cardsInPlay: DrawnCard[];
  transcript: DialogueEntry[];
}
