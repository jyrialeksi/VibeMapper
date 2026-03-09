import { useMapStore } from '../store/useMapStore';
import { api } from '../api/client';

/**
 * Returns handlers for toggling description and acceptance criteria visibility.
 * Persists visibility changes to the backend for non-viewer users.
 */
export function useVisibilityToggle() {
  const showDescriptions = useMapStore((s) => s.showDescriptions);
  const showAcceptanceCriteria = useMapStore((s) => s.showAcceptanceCriteria);
  const toggleShowDescriptions = useMapStore((s) => s.toggleShowDescriptions);
  const toggleShowAcceptanceCriteria = useMapStore((s) => s.toggleShowAcceptanceCriteria);
  const projectId = useMapStore((s) => s.projectId);
  const projectRole = useMapStore((s) => s.projectRole);
  const isViewer = projectRole === 'viewer';

  const handleToggleDescriptions = () => {
    toggleShowDescriptions();
    if (!isViewer && projectId) {
      const next = !showDescriptions;
      api.saveVisibility(projectId, next, showAcceptanceCriteria).catch(console.error);
    }
  };

  const handleToggleAC = () => {
    toggleShowAcceptanceCriteria();
    if (!isViewer && projectId) {
      const next = !showAcceptanceCriteria;
      api.saveVisibility(projectId, showDescriptions, next).catch(console.error);
    }
  };

  return {
    showDescriptions,
    showAcceptanceCriteria,
    handleToggleDescriptions,
    handleToggleAC,
  };
}
