import { useMemo } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { useMapStore } from '../../store/useMapStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Pencil, Trash2, MessageCircle } from 'lucide-react';
import { GLASS_PANEL } from '../../styles/shared';

const BAR_HEIGHT = 40;
const TOP_MARGIN = 90;

export function NodeContextBar() {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const setMobileEditingNodeId = useMapStore((s) => s.setMobileEditingNodeId);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const projectRole = useMapStore((s) => s.projectRole);
  const commentCounts = useMapStore((s) => s.commentCounts);
  const { getNode, flowToScreenPosition } = useReactFlow();
  const viewport = useViewport();
  const isMobile = useIsMobile();

  const commentCount = selectedNodeId ? (commentCounts.get(selectedNodeId) || 0) : 0;
  const isViewer = projectRole === 'viewer';

  const position = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = getNode(selectedNodeId);
    if (!node) return null;

    const nodeWidth = node.measured?.width ?? 200;
    const nodeHeight = node.measured?.height ?? 80;

    const topCenter = flowToScreenPosition({
      x: node.position.x + nodeWidth / 2,
      y: node.position.y,
    });

    const placeBelow = topCenter.y - BAR_HEIGHT - 12 < TOP_MARGIN;

    if (placeBelow) {
      const bottomCenter = flowToScreenPosition({
        x: node.position.x + nodeWidth / 2,
        y: node.position.y + nodeHeight,
      });
      return { x: bottomCenter.x, y: bottomCenter.y + 12, below: true };
    }

    return { x: topCenter.x, y: topCenter.y - 12, below: false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, getNode, flowToScreenPosition, viewport.x, viewport.y, viewport.zoom]);

  if (!position) return null;

  const handleEdit = () => {
    if (!selectedNodeId) return;
    if (isMobile) {
      setMobileEditingNodeId(selectedNodeId);
    } else {
      setSelectedNodeId(selectedNodeId);
      setActivePanel('cardEditor');
    }
  };

  const handleComments = () => {
    if (!selectedNodeId) return;
    setActivePanel('comments');
  };

  return (
    <div
      className={`fixed z-50 ${GLASS_PANEL} rounded-xl shadow-lg flex items-center gap-1 p-1`}
      style={{
        left: position.x,
        top: position.y,
        transform: position.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      {!isViewer && (
        <>
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 rounded-lg transition-colors duration-150"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            onClick={() => { if (selectedNodeId) deleteNode(selectedNodeId); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-150"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </>
      )}
      <button
        onClick={handleComments}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 rounded-lg transition-colors duration-150 relative"
      >
        <MessageCircle size={14} />
        Comments
        {commentCount > 0 && (
          <span className="ml-0.5 text-[10px] bg-[#7B2FFF] text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {commentCount}
          </span>
        )}
      </button>
    </div>
  );
}
