import { z } from 'zod';

export const CardStatus = z.enum(['not-started', 'in-progress', 'blocked', 'testing', 'done']);
export type CardStatus = z.infer<typeof CardStatus>;

export const Priority = z.enum(['must-have', 'should-have', 'could-have', 'wont-have']);
export type Priority = z.infer<typeof Priority>;

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

export type StoryInput = z.infer<typeof StoryInputSchema>;
export type StepInput = z.infer<typeof StepInputSchema>;
export type ActivityInput = z.infer<typeof ActivityInputSchema>;
export type CreateStoryMapInput = z.infer<typeof CreateStoryMapInputSchema>;

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
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
  viewport: { x: number; y: number; zoom: number };
}
