import rawSpreads from "@data/spreads.json";
import { spreadsSchema } from "@/domain/schemas";
import type { SpreadDefinition } from "@/domain/types";

export const spreads: SpreadDefinition[] = spreadsSchema.parse(rawSpreads);

const byId = new Map(spreads.map((spread) => [spread.id, spread]));

export function getSpreadById(spreadId: string): SpreadDefinition {
  const spread = byId.get(spreadId);
  if (!spread) {
    throw new Error(`Unknown spread id: ${spreadId}`);
  }
  return spread;
}
