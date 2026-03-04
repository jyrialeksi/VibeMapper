import { getStraightPath, type EdgeProps } from '@xyflow/react';

export function LineEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  selected,
}: EdgeProps) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return (
    <path
      id={id}
      d={edgePath}
      style={style}
      className={`react-flow__edge-path ${
        selected ? 'stroke-blue-500' : 'stroke-gray-400'
      }`}
      strokeWidth={selected ? 2.5 : 1.5}
      fill="none"
    />
  );
}
