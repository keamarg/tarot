<template>
  <div class="app-root" :class="routeClass">
    <header class="app-header">
      <div class="brand-wrap">
        <button type="button" class="brand-link" @click="requestNavigation('home')">
          <img class="brand-symbol" src="/symbols/sigil-heptagram.svg" alt="" aria-hidden="true" />
          <span>The Oracle Engine</span>
        </button>
      </div>
      <nav aria-label="Main navigation" class="main-nav">
        <button type="button" :class="{ active: route.name === 'training' }" @click="requestNavigation('training')">
          Training
        </button>
        <button type="button" :class="{ active: route.name === 'reading' }" @click="requestNavigation('reading')">
          Reading
        </button>
        <button type="button" :class="{ active: route.name === 'settings' }" @click="requestNavigation('settings')">
          Settings
        </button>
        <button type="button" class="nav-about" @click="aboutOpen = true">About</button>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <div
      v-if="aboutOpen"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      @click.self="aboutOpen = false"
    >
      <article class="card about-dialog">
        <header class="about-header">
          <h2 id="about-title">About The Oracle Engine</h2>
          <button type="button" aria-label="Close about dialog" @click="aboutOpen = false">Close</button>
        </header>

        <p>
          Local, session-based tarot practice and reading workspace. Training and Reading are designed for reflective
          guidance, with optional AI assistance.
        </p>

        <ul>
          <li>Training mode with guided tarot exercises</li>
          <li>Reading mode with upload analysis and deck-draw spreads</li>
          <li>Session-only settings and API key handling</li>
          <li>Client-side PDF export for completed readings</li>
        </ul>

        <p class="small">
          Reflective use only. Outputs are not medical, legal, financial, or mental-health professional advice.
        </p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute, useRouter } from "vue-router";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useSessionStore } from "@/app/sessionStore";
import { useSettingsStore } from "@/modules/settings/settingsStore";

type NavName = "home" | "training" | "reading" | "settings";

const settingsStore = useSettingsStore();
const sessionStore = useSessionStore();
const router = useRouter();
const route = useRoute();
const aboutOpen = ref(false);
const bypassGuardOnce = ref(false);
let removeRouteGuard: (() => void) | undefined;

const hasActiveSession = computed(
  () => Boolean(sessionStore.trainingDraft?.hasStarted || sessionStore.readingDraft?.started)
);
const routeClass = computed(() => `route-${String(route.name ?? "home")}`);

function leavePromptMessage(): string {
  return "Leave the current session? This will reset the current spread/exercise state.";
}

function resetSessionOnLeave() {
  sessionStore.resetAll();
}

function requestNavigation(target: NavName) {
  if (route.name === target) {
    return;
  }

  if (!hasActiveSession.value) {
    void router.push({ name: target });
    return;
  }

  const confirmed = window.confirm(leavePromptMessage());
  if (!confirmed) {
    return;
  }

  bypassGuardOnce.value = true;
  resetSessionOnLeave();
  void router.push({ name: target });
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasActiveSession.value) {
    return;
  }
  event.preventDefault();
  event.returnValue = "";
}

watch(
  () => settingsStore.settings.uiSkin,
  (skin) => {
    document.body.dataset.skin = skin;
  },
  { immediate: true }
);

watch(
  () => route.name,
  (nextName) => {
    document.body.dataset.route = String(nextName ?? "home");
  },
  { immediate: true }
);

onMounted(() => {
  removeRouteGuard = router.beforeEach((to, from) => {
    if (bypassGuardOnce.value) {
      bypassGuardOnce.value = false;
      return true;
    }

    if (to.fullPath === from.fullPath) {
      return true;
    }

    if (!hasActiveSession.value) {
      return true;
    }

    const confirmed = window.confirm(leavePromptMessage());
    if (!confirmed) {
      return false;
    }

    resetSessionOnLeave();
    return true;
  });

  window.addEventListener("beforeunload", onBeforeUnload);
});

onUnmounted(() => {
  removeRouteGuard?.();
  removeRouteGuard = undefined;
  window.removeEventListener("beforeunload", onBeforeUnload);
  delete document.body.dataset.skin;
  delete document.body.dataset.route;
});
</script>
