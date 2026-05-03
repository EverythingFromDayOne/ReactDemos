import type { PlacedNode, RoadmapBadge, RoadmapTreeNode } from './roadmap.types';

const STATUS_STROKE: Record<RoadmapTreeNode['status'], string> = {
  done: '#2dd4bf',
  'in-progress': '#f59e0b',
  planned: '#94a3b8',
  skipped: '#ef4444',
};

const BADGE_FILL: Record<RoadmapBadge, string> = {
  NEW: 'rgba(217, 70, 239, 0.25)',
  optional: 'rgba(148, 163, 184, 0.35)',
  recommended: 'rgba(34, 211, 238, 0.22)',
};

const BADGE_STROKE: Record<RoadmapBadge, string> = {
  NEW: '#d946ef',
  optional: '#94a3b8',
  recommended: '#22d3ee',
};

const BADGE_LABEL: Record<RoadmapBadge, string> = {
  NEW: 'New',
  optional: 'Optional',
  recommended: 'Recommended',
};

const XHTML_NS = 'http://www.w3.org/1999/xhtml';

interface Props {
  placed: PlacedNode;
  data: RoadmapTreeNode;
  selected: boolean;
  onActivate: (id: string) => void;
}

export function RoadmapNode({ placed, data, selected, onActivate }: Props) {
  const stroke = STATUS_STROKE[data.status];
  const fill =
    placed.kind === 'spine' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)';
  const b = data.badge;
  const titleClass =
    placed.kind === 'spine'
      ? 'text-sm font-semibold leading-tight text-slate-50'
      : 'text-[13px] font-semibold leading-tight text-slate-50';

  return (
    <g
      style={{ cursor: 'pointer' }}
      onPointerDown={e => {
        e.stopPropagation();
        onActivate(data.id);
      }}
    >
      {selected && (
        <>
          <rect
            x={placed.x - 6}
            y={placed.y - 6}
            width={placed.width + 12}
            height={placed.height + 12}
            rx={placed.rx + 6}
            fill="none"
            stroke={stroke}
            strokeWidth={4}
            opacity={0.35}
            className="animate-pulse"
            pointerEvents="none"
          />
          <rect
            x={placed.x - 3}
            y={placed.y - 3}
            width={placed.width + 6}
            height={placed.height + 6}
            rx={placed.rx + 4}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            pointerEvents="none"
          />
          <rect
            x={placed.x - 1}
            y={placed.y - 1}
            width={placed.width + 2}
            height={placed.height + 2}
            rx={placed.rx + 2}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1}
            opacity={0.9}
            pointerEvents="none"
          />
        </>
      )}

      <rect
        x={placed.x}
        y={placed.y}
        width={placed.width}
        height={placed.height}
        rx={placed.rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />

      <foreignObject
        x={placed.x}
        y={placed.y}
        width={placed.width}
        height={placed.height}
        overflow="visible"
        pointerEvents="none"
      >
        <div
          className="relative box-border h-full w-full select-none"
          style={{ overflow: 'visible' }}
          {...({ xmlns: XHTML_NS } as Record<string, string>)}
        >
          <div
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: stroke }}
          />

          <div className="flex h-full w-full items-center justify-center px-12">
            <span
              className={`${titleClass} min-w-0 w-full truncate text-center`}
              title={data.title}
            >
              {data.title}
            </span>
          </div>

          {b && (
            <div
              className="pointer-events-none absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-semibold leading-none text-slate-100 shadow-sm"
              style={{
                backgroundColor: BADGE_FILL[b],
                border: `1px solid ${BADGE_STROKE[b]}`,
              }}
            >
              {BADGE_LABEL[b]}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}
