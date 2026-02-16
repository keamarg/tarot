import { z } from "zod";
export const cardSchema = z.object({
    id: z.string(),
    name: z.string(),
    arcana: z.enum(["major", "minor"]),
    suit: z.enum(["cups", "pentacles", "swords", "wands"]).optional(),
    rank: z.string().optional(),
    image: z.string()
});
export const spreadSlotSchema = z.object({
    id: z.string(),
    label: z.string(),
    meaning: z.string(),
    x: z.number(),
    y: z.number(),
    rotationDeg: z.number(),
    faceDownAllowed: z.boolean()
});
export const spreadSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    slots: z.array(spreadSlotSchema).min(1)
});
export const exerciseSchema = z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(["active", "coming_soon"]),
    scenarioTemplate: z.string(),
    bookSummary: z.string().min(1).optional(),
    defaultRole: z.enum(["coach", "client", "co_learner"]),
    supportedRoles: z.array(z.enum(["coach", "client", "co_learner"])).min(1),
    flowSteps: z.array(z.string()).min(1),
    stepPlan: z
        .array(z.object({
        text: z.string(),
        action: z.enum(["draw", "manual"]),
        drawCount: z.number().int().min(0)
    }))
        .min(1)
        .optional(),
    rules: z.object({
        maxCardsInPlay: z.number().int().min(1),
        allowAddNamedCard: z.boolean(),
        allowEditCards: z.boolean(),
        allowRemoveCards: z.boolean()
    })
});
export const cardsSchema = z.array(cardSchema).length(78);
export const spreadsSchema = z.array(spreadSchema);
export const exercisesSchema = z.array(exerciseSchema);
