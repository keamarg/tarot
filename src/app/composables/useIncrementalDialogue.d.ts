import type { Ref } from "vue";
import type { DialogueEntry } from "@/domain/types";
interface IncrementalOptions {
    wordsPerChunk?: number;
    delayMs?: number;
    onChunk?: () => void | Promise<void>;
}
export declare function appendAssistantMessageIncremental(dialogueRef: Ref<DialogueEntry[]>, message: string, options?: IncrementalOptions): Promise<void>;
export {};
