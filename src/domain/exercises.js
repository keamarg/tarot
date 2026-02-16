import rawExercises from "@data/exercises.json";
import { exercisesSchema } from "@/domain/schemas";
const parsed = exercisesSchema.parse(rawExercises);
export const activeExercises = parsed.filter((exercise) => exercise.status === "active");
export const comingSoonExercises = parsed.filter((exercise) => exercise.status === "coming_soon");
export function getExerciseById(exerciseId) {
    return parsed.find((exercise) => exercise.id === exerciseId);
}
