#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const cardsPath = path.join(repoRoot, "data", "cards.json");
const cardDir = path.join(repoRoot, "public", "cards");
const backDir = path.join(repoRoot, "public", "backs");

async function main() {
  const rawCards = JSON.parse(await fs.readFile(cardsPath, "utf8"));
  const expected = new Set(rawCards.map((card) => card.image));

  const existing = await fs.readdir(cardDir).catch(() => []);
  const existingSet = new Set(existing.filter((name) => name.endsWith(".png")));

  const missing = [...expected].filter((name) => !existingSet.has(name));
  const unexpected = [...existingSet].filter((name) => !expected.has(name));

  if (missing.length > 0) {
    console.error(`Missing card files (${missing.length}):`);
    for (const name of missing.slice(0, 20)) {
      console.error(` - ${name}`);
    }
    process.exitCode = 1;
  }

  if (unexpected.length > 0) {
    console.warn(`Unexpected files (${unexpected.length}):`);
    for (const name of unexpected.slice(0, 20)) {
      console.warn(` - ${name}`);
    }
  }

  const stats = await Promise.all(
    [...expected].map(async (name) => {
      const full = path.join(cardDir, name);
      try {
        const stat = await fs.stat(full);
        return { name, size: stat.size };
      } catch {
        return { name, size: 0 };
      }
    })
  );

  const empty = stats.filter((entry) => entry.size <= 0);
  if (empty.length > 0) {
    console.error(`Zero-byte files detected (${empty.length}).`);
    process.exitCode = 1;
  }

  const backFiles = ["original.webp", "centennial.webp"];
  for (const file of backFiles) {
    const full = path.join(backDir, file);
    try {
      const stat = await fs.stat(full);
      if (stat.size <= 0) {
        throw new Error("Zero-byte file");
      }
    } catch {
      console.error(`Missing or invalid back file: ${file}`);
      process.exitCode = 1;
    }
  }

  if (!process.exitCode) {
    console.log("Asset validation passed: 78 cards + 2 backs present.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
