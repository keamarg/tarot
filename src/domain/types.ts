export type ProviderId = "anthropic" | "openai" | "google";

export type QualityPreset = "low" | "standard" | "high";
export type ReversalMode = "none" | "balanced";
export type TrainingRole = "coach" | "client" | "co_learner";
export type DrawMode = "app" | "physical";
export type UISkin = "arcana" | "classic" | "prism" | "ember" | "verdigris";
export type ExerciseStepAction = "draw" | "manual";
export type ReadingLifecyclePhase =
  | "setup"
  | "question"
  | "shuffle"
  | "pick"
  | "reveal"
  | "followup"
  | "full";
export type AnimationIntensity = "low" | "standard" | "high";

export interface DeckCardMap {
  [cardId: string]: string;
}

export interface DeckDefinition {
  id: string;
  label: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  cardsBasePath: string;
  cardBackPath: string;
  cardOverrides?: DeckCardMap;
  frontFilter?: string;
  shadowTint?: string;
  enabled?: boolean;
  ambienceProfile?: {
    musicMode: "warm" | "cool" | "neutral";
    shuffleSfxSeed: number;
    revealSfxSeed: number;
  };
}

export interface PaletteDefinition {
  id: UISkin | string;
  label: string;
  description: string;
}

export interface AmbientScene {
  id: string;
  label: string;
  description: string;
  candleCount: number;
  smokeDensity: number;
  crystalPrompt: boolean;
}

export interface AudioSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface VoiceSettings {
  voiceEnabled: boolean;
  voiceVolume: number;
}

export interface RitualState {
  mode: "upload" | "app_draw";
  phase: ReadingLifecyclePhase;
  questionText: string;
  questionSkipped: boolean;
  pickOrder: number[];
  shuffleCompleted: boolean;
  deckActivated: boolean;
}

export interface AppSettings {
  provider: ProviderId;
  model: string;
  apiKeySession: string;
  quality: QualityPreset;
  cardBackId: string;
  customCardBackDataUrl?: string;
  reversalMode: ReversalMode;
  uiSkin: UISkin;
  paletteId: string;
  deckId: string;
  sceneId: string;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  voiceEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  animationIntensity: AnimationIntensity;
  ritualPromptsEnabled: boolean;
  ritualSilenceMode: boolean;
  reducedEffects: boolean;
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
    questionText?: string;
    deckId?: string;
    ritualPhase?: ReadingLifecyclePhase;
    isUploadMode?: boolean;
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
  ritualPhase?: ReadingLifecyclePhase;
  questionText?: string;
  questionSkipped?: boolean;
  pickOrder?: number[];
  selectedDeckId?: string;
  lifecycleVersion?: number;
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
