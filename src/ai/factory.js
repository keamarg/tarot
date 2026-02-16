import { AnthropicAdapter } from "@/ai/anthropicAdapter";
import { GoogleAdapter } from "@/ai/googleAdapter";
import { OpenAIAdapter } from "@/ai/openaiAdapter";
export function createLLMAdapter(params) {
    if (params.provider === "openai") {
        return new OpenAIAdapter(params.apiKey, params.model);
    }
    if (params.provider === "google") {
        return new GoogleAdapter(params.apiKey, params.model);
    }
    return new AnthropicAdapter(params.apiKey, params.model);
}
