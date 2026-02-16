#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const sourceUrl = "https://steve-p.org/cards/RWSa.html";
const outputDir = path.join(repoRoot, "public", "cards");
const cardsPath = path.join(repoRoot, "data", "cards.json");

const majorIds = [
  "major-00-the-fool",
  "major-01-the-magician",
  "major-02-the-high-priestess",
  "major-03-the-empress",
  "major-04-the-emperor",
  "major-05-the-hierophant",
  "major-06-the-lovers",
  "major-07-the-chariot",
  "major-08-strength",
  "major-09-the-hermit",
  "major-10-wheel-of-fortune",
  "major-11-justice",
  "major-12-the-hanged-man",
  "major-13-death",
  "major-14-temperance",
  "major-15-the-devil",
  "major-16-the-tower",
  "major-17-the-star",
  "major-18-the-moon",
  "major-19-the-sun",
  "major-20-judgement",
  "major-21-the-world"
];

const suitCodeMap = {
  P: "pentacles",
  W: "wands",
  C: "cups",
  S: "swords"
};

const rankCodeMap = {
  "0A": "ace",
  "02": "two",
  "03": "three",
  "04": "four",
  "05": "five",
  "06": "six",
  "07": "seven",
  "08": "eight",
  "09": "nine",
  "10": "ten",
  J1: "page",
  J2: "knight",
  QU: "queen",
  KI: "king"
};

function toCardId(codeSuit, codeRank) {
  if (codeSuit === "T") {
    const index = Number.parseInt(codeRank, 10);
    return Number.isNaN(index) ? undefined : majorIds[index];
  }

  const suit = suitCodeMap[codeSuit];
  const rank = rankCodeMap[codeRank];
  if (!suit || !rank) {
    return undefined;
  }

  return `minor-${suit}-${rank}`;
}

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function fetchHtml() {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch source index: ${response.status}`);
  }
  return await response.text();
}

function extractCards(html) {
  const regex = /small\/sm_RWSa-([A-Z])-([A-Z0-9]{2})\.webp/g;
  const seen = new Set();
  const out = [];
  for (const match of html.matchAll(regex)) {
    const codeSuit = match[1];
    const codeRank = match[2];
    const key = `${codeSuit}-${codeRank}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const cardId = toCardId(codeSuit, codeRank);
    if (!cardId) {
      continue;
    }

    out.push({
      cardId,
      sourcePath: `RWSa-${codeSuit}-${codeRank}.png`,
      url: `https://steve-p.org/cards/pix/RWSa-${codeSuit}-${codeRank}.png`
    });
  }
  return out;
}

async function readExpectedCards() {
  const raw = await fs.readFile(cardsPath, "utf8");
  return JSON.parse(raw);
}

async function downloadOne(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, data);
}

async function main() {
  await ensureOutputDir();
  const html = await fetchHtml();
  const extracted = extractCards(html);
  const expectedCards = await readExpectedCards();
  const expected = new Set(expectedCards.map((card) => card.id));

  for (const item of extracted) {
    if (!expected.has(item.cardId)) {
      continue;
    }
    const destination = path.join(outputDir, `${item.cardId}.png`);
    await downloadOne(item.url, destination);
    console.log(`Saved ${item.cardId}.png`);
  }

  const files = await fs.readdir(outputDir);
  const count = files.filter((name) => name.endsWith(".png")).length;
  console.log(`Downloaded ${count} png card images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
