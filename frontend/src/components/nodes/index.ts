import type { NodeTypes } from '@xyflow/react';
import { ActivityNode } from './ActivityNode';
import { StepNode } from './StepNode';
import { StoryCardNode } from './StoryCardNode';
import { AnnotationNode } from './AnnotationNode';

export const nodeTypes: NodeTypes = {
  activity: ActivityNode,
  step: StepNode,
  storyCard: StoryCardNode,
  annotation: AnnotationNode,
};
