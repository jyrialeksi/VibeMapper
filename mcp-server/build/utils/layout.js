const PRIORITY_Y = {
    'must-have': 400,
    'should-have': 600,
    'could-have': 800,
    'wont-have': 1000,
};
const H_SPACING = 300;
export function buildLayout(activities) {
    const nodes = [];
    const edges = [];
    let globalStepIndex = 0;
    for (let ai = 0; ai < activities.length; ai++) {
        const act = activities[ai];
        const actN = ai + 1;
        const actId = `activity-${actN}`;
        const steps = act.steps || [];
        // Track where this activity's steps start
        const actStepStart = globalStepIndex;
        const actStepCount = Math.max(steps.length, 1);
        // Activity node positioned at center of its steps
        const actCenterX = (actStepStart + (actStepCount - 1) / 2) * H_SPACING;
        nodes.push({
            id: actId,
            type: 'activity',
            position: { x: actCenterX, y: 0 },
            data: {
                title: act.title,
                description: act.description || '',
                acceptanceCriteria: [],
                cardType: 'activity',
                priority: 'must-have',
            },
        });
        for (let si = 0; si < steps.length; si++) {
            const step = steps[si];
            const stepN = si + 1;
            const stepId = `step-${actN}-${stepN}`;
            const stepX = (globalStepIndex + si) * H_SPACING;
            nodes.push({
                id: stepId,
                type: 'step',
                position: { x: stepX, y: 200 },
                data: {
                    title: step.title,
                    description: step.description || '',
                    acceptanceCriteria: [],
                    cardType: 'step',
                    priority: 'must-have',
                },
            });
            edges.push({
                id: `edge-${actId}-${stepId}`,
                source: actId,
                target: stepId,
                type: 'default',
            });
            // Group stories by priority to handle x-offset for same-priority stories
            const stories = step.stories || [];
            const priorityCounts = {};
            for (let stI = 0; stI < stories.length; stI++) {
                const story = stories[stI];
                const storyN = stI + 1;
                const storyId = `story-${actN}-${stepN}-${storyN}`;
                const priority = story.priority || 'must-have';
                const y = PRIORITY_Y[priority] ?? 400;
                // Offset x for multiple stories with same priority under same step
                const pCount = priorityCounts[priority] || 0;
                priorityCounts[priority] = pCount + 1;
                const storyX = stepX + pCount * H_SPACING;
                const data = {
                    title: story.title,
                    description: story.description || '',
                    acceptanceCriteria: story.acceptanceCriteria || [],
                    cardType: 'story',
                    priority,
                };
                if (story.estimate)
                    data.estimate = story.estimate;
                if (story.status)
                    data.status = story.status;
                nodes.push({
                    id: storyId,
                    type: 'storyCard',
                    position: { x: storyX, y },
                    data,
                });
                edges.push({
                    id: `edge-${stepId}-${storyId}`,
                    source: stepId,
                    target: storyId,
                    type: 'default',
                });
            }
        }
        globalStepIndex += actStepCount;
    }
    return { nodes, edges };
}
//# sourceMappingURL=layout.js.map