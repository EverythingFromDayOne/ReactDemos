import type { ReactNode } from 'react';
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

const BADGE_W: Record<RoadmapBadge, number> = {
  NEW: 34,
  optional: 52,
  recommended: 82,
};

const BADGE_H = 14;
const BADGE_INSET = 7;
/** When a badge exists, shift title down so it clears the badge row */
const TITLE_SHIFT_WITH_BADGE = 9;

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
  const textFill = '#cbd5e1';
  const hasBadge = Boolean(data.badge);
  const dotCx = placed.x + 11;
  const dotCy = placed.y + placed.height / 2;
  const textX = placed.x + placed.width / 2 + 6;
  const textY =
    placed.y + placed.height / 2 + (hasBadge ? TITLE_SHIFT_WITH_BADGE : 0);
  const padX = 14;
  const badgeReserve = hasBadge ? BADGE_W[data.badge!] + BADGE_INSET * 2 + 6 : 10;
  const maxTextWidth = placed.width - padX * 2 - badgeReserve;

  let badgeMarkup: ReactNode = null;
  if (data.badge) {
    const b = data.badge;
    const bw = Math.min(BADGE_W[b], placed.width - BADGE_INSET * 2 - 4);
    const bx = placed.x + placed.width - BADGE_INSET - bw;
    const by = placed.y + BADGE_INSET;
    badgeMarkup = (
      <g pointerEvents="none">
        <rect
          x={bx}
          y={by}
          width={bw}
          height={BADGE_H}
          rx={3}
          fill={BADGE_FILL[b]}
          stroke={BADGE_STROKE[b]}
          strokeWidth={1}
        />
        <text
          x={bx + bw / 2}
          y={by + BADGE_H / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e2e8f0"
          fontSize={b === 'recommended' ? 7.5 : 8.5}
          fontWeight={600}
          fontFamily="system-ui, sans-serif"
          letterSpacing={0}
        >
          {BADGE_LABEL[b]}
        </text>
      </g>
    );
  }

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
        strokeWidth={1.5}
      />

      <circle cx={dotCx} cy={dotCy} r={5} fill={stroke} pointerEvents="none" />

      {badgeMarkup}

      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textFill}
        fontSize={placed.kind === 'spine' ? 13 : 12}
        fontWeight={500}
        fontFamily="system-ui, sans-serif"
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {truncateTitle(data.title, maxTextWidth, placed.kind === 'spine' ? 13 : 12)}
      </text>
    </g>
  );
}

function truncateTitle(title: string, maxPx: number, fontSize: number): string {
  const approxChar = fontSize * 0.52;
  const maxChars = Math.max(4, Math.floor(maxPx / approxChar));
  if (title.length <= maxChars) return title;
  return `${title.slice(0, maxChars - 1)}…`;
}
