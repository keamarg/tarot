import rawExercises from "@data/exercises.json";
import { exercisesSchema } from "@/domain/schemas";
import type { ExerciseSpec } from "@/domain/types";

const parsed = exercisesSchema.parse(rawExercises);

export const activeExercises: ExerciseSpec[] = parsed.filter((exercise) => exercise.status === "active");
export const comingSoonExercises: ExerciseSpec[] = parsed.filter(
  (exercise) => exercise.status === "coming_soon"
);

export function getExerciseById(exerciseId: string): ExerciseSpec | undefined {
  return parsed.find((exercise) => exercise.id === exerciseId);
}
