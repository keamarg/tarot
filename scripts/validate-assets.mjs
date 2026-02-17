#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const cardsPath = path.join(repoRoot, "data", "cards.json");
const decksDir = path.join(repoRoot, "data", "decks");
const publicDir = path.join(repoRoot, "public");

function isObject(value) {
  return Boolean(value) && typeof value === "object";
}

function parsePngDimensions(buffer) {
  const isPng =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  if (!isPng) {
    return undefined;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!width || !height) {
    return undefined;
  }
  return { width, height };
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function readDeckDefinitions() {
  const deckFiles = (await fs.readdir(decksDir)).filter((name) => name.endsWith(".json"));
  const decks = [];
  for (const file of deckFiles) {
    const fullPath = path.join(decksDir, file);
    const rawDeck = await readJson(fullPath);
    decks.push(rawDeck);
  }
  return decks;
}

function resolveCardPath(deck, card) {
  const overridePath = isObject(deck.cardOverrides) ? deck.cardOverrides[card.id] : undefined;
  if (typeof overridePath === "string" && overridePath.trim()) {
    return overridePath;
  }
  return path.posix.join(deck.cardsBasePath, card.image);
}

async function fileSize(fullPath) {
  const stat = await fs.stat(fullPath);
  return stat.size;
}

async function validateDeck(deck, cards) {
  const deckId = String(deck.id ?? "unknown-deck");
  const missing = [];
  const zeroByte = [];
  const ratioWarnings = [];

  if (deck.enabled === false) {
    return { deckId, skipped: true, missing, zeroByte, ratioWarnings };
  }

  if (typeof deck.cardsBasePath !== "string" || !deck.cardsBasePath.trim()) {
    throw new Error(`Deck ${deckId} is missing cardsBasePath.`);
  }
  if (typeof deck.cardBackPath !== "string" || !deck.cardBackPath.trim()) {
    throw new Error(`Deck ${deckId} is missing cardBackPath.`);
  }

  for (const card of cards) {
    const relativeCardPath = resolveCardPath(deck, card);
    const fullPath = path.join(publicDir, relativeCardPath);

    try {
      const size = await fileSize(fullPath);
      if (size <= 0) {
        zeroByte.push(relativeCardPath);
        continue;
      }

      if (relativeCardPath.endsWith(".png")) {
        const buffer = await fs.readFile(fullPath);
        const dimensions = parsePngDimensions(buffer);
        if (dimensions) {
          const ratio = dimensions.width / dimensions.height;
          if (ratio < 0.54 || ratio > 0.64) {
            ratioWarnings.push(`${relativeCardPath} (${dimensions.width}x${dimensions.height})`);
          }
        }
      }
    } catch {
      missing.push(relativeCardPath);
    }
  }

  const backFullPath = path.join(publicDir, deck.cardBackPath);
  try {
    const backSize = await fileSize(backFullPath);
    if (backSize <= 0) {
      zeroByte.push(deck.cardBackPath);
    }
  } catch {
    missing.push(deck.cardBackPath);
  }

  return { deckId, skipped: false, missing, zeroByte, ratioWarnings };
}

async function main() {
  const cards = await readJson(cardsPath);
  const decks = await readDeckDefinitions();

  if (!Array.isArray(cards) || cards.length !== 78) {
    throw new Error("cards.json must contain exactly 78 cards.");
  }

  if (!Array.isArray(decks) || decks.length === 0) {
    throw new Error("No deck manifests found in data/decks.");
  }

  let hasErrors = false;

  for (const deck of decks) {
    const result = await validateDeck(deck, cards);
    if (result.skipped) {
      console.log(`Skipping disabled deck: ${result.deckId}`);
      continue;
    }

    if (result.missing.length > 0) {
      hasErrors = true;
      console.error(`Deck ${result.deckId} missing files (${result.missing.length}):`);
      for (const item of result.missing.slice(0, 12)) {
        console.error(` - ${item}`);
      }
    }

    if (result.zeroByte.length > 0) {
      hasErrors = true;
      console.error(`Deck ${result.deckId} has invalid zero-byte files (${result.zeroByte.length}):`);
      for (const item of result.zeroByte.slice(0, 12)) {
        console.error(` - ${item}`);
      }
    }

    if (result.ratioWarnings.length > 0) {
      hasErrors = true;
      console.error(`Deck ${result.deckId} has unexpected aspect ratio files (${result.ratioWarnings.length}):`);
      for (const item of result.ratioWarnings.slice(0, 12)) {
        console.error(` - ${item}`);
      }
    }

    if (result.missing.length === 0 && result.zeroByte.length === 0 && result.ratioWarnings.length === 0) {
      console.log(`Deck ${result.deckId} validation passed (78 cards + back).`);
    }
  }

  if (hasErrors) {
    process.exitCode = 1;
    return;
  }

  console.log("Asset validation passed for all enabled decks.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
