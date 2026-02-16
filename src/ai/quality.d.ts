import type { QualityPreset } from "@/domain/types";
export declare function maxTokensFromQuality(quality: QualityPreset): number;
export declare function readingMaxTokensFromQuality(quality: QualityPreset): number;
export declare function trainingTemperatureFromQuality(quality: QualityPreset): number;
export declare function readingTemperatureFromQuality(quality: QualityPreset): number;
export declare function visionTemperatureFromQuality(quality: QualityPreset): number;
export declare function qualityDirective(quality: QualityPreset): string;
