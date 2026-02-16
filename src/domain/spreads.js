import rawSpreads from "@data/spreads.json";
import { spreadsSchema } from "@/domain/schemas";
export const spreads = spreadsSchema.parse(rawSpreads);
const byId = new Map(spreads.map((spread) => [spread.id, spread]));
export function getSpreadById(spreadId) {
    const spread = byId.get(spreadId);
    if (!spread) {
        throw new Error(`Unknown spread id: ${spreadId}`);
    }
    return spread;
}
