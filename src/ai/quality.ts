import type { QualityPreset } from "@/domain/types";

export function maxTokensFromQuality(quality: QualityPreset): number {
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

export function readingMaxTokensFromQuality(quality: QualityPreset): number {
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

export function trainingTemperatureFromQuality(quality: QualityPreset): number {
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

export function readingTemperatureFromQuality(quality: QualityPreset): number {
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

export function visionTemperatureFromQuality(quality: QualityPreset): number {
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

export function qualityDirective(quality: QualityPreset): string {
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
