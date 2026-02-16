import { z } from "zod";
export declare const cardSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    arcana: z.ZodEnum<["major", "minor"]>;
    suit: z.ZodOptional<z.ZodEnum<["cups", "pentacles", "swords", "wands"]>>;
    rank: z.ZodOptional<z.ZodString>;
    image: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    arcana: "major" | "minor";
    image: string;
    suit?: "cups" | "pentacles" | "swords" | "wands" | undefined;
    rank?: string | undefined;
}, {
    id: string;
    name: string;
    arcana: "major" | "minor";
    image: string;
    suit?: "cups" | "pentacles" | "swords" | "wands" | undefined;
    rank?: string | undefined;
}>;
export declare const spreadSlotSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    meaning: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    rotationDeg: z.ZodNumber;
    faceDownAllowed: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    label: string;
    meaning: string;
    x: number;
    y: number;
    rotationDeg: number;
    faceDownAllowed: boolean;
}, {
    id: string;
    label: string;
    meaning: string;
    x: number;
    y: number;
    rotationDeg: number;
    faceDownAllowed: boolean;
}>;
export declare const spreadSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    slots: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        meaning: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
        rotationDeg: z.ZodNumber;
        faceDownAllowed: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        meaning: string;
        x: number;
        y: number;
        rotationDeg: number;
        faceDownAllowed: boolean;
    }, {
        id: string;
        label: string;
        meaning: string;
        x: number;
        y: number;
        rotationDeg: number;
        faceDownAllowed: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    slots: {
        id: string;
        label: string;
        meaning: string;
        x: number;
        y: number;
        rotationDeg: number;
        faceDownAllowed: boolean;
    }[];
}, {
    id: string;
    name: string;
    description: string;
    slots: {
        id: string;
        label: string;
        meaning: string;
        x: number;
        y: number;
        rotationDeg: number;
        faceDownAllowed: boolean;
    }[];
}>;
export declare const exerciseSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<["active", "coming_soon"]>;
    scenarioTemplate: z.ZodString;
    bookSummary: z.ZodOptional<z.ZodString>;
    defaultRole: z.ZodEnum<["coach", "client", "co_learner"]>;
    supportedRoles: z.ZodArray<z.ZodEnum<["coach", "client", "co_learner"]>, "many">;
    flowSteps: z.ZodArray<z.ZodString, "many">;
    stepPlan: z.ZodOptional<z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        action: z.ZodEnum<["draw", "manual"]>;
        drawCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        text: string;
        action: "draw" | "manual";
        drawCount: number;
    }, {
        text: string;
        action: "draw" | "manual";
        drawCount: number;
    }>, "many">>;
    rules: z.ZodObject<{
        maxCardsInPlay: z.ZodNumber;
        allowAddNamedCard: z.ZodBoolean;
        allowEditCards: z.ZodBoolean;
        allowRemoveCards: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        maxCardsInPlay: number;
        allowAddNamedCard: boolean;
        allowEditCards: boolean;
        allowRemoveCards: boolean;
    }, {
        maxCardsInPlay: number;
        allowAddNamedCard: boolean;
        allowEditCards: boolean;
        allowRemoveCards: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "active" | "coming_soon";
    title: string;
    scenarioTemplate: string;
    defaultRole: "coach" | "client" | "co_learner";
    supportedRoles: ("coach" | "client" | "co_learner")[];
    flowSteps: string[];
    rules: {
        maxCardsInPlay: number;
        allowAddNamedCard: boolean;
        allowEditCards: boolean;
        allowRemoveCards: boolean;
    };
    bookSummary?: string | undefined;
    stepPlan?: {
        text: string;
        action: "draw" | "manual";
        drawCount: number;
    }[] | undefined;
}, {
    id: string;
    status: "active" | "coming_soon";
    title: string;
    scenarioTemplate: string;
    defaultRole: "coach" | "client" | "co_learner";
    supportedRoles: ("coach" | "client" | "co_learner")[];
    flowSteps: string[];
    rules: {
        maxCardsInPlay: number;
        allowAddNamedCard: boolean;
        allowEditCards: boolean;
        allowRemoveCards: boolean;
    };
    bookSummary?: string | undefined;
    stepPlan?: {
        text: string;
        action: "draw" | "manual";
        drawCount: number;
    }[] | undefined;
}>;
export declare const cardsSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    arcana: z.ZodEnum<["major", "minor"]>;
    suit: z.ZodOptional<z.ZodEnum<["cups", "pentacles", "swords", "wands"]>>;
    rank: z.ZodOptional<z.ZodString>;
    image: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    arcana: "major" | "minor";
    image: string;
    suit?: "cups" | "pentacles" | "swords" | "wands" | undefined;
    rank?: string | undefined;
}, {
    id: string;
    name: string;
    arcana: "major" | "minor";
    image: string;
    suit?: "cups" | "pentacles" | "swords" | "wands" | undefined;
    rank?: string | undefined;
}>, "many">;
export declare const spreadsSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    slots: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        meaning: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
        rotationDeg: z.ZodNumber;
        faceDownAllowed: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        meaning: string;
        x: number;
        y: number;
        rotationDeg: number;
        faceDownAllowed: boolean;
    }, {
        id: string;
        label: string;
        meaning: string;
        x: number;
        y: number;
        rotationDeg: number;
        faceDownAllowed: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    slots: {
        id: string;
        label: string;
        meaning: string;
        x: number;
        y: number;
        rotationDeg: number;
        faceDownAllowed: boolean;
    }[];
}, {
    id: string;
    name: string;
    description: string;
    slots: {
        id: string;
        label: string;
        meaning: string;
        x: number;
        y: number;
        rotationDeg: number;
        faceDownAllowed: boolean;
    }[];
}>, "many">;
export declare const exercisesSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<["active", "coming_soon"]>;
    scenarioTemplate: z.ZodString;
    bookSummary: z.ZodOptional<z.ZodString>;
    defaultRole: z.ZodEnum<["coach", "client", "co_learner"]>;
    supportedRoles: z.ZodArray<z.ZodEnum<["coach", "client", "co_learner"]>, "many">;
    flowSteps: z.ZodArray<z.ZodString, "many">;
    stepPlan: z.ZodOptional<z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        action: z.ZodEnum<["draw", "manual"]>;
        drawCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        text: string;
        action: "draw" | "manual";
        drawCount: number;
    }, {
        text: string;
        action: "draw" | "manual";
        drawCount: number;
    }>, "many">>;
    rules: z.ZodObject<{
        maxCardsInPlay: z.ZodNumber;
        allowAddNamedCard: z.ZodBoolean;
        allowEditCards: z.ZodBoolean;
        allowRemoveCards: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        maxCardsInPlay: number;
        allowAddNamedCard: boolean;
        allowEditCards: boolean;
        allowRemoveCards: boolean;
    }, {
        maxCardsInPlay: number;
        allowAddNamedCard: boolean;
        allowEditCards: boolean;
        allowRemoveCards: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "active" | "coming_soon";
    title: string;
    scenarioTemplate: string;
    defaultRole: "coach" | "client" | "co_learner";
    supportedRoles: ("coach" | "client" | "co_learner")[];
    flowSteps: string[];
    rules: {
        maxCardsInPlay: number;
        allowAddNamedCard: boolean;
        allowEditCards: boolean;
        allowRemoveCards: boolean;
    };
    bookSummary?: string | undefined;
    stepPlan?: {
        text: string;
        action: "draw" | "manual";
        drawCount: number;
    }[] | undefined;
}, {
    id: string;
    status: "active" | "coming_soon";
    title: string;
    scenarioTemplate: string;
    defaultRole: "coach" | "client" | "co_learner";
    supportedRoles: ("coach" | "client" | "co_learner")[];
    flowSteps: string[];
    rules: {
        maxCardsInPlay: number;
        allowAddNamedCard: boolean;
        allowEditCards: boolean;
        allowRemoveCards: boolean;
    };
    bookSummary?: string | undefined;
    stepPlan?: {
        text: string;
        action: "draw" | "manual";
        drawCount: number;
    }[] | undefined;
}>, "many">;
