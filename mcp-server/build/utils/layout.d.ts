import type { ActivityInput, CanvasNode, CanvasEdge } from './schemas.js';
export declare function buildLayout(activities: ActivityInput[]): {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
};
