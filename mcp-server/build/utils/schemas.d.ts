import { z } from 'zod';
export declare const CardStatus: z.ZodEnum<["not-started", "in-progress", "blocked", "testing", "done"]>;
export type CardStatus = z.infer<typeof CardStatus>;
export declare const Priority: z.ZodEnum<["must-have", "should-have", "could-have", "wont-have"]>;
export type Priority = z.infer<typeof Priority>;
export declare const StoryInputSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["must-have", "should-have", "could-have", "wont-have"]>>>;
    estimate: z.ZodOptional<z.ZodString>;
    acceptanceCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodOptional<z.ZodEnum<["not-started", "in-progress", "blocked", "testing", "done"]>>;
}, "strip", z.ZodTypeAny, {
    priority: "must-have" | "should-have" | "could-have" | "wont-have";
    title: string;
    description?: string | undefined;
    status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
    estimate?: string | undefined;
    acceptanceCriteria?: string[] | undefined;
}, {
    title: string;
    priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
    description?: string | undefined;
    status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
    estimate?: string | undefined;
    acceptanceCriteria?: string[] | undefined;
}>;
export declare const StepInputSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    stories: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["must-have", "should-have", "could-have", "wont-have"]>>>;
        estimate: z.ZodOptional<z.ZodString>;
        acceptanceCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        status: z.ZodOptional<z.ZodEnum<["not-started", "in-progress", "blocked", "testing", "done"]>>;
    }, "strip", z.ZodTypeAny, {
        priority: "must-have" | "should-have" | "could-have" | "wont-have";
        title: string;
        description?: string | undefined;
        status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
        estimate?: string | undefined;
        acceptanceCriteria?: string[] | undefined;
    }, {
        title: string;
        priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
        description?: string | undefined;
        status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
        estimate?: string | undefined;
        acceptanceCriteria?: string[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description?: string | undefined;
    stories?: {
        priority: "must-have" | "should-have" | "could-have" | "wont-have";
        title: string;
        description?: string | undefined;
        status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
        estimate?: string | undefined;
        acceptanceCriteria?: string[] | undefined;
    }[] | undefined;
}, {
    title: string;
    description?: string | undefined;
    stories?: {
        title: string;
        priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
        description?: string | undefined;
        status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
        estimate?: string | undefined;
        acceptanceCriteria?: string[] | undefined;
    }[] | undefined;
}>;
export declare const ActivityInputSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        stories: z.ZodOptional<z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["must-have", "should-have", "could-have", "wont-have"]>>>;
            estimate: z.ZodOptional<z.ZodString>;
            acceptanceCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            status: z.ZodOptional<z.ZodEnum<["not-started", "in-progress", "blocked", "testing", "done"]>>;
        }, "strip", z.ZodTypeAny, {
            priority: "must-have" | "should-have" | "could-have" | "wont-have";
            title: string;
            description?: string | undefined;
            status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
            estimate?: string | undefined;
            acceptanceCriteria?: string[] | undefined;
        }, {
            title: string;
            priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
            description?: string | undefined;
            status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
            estimate?: string | undefined;
            acceptanceCriteria?: string[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description?: string | undefined;
        stories?: {
            priority: "must-have" | "should-have" | "could-have" | "wont-have";
            title: string;
            description?: string | undefined;
            status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
            estimate?: string | undefined;
            acceptanceCriteria?: string[] | undefined;
        }[] | undefined;
    }, {
        title: string;
        description?: string | undefined;
        stories?: {
            title: string;
            priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
            description?: string | undefined;
            status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
            estimate?: string | undefined;
            acceptanceCriteria?: string[] | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description?: string | undefined;
    steps?: {
        title: string;
        description?: string | undefined;
        stories?: {
            priority: "must-have" | "should-have" | "could-have" | "wont-have";
            title: string;
            description?: string | undefined;
            status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
            estimate?: string | undefined;
            acceptanceCriteria?: string[] | undefined;
        }[] | undefined;
    }[] | undefined;
}, {
    title: string;
    description?: string | undefined;
    steps?: {
        title: string;
        description?: string | undefined;
        stories?: {
            title: string;
            priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
            description?: string | undefined;
            status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
            estimate?: string | undefined;
            acceptanceCriteria?: string[] | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const CreateStoryMapInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    activities: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            stories: z.ZodOptional<z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["must-have", "should-have", "could-have", "wont-have"]>>>;
                estimate: z.ZodOptional<z.ZodString>;
                acceptanceCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                status: z.ZodOptional<z.ZodEnum<["not-started", "in-progress", "blocked", "testing", "done"]>>;
            }, "strip", z.ZodTypeAny, {
                priority: "must-have" | "should-have" | "could-have" | "wont-have";
                title: string;
                description?: string | undefined;
                status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
                estimate?: string | undefined;
                acceptanceCriteria?: string[] | undefined;
            }, {
                title: string;
                priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
                description?: string | undefined;
                status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
                estimate?: string | undefined;
                acceptanceCriteria?: string[] | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            description?: string | undefined;
            stories?: {
                priority: "must-have" | "should-have" | "could-have" | "wont-have";
                title: string;
                description?: string | undefined;
                status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
                estimate?: string | undefined;
                acceptanceCriteria?: string[] | undefined;
            }[] | undefined;
        }, {
            title: string;
            description?: string | undefined;
            stories?: {
                title: string;
                priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
                description?: string | undefined;
                status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
                estimate?: string | undefined;
                acceptanceCriteria?: string[] | undefined;
            }[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description?: string | undefined;
        steps?: {
            title: string;
            description?: string | undefined;
            stories?: {
                priority: "must-have" | "should-have" | "could-have" | "wont-have";
                title: string;
                description?: string | undefined;
                status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
                estimate?: string | undefined;
                acceptanceCriteria?: string[] | undefined;
            }[] | undefined;
        }[] | undefined;
    }, {
        title: string;
        description?: string | undefined;
        steps?: {
            title: string;
            description?: string | undefined;
            stories?: {
                title: string;
                priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
                description?: string | undefined;
                status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
                estimate?: string | undefined;
                acceptanceCriteria?: string[] | undefined;
            }[] | undefined;
        }[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    activities: {
        title: string;
        description?: string | undefined;
        steps?: {
            title: string;
            description?: string | undefined;
            stories?: {
                priority: "must-have" | "should-have" | "could-have" | "wont-have";
                title: string;
                description?: string | undefined;
                status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
                estimate?: string | undefined;
                acceptanceCriteria?: string[] | undefined;
            }[] | undefined;
        }[] | undefined;
    }[];
    description?: string | undefined;
}, {
    name: string;
    activities: {
        title: string;
        description?: string | undefined;
        steps?: {
            title: string;
            description?: string | undefined;
            stories?: {
                title: string;
                priority?: "must-have" | "should-have" | "could-have" | "wont-have" | undefined;
                description?: string | undefined;
                status?: "not-started" | "in-progress" | "blocked" | "testing" | "done" | undefined;
                estimate?: string | undefined;
                acceptanceCriteria?: string[] | undefined;
            }[] | undefined;
        }[] | undefined;
    }[];
    description?: string | undefined;
}>;
export type StoryInput = z.infer<typeof StoryInputSchema>;
export type StepInput = z.infer<typeof StepInputSchema>;
export type ActivityInput = z.infer<typeof ActivityInputSchema>;
export type CreateStoryMapInput = z.infer<typeof CreateStoryMapInputSchema>;
export interface CanvasNode {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: Record<string, unknown>;
}
export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    type: string;
}
export interface CanvasState {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    viewport: {
        x: number;
        y: number;
        zoom: number;
    };
}
