<template>
  <section ref="boardRef" class="cards-board" :style="boardStyle" @click="handleBoardClick">
    <h3 v-if="title" class="board-title">{{ title }}</h3>
    <p class="small" v-if="cards.length === 0">{{ emptyText }}</p>
    <div
      ref="gridRef"
      v-else
      class="cards-grid"
      :class="{ 'multi-layout': true }"
      @click="handleBoardClick"
    >
      <div v-for="(row, rowIndex) in layoutRows" :key="`row-${rowIndex}`" class="cards-row">
        <div
          v-for="cardIndex in row"
          :key="`${cards[cardIndex]!.cardId}-${cardIndex}`"
          class="card-cell"
        >
          <CardVisual
            class="board-card"
            :card-id="cards[cardIndex]!.cardId"
            :reversed="cards[cardIndex]!.reversed"
            :face-up="cards[cardIndex]!.faceUp"
            :expanded="expandedIndex === cardIndex"
            :expandable="cards[cardIndex]!.faceUp"
            :editable="editable"
            :removable="editable"
            :label="`Card ${cardIndex + 1}`"
            compact-meta
            @edit="$emit('edit-card', cardIndex)"
            @remove="$emit('remove-card', cardIndex)"
            @toggle-expand="toggleExpanded(cardIndex)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import CardVisual from "@/app/components/CardVisual.vue";
import type { DrawnCard } from "@/domain/types";

const props = withDefaults(
  defineProps<{
    cards: DrawnCard[];
    editable?: boolean;
    title?: string;
    emptyText?: string;
  }>(),
  {
    editable: false,
    title: "Cards In Play",
    emptyText: "No cards in play yet."
  }
);

defineEmits<{
  "edit-card": [index: number];
  "remove-card": [index: number];
}>();

const boardRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);
const gridSize = ref({ width: 0, height: 0 });
const expandedIndex = ref<number | null>(null);
let resizeObserver: ResizeObserver | undefined;

function readBoardSize() {
  const element = gridRef.value ?? boardRef.value;
  if (!element) {
    return;
  }
  const rect = element.getBoundingClientRect();
  gridSize.value = {
    width: Math.max(rect.width, 0),
    height: Math.max(rect.height, 0)
  };
}

onMounted(() => {
  readBoardSize();
  if (typeof ResizeObserver !== "undefined" && boardRef.value) {
    resizeObserver = new ResizeObserver(() => readBoardSize());
    resizeObserver.observe(boardRef.value);
    if (gridRef.value) {
      resizeObserver.observe(gridRef.value);
    }
    return;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("resize", readBoardSize);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", readBoardSize);
  }
});

const layoutColumns = computed(() => {
  const count = props.cards.length;
  if (count <= 0) {
    return 1;
  }
  if (count <= 3) {
    return count;
  }
  if (count <= 4) {
    return 2;
  }
  if (count <= 6) {
    return 3;
  }
  if (count <= 8) {
    return 4;
  }
  return 5;
});

const layoutRows = computed<number[][]>(() => {
  const count = props.cards.length;
  if (count <= 0) {
    return [];
  }
  const columns = Math.max(1, layoutColumns.value);
  const rowCount = Math.max(1, Math.ceil(count / columns));
  const baseCountPerRow = Math.floor(count / rowCount);
  const remainder = count % rowCount;
  const rows: number[][] = [];
  let cursor = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const rowSize = baseCountPerRow + (rowIndex < remainder ? 1 : 0);
    rows.push(Array.from({ length: rowSize }, (_, offset) => cursor + offset));
    cursor += rowSize;
  }
  return rows;
});
const boardStyle = computed<Record<string, string>>(() => {
  const width = gridSize.value.width || 940;
  const height = gridSize.value.height || 560;
  const rowCount = Math.max(1, layoutRows.value.length);
  const columns = Math.max(1, ...layoutRows.value.map((row) => row.length));
  const horizontalGap = columns <= 3 ? 30 : 20;
  const verticalGap = rowCount > 1 ? 12 : 0;
  const paddingX = 18;
  const paddingTop = rowCount > 1 ? 6 : 12;
  const paddingBottom = rowCount > 1 ? 24 : 30;

  const availableWidth = Math.max(width - paddingX * 2, 120);
  const availableHeight = Math.max(height - paddingTop - paddingBottom, 220);
  const widthBound = (availableWidth - horizontalGap * (columns - 1)) / columns;
  const rowHeight = Math.max(110, (availableHeight - verticalGap * (rowCount - 1)) / rowCount);
  const metadataHeight = props.editable ? 72 : 58;
  const heightBoundWidth = rowCount > 1 ? (rowHeight - metadataHeight) / (5 / 3) : Number.POSITIVE_INFINITY;
  const multiRowMaxWidth = props.editable
    ? columns <= 2
      ? 204
      : columns === 3
        ? 170
        : columns === 4
          ? 150
          : 136
    : columns <= 2
      ? 226
      : columns === 3
        ? 188
        : columns === 4
          ? 164
          : 146;
  const multiRowMinWidth = columns >= 5 ? 92 : columns === 4 ? 106 : columns === 3 ? 118 : 132;
  const nextWidth = Math.floor(
    Math.max(
      rowCount > 1 ? multiRowMinWidth : 84,
      Math.min(widthBound, heightBoundWidth, rowCount > 1 ? multiRowMaxWidth : 236)
    )
  );

  return {
    "--card-width": `${nextWidth}px`,
    "--card-gap": `${horizontalGap}px`,
    "--row-gap": `${verticalGap}px`,
    "--layout-columns": `${columns}`,
    "--row-track-width": `calc(${columns} * ${nextWidth}px + ${Math.max(columns - 1, 0)} * ${horizontalGap}px)`,
    "--rows-align": rowCount === 1 ? "end" : "start",
    "--grid-pad-x": `${paddingX}px`,
    "--grid-pad-top": `${paddingTop}px`,
    "--grid-pad-bottom": `${paddingBottom}px`
  };
});

function isInteractiveTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(
    element?.closest("button, a, input, textarea, select, option, label, [role='button']")
  );
}

function handleBoardClick(event: MouseEvent) {
  if (expandedIndex.value === null) {
    return;
  }
  if (isInteractiveTarget(event.target)) {
    return;
  }
  clearExpanded();
}

function toggleExpanded(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

function clearExpanded() {
  expandedIndex.value = null;
}

watch(
  () => props.cards.length,
  (length) => {
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(readBoardSize);
    } else {
      readBoardSize();
    }
    if (expandedIndex.value === null) {
      return;
    }
    if (expandedIndex.value >= length) {
      expandedIndex.value = null;
    }
  }
);
</script>

<style scoped>
.cards-board {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  height: 100%;
  gap: 0.55rem;
  overflow: visible;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.board-title {
  margin-bottom: 0;
}

.cards-grid {
  min-height: 0;
  height: 100%;
  overflow: visible;
}

.cards-grid.multi-layout {
  display: grid;
  justify-items: center;
  align-content: var(--rows-align);
  gap: var(--row-gap);
  padding: var(--grid-pad-top) var(--grid-pad-x) var(--grid-pad-bottom);
}

.cards-row {
  display: flex;
  justify-content: flex-start;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: var(--card-gap);
  width: min(100%, var(--row-track-width));
  margin-inline: auto;
}

.card-cell {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: min(var(--card-width), 100%);
  flex: 0 1 var(--card-width);
  overflow: visible;
}

.board-card {
  width: min(var(--card-width), 100%);
  max-width: min(var(--card-width), 100%);
}
</style>
