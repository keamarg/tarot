import type { ExerciseSpec } from "@/domain/types";
export declare const activeExercises: ExerciseSpec[];
export declare const comingSoonExercises: ExerciseSpec[];
export declare function getExerciseById(exerciseId: string): ExerciseSpec | undefined;
