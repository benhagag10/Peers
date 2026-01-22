import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getInitials, getAvatarColor } from '../../utils/avatar';

export interface PersonNodeData extends Record<string, unknown> {
  name: string;
  affiliations?: string[];
  photoUrl?: string;
  isSelected: boolean;
}

function PersonNode({ data }: NodeProps) {
  const { name, affiliations, photoUrl, isSelected } = data as PersonNodeData;
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <div
      className={`
        relative flex flex-col items-center p-4 rounded-2xl
        transition-all duration-300 ease-out
        ${isSelected
          ? 'bg-white/10 backdrop-blur-xl border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.4)]'
          : 'bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]'
        }
      `}
    >
      {/* Glow effect behind when selected */}
      {isSelected && (
        <div className="absolute inset-0 -z-10 rounded-2xl bg-indigo-500/20 blur-xl animate-pulse" />
      )}

      {/* Connection handles - styled for dark theme */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-indigo-400 !w-2.5 !h-2.5 !border-2 !border-gray-900 hover:!bg-indigo-300 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-400 !w-2.5 !h-2.5 !border-2 !border-gray-900 hover:!bg-indigo-300 transition-colors"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-indigo-400 !w-2.5 !h-2.5 !border-2 !border-gray-900 hover:!bg-indigo-300 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-indigo-400 !w-2.5 !h-2.5 !border-2 !border-gray-900 hover:!bg-indigo-300 transition-colors"
      />

      {/* Avatar with glow ring */}
      <div className="relative">
        <div
          className={`
            absolute inset-0 rounded-full blur-md transition-opacity duration-300
            ${isSelected ? 'opacity-60' : 'opacity-0'}
          `}
          style={{ backgroundColor: bgColor }}
        />
        <div
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center
            text-white font-semibold text-lg overflow-hidden
            ring-2 ring-white/20 transition-all duration-300
            ${isSelected ? 'ring-indigo-400/50 scale-105' : 'hover:ring-white/30'}
          `}
          style={{ backgroundColor: photoUrl ? 'transparent' : bgColor }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.style.backgroundColor = bgColor;
                e.currentTarget.parentElement!.innerHTML = initials;
              }}
            />
          ) : (
            initials
          )}
        </div>
      </div>

      {/* Name with gradient on selection */}
      <div
        className={`
          mt-3 text-sm font-semibold text-center max-w-[120px] truncate transition-colors duration-300
          ${isSelected ? 'text-white' : 'text-white/80'}
        `}
      >
        {name}
      </div>

      {/* Affiliations */}
      {affiliations && affiliations.length > 0 && (
        <div className="text-xs text-white/50 text-center max-w-[120px] truncate mt-0.5">
          {affiliations[0]}
          {affiliations.length > 1 && (
            <span className="text-indigo-400/70"> +{affiliations.length - 1}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(PersonNode);
