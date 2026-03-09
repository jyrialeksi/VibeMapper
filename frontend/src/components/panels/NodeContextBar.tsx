import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMapStore } from '../../store/useMapStore';
import { Pencil, Trash2 } from 'lucide-react';
import { GLASS_PANEL } from '../../styles/shared';

export function NodeContextBar() {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const setMobileEditingNodeId = useMapStore((s) => s.setMobileEditingNodeId);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const { getNode, flowToScreenPosition } = useReactFlow();

  const screenPos = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = getNode(selectedNodeId);
    if (!node) return null;
    // Position above the node center
    const pos = flowToScreenPosition({
      x: node.position.x + (node.measured?.width ?? 200) / 2,
      y: node.position.y,
    });
    return pos;
  }, [selectedNodeId, getNode, flowToScreenPosition]);

  if (!screenPos) return null;

  return (
    <div
      className={`fixed z-50 ${GLASS_PANEL} rounded-xl shadow-lg flex items-center gap-1 p-1`}
      style={{
        left: screenPos.x,
        top: screenPos.y - 12,
        transform: 'translate(-50%, -100%)',
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
