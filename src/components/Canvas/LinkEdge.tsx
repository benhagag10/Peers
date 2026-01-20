import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import { LINK_TYPE_COLORS } from '../../utils/constants';
import type { LinkType } from '../../types';

export interface LinkEdgeData extends Record<string, unknown> {
  description: string;
  type: LinkType;
  isSelected: boolean;
  parallelIndex: number;
  parallelTotal: number;
  isStreamLink?: boolean;
  isInterestLink?: boolean;
}

// Create a custom curved path with offset for parallel edges
function createCurvedPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number
): { path: string; labelX: number; labelY: number } {
  // Calculate midpoint
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Calculate perpendicular direction
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  // Apply offset to control point (perpendicular to the line)
  const controlX = midX + perpX * offset;
  const controlY = midY + perpY * offset;

  // Create quadratic bezier curve
  const path = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;

  return {
    path,
    labelX: controlX,
    labelY: controlY,
  };
}

function LinkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}: EdgeProps) {
  const edgeData = data as LinkEdgeData;
  const { description, type, isSelected, parallelIndex, parallelTotal, isStreamLink, isInterestLink } = edgeData;

  // Calculate offset for parallel edges (spread them apart)
  const baseOffset = 50; // Base distance between parallel edges
  const offset = parallelTotal > 1
    ? (parallelIndex - (parallelTotal - 1) / 2) * baseOffset
    : 0;

  // Get the curved path
  const { path: edgePath, labelX, labelY } = createCurvedPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    offset
  );

  const color = LINK_TYPE_COLORS[type] || LINK_TYPE_COLORS.other;

  // Different dash patterns for stream vs interest links
  const getDashArray = () => {
    if (isStreamLink) return '8 4'; // longer dashes for stream
    if (isInterestLink) return '4 4'; // shorter, even dashes for interest
    return undefined; // solid for manual links
  };

  const isAutoLink = isStreamLink || isInterestLink;

  return (
    <>
      {/* Glow effect layer */}
      {isSelected && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: color,
            strokeWidth: 8,
            strokeDasharray: getDashArray(),
            opacity: 0.3,
            filter: 'blur(4px)',
          }}
        />
      )}
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: color,
          strokeWidth: isSelected ? 3 : 2,
          strokeDasharray: getDashArray(),
          opacity: isSelected ? 1 : 0.6,
          filter: isSelected ? `drop-shadow(0 0 6px ${color})` : 'none',
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={`
            absolute pointer-events-auto px-2.5 py-1 rounded-lg text-xs font-medium
            max-w-[140px] truncate cursor-pointer
            transition-all duration-300 backdrop-blur-md
            ${isSelected
              ? 'bg-white/15 shadow-[0_0_15px_rgba(0,0,0,0.3)]'
              : 'bg-white/5 hover:bg-white/10'
            }
            ${isAutoLink ? 'italic' : ''}
          `}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
            border: `1px ${isAutoLink ? 'dashed' : 'solid'} ${isSelected ? color : 'rgba(255,255,255,0.2)'}`,
            boxShadow: isSelected ? `0 0 20px ${color}40` : 'none',
          }}
        >
          {description}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(LinkEdge);
