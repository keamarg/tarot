import { cards } from "@/domain/cards";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const rankWordByNumber: Record<string, string> = {
  "1": "ace",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  "10": "ten"
};

const byNormalizedName = new Map(cards.map((card) => [normalize(card.name), card.id]));
const byNormalizedId = new Map(cards.map((card) => [normalize(card.id), card.id]));

function variants(value?: string): string[] {
  if (!value) {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  const base = trimmed.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const numeralExpanded = base.replace(/\b(10|[1-9])\b/g, (match) => rankWordByNumber[match] ?? match);
  const withoutArticle = numeralExpanded.replace(/\bthe\s+/g, "").trim();

  return Array.from(new Set([trimmed, base, numeralExpanded, withoutArticle]));
}

export function cardIdFromName(name?: string): string | undefined {
  if (!name) {
    return undefined;
  }
  for (const variant of variants(name)) {
    const normalizedVariant = normalize(variant);
    const directById = byNormalizedId.get(normalizedVariant);
    if (directById) {
      return directById;
    }

    const directByName = byNormalizedName.get(normalizedVariant);
    if (directByName) {
      return directByName;
    }

    const fuzzy = cards.find((card) => {
      const normalizedCardName = normalize(card.name);
      return normalizedCardName.includes(normalizedVariant) || normalizedVariant.includes(normalizedCardName);
    });
    if (fuzzy) {
      return fuzzy.id;
    }
  }

  return undefined;
}
