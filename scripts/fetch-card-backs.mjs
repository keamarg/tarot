#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "public", "backs");

const sources = [
  {
    id: "original",
    url: "https://www.usgamesinc.com/images/product/ORW99_7_1.webp"
  },
  {
    id: "centennial",
    url: "https://www.usgamesinc.com/images/product/smith-waite-deck-back_2013.webp"
  }
];

async function downloadOne(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, buffer);
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  for (const source of sources) {
    const destination = path.join(outputDir, `${source.id}.webp`);
    await downloadOne(source.url, destination);
    console.log(`Saved ${destination}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
