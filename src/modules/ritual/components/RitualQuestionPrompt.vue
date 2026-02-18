<template>
  <section class="question-prompt" :class="{ crystal: crystalMode }">
    <h4>Set Your Question</h4>
    <p class="small">Frame one clear question before the cards are revealed.</p>

    <label>
      Question
      <textarea
        :value="question"
        rows="3"
        @input="onInput"
      />
    </label>

    <div class="question-actions">
      <button class="primary" type="button" @click="submit(false)">Continue</button>
      <button type="button" @click="submit(true)">Skip question</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { featureFlags } from "@/app/featureFlags";
import { speakWhisper } from "@/modules/ambience/audio/useWhisperVoice";

const props = withDefaults(
  defineProps<{
    question: string;
    crystalMode?: boolean;
    voiceEnabled?: boolean;
    voiceVolume?: number;
  }>(),
  {
    crystalMode: false,
    voiceEnabled: false,
    voiceVolume: 0.35
  }
);

const emit = defineEmits<{
  "update:question": [question: string];
  submit: [{ skipped: boolean }];
}>();

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit("update:question", target.value);
}

function submit(skipped: boolean) {
  emit("submit", { skipped });
}

onMounted(() => {
  if (!featureFlags.whisperVoice) {
    return;
  }
  speakWhisper({
    text: "Ask your question before we begin.",
    enabled: Boolean(props.voiceEnabled),
    volume: props.voiceVolume
  });
});
</script>

<style scoped>
.question-prompt {
  display: grid;
  gap: 0.45rem;
  border: 1px solid color-mix(in srgb, var(--border) 76%, transparent);
  border-radius: 12px;
  padding: 0.7rem;
  background:
    radial-gradient(circle at 16% 18%, color-mix(in srgb, var(--accent-2) 16%, transparent), transparent 38%),
    color-mix(in srgb, var(--surface) 76%, transparent);
}

.question-prompt h4,
.question-prompt p {
  margin: 0;
}

.question-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.question-prompt.crystal {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--accent-2) 25%, transparent),
    0 12px 26px rgba(11, 22, 39, 0.35),
    inset 0 0 34px color-mix(in srgb, var(--accent-2) 16%, transparent);
}
</style>
