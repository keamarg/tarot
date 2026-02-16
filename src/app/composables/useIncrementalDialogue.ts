import type { Ref } from "vue";
import type { DialogueEntry } from "@/domain/types";

interface IncrementalOptions {
  wordsPerChunk?: number;
  delayMs?: number;
  onChunk?: () => void | Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function appendAssistantMessageIncremental(
  dialogueRef: Ref<DialogueEntry[]>,
  message: string,
  options: IncrementalOptions = {}
): Promise<void> {
  const wordsPerChunk = options.wordsPerChunk ?? 3;
  const delayMs = options.delayMs ?? 24;
  const tokens = message.split(/(\s+)/).filter((token) => token.length > 0);

  if (!tokens.length) {
    dialogueRef.value = [...dialogueRef.value, { speaker: "assistant", text: "" }];
    return;
  }

  dialogueRef.value = [...dialogueRef.value, { speaker: "assistant", text: "" }];
  const index = dialogueRef.value.length - 1;

  for (let offset = 0; offset < tokens.length; offset += wordsPerChunk) {
    const chunk = tokens.slice(offset, offset + wordsPerChunk).join("");
    const next = [...dialogueRef.value];
    next[index] = {
      ...next[index],
      text: `${next[index].text}${chunk}`
    };
    dialogueRef.value = next;

    if (options.onChunk) {
      await options.onChunk();
    }
    await sleep(delayMs);
  }
}
