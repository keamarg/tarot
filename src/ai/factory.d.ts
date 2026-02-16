import type { LLMAdapter } from "@/domain/types";
import type { ProviderId } from "@/domain/types";
export declare function createLLMAdapter(params: {
    provider: ProviderId;
    apiKey: string;
    model: string;
}): LLMAdapter;
