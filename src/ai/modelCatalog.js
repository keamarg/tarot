import rawModels from "@data/models.json";
import { hasServerProxy, withApiBase } from "@/ai/apiBase";
const FALLBACK_MODELS = rawModels.sort((a, b) => a.label.localeCompare(b.label));
export function fallbackModelsFor(provider) {
    return dedupeById(FALLBACK_MODELS.filter((model) => model.provider === provider && isLowCostModel(provider, model.id)));
}
function labelFromModelId(id) {
    return id
        .replace(/^claude-/, "Claude ")
        .replace(/^gpt-/, "GPT-")
        .replace(/^gemini-/, "Gemini ")
        .replace(/-/g, " ");
}
function dedupeById(models) {
    const byId = new Map();
    for (const model of models) {
        if (!byId.has(model.id)) {
            byId.set(model.id, model);
        }
    }
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
}
function isLowCostModel(provider, id) {
    const modelId = id.toLowerCase();
    if (provider === "anthropic") {
        if (modelId.includes("opus")) {
            return false;
        }
        if (modelId.includes("3-5-sonnet") || modelId.includes("3.5-sonnet")) {
            return false;
        }
        return modelId.includes("haiku") || modelId.includes("sonnet");
    }
    if (provider === "openai") {
        return modelId.includes("mini") || modelId.includes("nano");
    }
    return modelId.includes("flash") || modelId.includes("lite");
}
export async function fetchModelsForProvider(provider, apiKey) {
    const trimmedKey = apiKey.trim();
    const usesProxy = hasServerProxy() || import.meta.env.DEV;
    if (!trimmedKey && !usesProxy) {
        return fallbackModelsFor(provider);
    }
    if (provider === "anthropic") {
        const headers = {
            "anthropic-version": "2023-06-01"
        };
        if (trimmedKey) {
            headers["x-api-key"] = trimmedKey;
            headers["anthropic-dangerous-direct-browser-access"] = "true";
        }
        const response = await fetch(usesProxy ? withApiBase("/api/anthropic/models") : "https://api.anthropic.com/v1/models", {
            headers
        });
        if (!response.ok) {
            throw new Error(`Anthropic models request failed (${response.status}).`);
        }
        const data = (await response.json());
        const models = (data.data ?? [])
            .filter((model) => model.id.startsWith("claude-") && isLowCostModel(provider, model.id))
            .map((model) => ({
            provider,
            id: model.id,
            label: model.display_name ?? labelFromModelId(model.id)
        }))
            .sort((a, b) => a.label.localeCompare(b.label));
        return models.length ? dedupeById(models) : fallbackModelsFor(provider);
    }
    if (provider === "openai") {
        const headers = {};
        if (trimmedKey) {
            headers.authorization = `Bearer ${trimmedKey}`;
        }
        const response = await fetch(usesProxy ? withApiBase("/api/openai/models") : "https://api.openai.com/v1/models", {
            headers
        });
        if (!response.ok) {
            throw new Error(`OpenAI models request failed (${response.status}).`);
        }
        const data = (await response.json());
        const models = (data.data ?? [])
            .map((model) => model.id)
            .filter((id) => id.startsWith("gpt") && isLowCostModel(provider, id))
            .map((id) => ({
            provider,
            id,
            label: id
        }))
            .sort((a, b) => a.label.localeCompare(b.label));
        return models.length ? dedupeById(models) : fallbackModelsFor(provider);
    }
    const googleModelsUrl = usesProxy
        ? withApiBase("/api/google/models")
        : `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`;
    const response = await fetch(googleModelsUrl);
    if (!response.ok) {
        throw new Error(`Google models request failed (${response.status}).`);
    }
    const data = (await response.json());
    const models = (data.models ?? [])
        .filter((model) => (model.supportedGenerationMethods ?? []).includes("generateContent") &&
        isLowCostModel(provider, model.name.replace(/^models\//, "")))
        .map((model) => {
        const id = model.name.replace(/^models\//, "");
        return {
            provider,
            id,
            label: model.displayName ?? id
        };
    })
        .sort((a, b) => a.label.localeCompare(b.label));
    return models.length ? dedupeById(models) : fallbackModelsFor(provider);
}
