import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';

describe('Comment counts store', () => {
  beforeEach(() => {
    useMapStore.setState({
      commentCounts: new Map(),
      nodes: [],
      edges: [],
    });
  });

  it('commentCounts starts empty', () => {
    expect(useMapStore.getState().commentCounts.size).toBe(0);
  });

  it('setCommentCount sets count for a nodeId', () => {
    useMapStore.getState().setCommentCount('node-1', 5);
    expect(useMapStore.getState().commentCounts.get('node-1')).toBe(5);
  });

  it('setCommentCount removes entry when count is 0', () => {
    useMapStore.getState().setCommentCount('node-1', 5);
    useMapStore.getState().setCommentCount('node-1', 0);
    expect(useMapStore.getState().commentCounts.has('node-1')).toBe(false);
  });

  it('incrementCommentCount works', () => {
    useMapStore.getState().incrementCommentCount('node-1');
    expect(useMapStore.getState().commentCounts.get('node-1')).toBe(1);
    useMapStore.getState().incrementCommentCount('node-1');
    expect(useMapStore.getState().commentCounts.get('node-1')).toBe(2);
  });

  it('decrementCommentCount works', () => {
    useMapStore.getState().setCommentCount('node-1', 3);
    useMapStore.getState().decrementCommentCount('node-1');
    expect(useMapStore.getState().commentCounts.get('node-1')).toBe(2);
  });

  it('decrementCommentCount removes at zero', () => {
    useMapStore.getState().setCommentCount('node-1', 1);
    useMapStore.getState().decrementCommentCount('node-1');
    expect(useMapStore.getState().commentCounts.has('node-1')).toBe(false);
  });

  it('startLoadingProject clears commentCounts', () => {
    useMapStore.getState().setCommentCount('node-1', 5);
    useMapStore.getState().startLoadingProject('new-project');
    expect(useMapStore.getState().commentCounts.size).toBe(0);
  });

  it('setCommentCounts replaces the whole map', () => {
    const counts = new Map([['n1', 3], ['n2', 7]]);
    useMapStore.getState().setCommentCounts(counts);
    expect(useMapStore.getState().commentCounts.get('n1')).toBe(3);
    expect(useMapStore.getState().commentCounts.get('n2')).toBe(7);
  });
});
