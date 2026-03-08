import { z } from 'zod';
export const CardStatus = z.enum(['not-started', 'in-progress', 'blocked', 'testing', 'done']);
export const Priority = z.enum(['must-have', 'should-have', 'could-have', 'wont-have']);
export const StoryInputSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: Priority.optional().default('must-have'),
    estimate: z.string().optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
    status: CardStatus.optional(),
});
export const StepInputSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    stories: z.array(StoryInputSchema).optional(),
});
export const ActivityInputSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    steps: z.array(StepInputSchema).optional(),
});
export const CreateStoryMapInputSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    activities: z.array(ActivityInputSchema),
});
//# sourceMappingURL=schemas.js.map