#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const decksDir = path.join(repoRoot, "data", "decks");

async function readDeckDefinitions() {
  const files = (await fs.readdir(decksDir)).filter((name) => name.endsWith(".json"));
  const decks = [];
  for (const fileName of files) {
    const raw = await fs.readFile(path.join(decksDir, fileName), "utf8");
    decks.push(JSON.parse(raw));
  }
  return decks;
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, data);
}

async function run() {
  const decks = await readDeckDefinitions();
  let downloaded = 0;

  for (const deck of decks) {
    if (deck.enabled === false) {
      continue;
    }

    const remoteBackUrl = typeof deck.remoteBackUrl === "string" ? deck.remoteBackUrl : "";
    if (remoteBackUrl && typeof deck.cardBackPath === "string") {
      const destination = path.join(repoRoot, "public", deck.cardBackPath);
      await downloadFile(remoteBackUrl, destination);
      downloaded += 1;
      console.log(`Downloaded back for ${deck.id}`);
    }

    const remoteCards = deck.remoteCardUrls;
    if (remoteCards && typeof remoteCards === "object") {
      for (const [cardId, url] of Object.entries(remoteCards)) {
        if (typeof url !== "string" || !url) {
          continue;
        }
        const relativePath = deck.cardOverrides?.[cardId];
        if (!relativePath) {
          continue;
        }
        const destination = path.join(repoRoot, "public", relativePath);
        await downloadFile(url, destination);
        downloaded += 1;
      }
      console.log(`Downloaded remote card overrides for ${deck.id}`);
      continue;
    }

    console.log(`No remote card manifest configured for ${deck.id}; using local card source.`);
  }

  if (downloaded === 0) {
    console.log("Deck fetch complete: no remote deck assets configured.");
  } else {
    console.log(`Deck fetch complete: downloaded ${downloaded} files.`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
