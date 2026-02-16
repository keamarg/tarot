import type { ProviderId } from "@/domain/types";
export interface ModelCatalogItem {
    provider: ProviderId;
    id: string;
    label: string;
}
export declare function fallbackModelsFor(provider: ProviderId): ModelCatalogItem[];
export declare function fetchModelsForProvider(provider: ProviderId, apiKey: string): Promise<ModelCatalogItem[]>;
