import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMapStore } from '../../store/useMapStore';
import { Pencil, Trash2 } from 'lucide-react';
import { GLASS_PANEL } from '../../styles/shared';

const BAR_HEIGHT = 40; // approximate height of the context bar
const TOP_MARGIN = 90; // clearance for the top nav/toolbar area

export function NodeContextBar() {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const setMobileEditingNodeId = useMapStore((s) => s.setMobileEditingNodeId);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const { getNode, flowToScreenPosition } = useReactFlow();

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

    // If placing above would be hidden under the top bar, place below instead
    const placeBelow = topCenter.y - BAR_HEIGHT - 12 < TOP_MARGIN;

    if (placeBelow) {
      const bottomCenter = flowToScreenPosition({
        x: node.position.x + nodeWidth / 2,
        y: node.position.y + nodeHeight,
      });
      return { x: bottomCenter.x, y: bottomCenter.y + 12, below: true };
    }

    return { x: topCenter.x, y: topCenter.y - 12, below: false };
  }, [selectedNodeId, getNode, flowToScreenPosition]);

  if (!position) return null;

  return (
    <div
      className={`fixed z-50 ${GLASS_PANEL} rounded-xl shadow-lg flex items-center gap-1 p-1`}
      style={{
        left: position.x,
        top: position.y,
        transform: position.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      <button
        onClick={() => {
          if (selectedNodeId) setMobileEditingNodeId(selectedNodeId);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 rounded-lg transition-colors duration-150"
      >
        <Pencil size={14} />
        Edit
      </button>
      <button
        onClick={() => {
          if (selectedNodeId) deleteNode(selectedNodeId);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-150"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
}
