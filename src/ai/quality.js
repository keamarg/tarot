export function maxTokensFromQuality(quality) {
    switch (quality) {
        case "low":
            return 700;
        case "high":
            return 2200;
        case "standard":
        default:
            return 1400;
    }
}
export function readingMaxTokensFromQuality(quality) {
    switch (quality) {
        case "low":
            return 1400;
        case "high":
            return 3200;
        case "standard":
        default:
            return 2400;
    }
}
export function trainingTemperatureFromQuality(quality) {
    switch (quality) {
        case "low":
            return 0.46;
        case "high":
            return 0.76;
        case "standard":
        default:
            return 0.62;
    }
}
export function readingTemperatureFromQuality(quality) {
    switch (quality) {
        case "low":
            return 0.52;
        case "high":
            return 0.84;
        case "standard":
        default:
            return 0.72;
    }
}
export function visionTemperatureFromQuality(quality) {
    switch (quality) {
        case "low":
            return 0.08;
        case "high":
            return 0.24;
        case "standard":
        default:
            return 0.16;
    }
}
export function qualityDirective(quality) {
    switch (quality) {
        case "low":
            return "Be concise and prioritize speed over nuance.";
        case "high":
            return "Provide detailed nuance with richer examples where appropriate.";
        case "standard":
        default:
            return "Balance clarity, depth, and response length.";
    }
}
