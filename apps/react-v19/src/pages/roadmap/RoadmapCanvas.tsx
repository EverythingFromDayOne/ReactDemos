import type { RoadmapLayout, RoadmapTreeNode } from './roadmap.types';
import { RoadmapNode } from './RoadmapNode';

interface Props {
  layout: RoadmapLayout;
  nodeById: Map<string, RoadmapTreeNode>;
  selectedId: string | null;
  panX: number;
  panY: number;
  zoom: number;
  onActivateNode: (id: string) => void;
  onPanZoom: (next: { panX: number; panY: number; zoom: number }) => void;
}

/** Chevron arm half-width (world units); V depth (world units) — kept modest so zoom scales shape; stroke uses non-scaling-stroke. */
const V_ARM = 5.5;
const V_DROP = 9;
const GAP_MARGIN = 5;

function computeSpineArrowDrawings(layout: RoadmapLayout) {
  const spines = layout.nodes.filter(n => n.kind === 'spine').sort((a, b) => a.y - b.y);
  const drawings: {
    key: string;
    stem: { x1: number; y1: number; x2: number; y2: number } | null;
    left: { x1: number; y1: number; x2: number; y2: number };
    right: { x1: number; y1: number; x2: number; y2: number };
  }[] = [];

  for (let i = 0; i < spines.length - 1; i++) {
    const s0 = spines[i]!;
    const s1 = spines[i + 1]!;
    const nextTop = s1.y;
    const bottoms = layout.nodes
      .filter(n => n.y + n.height <= nextTop - 0.5)
      .map(n => n.y + n.height);
    const prevBottom = Math.max(s0.y + s0.height, bottoms.length > 0 ? Math.max(...bottoms) : s0.y + s0.height);
    const cx = s0.x + s0.width / 2;

    const gapTop = prevBottom + GAP_MARGIN;
    const gapBottom = nextTop - GAP_MARGIN;
    const innerH = gapBottom - gapTop;

    let yTip: number;
    let yCrook: number;
    let arm = V_ARM;

    if (innerH >= V_DROP + 8) {
      yTip = gapBottom;
      yCrook = yTip - V_DROP;
      const minCrook = gapTop + 2;
      if (yCrook < minCrook) {
        yCrook = minCrook;
        yTip = Math.min(gapBottom, yCrook + V_DROP);
      }
    } else {
      const mid = (gapTop + gapBottom) / 2;
      const half = Math.max(2, Math.min(V_DROP / 2, innerH * 0.38));
      yCrook = mid - half;
      yTip = mid + half;
      arm = Math.min(V_ARM, half * 0.85);
    }

    const stemTop = gapTop + 2;
    const stemBottom = yCrook;
    const stem =
      stemBottom - stemTop > 3
        ? { x1: cx, y1: stemTop, x2: cx, y2: stemBottom }
        : null;

    drawings.push({
      key: `ar-${s0.id}-${s1.id}`,
      stem,
      left: { x1: cx - arm, y1: yCrook, x2: cx, y2: yTip },
      right: { x1: cx + arm, y1: yCrook, x2: cx, y2: yTip },
    });
  }

  return drawings;
}

function svgClientPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const inv = svg.getScreenCTM()?.inverse();
  if (!inv) return { x: clientX, y: clientY };
  const p = pt.matrixTransform(inv);
  return { x: p.x, y: p.y };
}

export function RoadmapCanvas({
  layout,
  nodeById,
  selectedId,
  panX,
  panY,
  zoom,
  onActivateNode,
  onPanZoom,
}: Props) {
  const lineStroke = '#475569';
  const arrowStroke = '#64748b';
  const arrowDrawings = computeSpineArrowDrawings(layout);

  return (
    <svg
      className="h-full w-full touch-none bg-slate-950 select-none"
      role="img"
      aria-label="Learning roadmap graph"
      onPointerDown={e => {
        if (e.target !== e.currentTarget) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        (e.currentTarget as SVGSVGElement & { _pan?: { x: number; y: number } })._pan = {
          x: e.clientX,
          y: e.clientY,
        };
      }}
      onPointerMove={e => {
        const svg = e.currentTarget;
        const st = (svg as SVGSVGElement & { _pan?: { x: number; y: number } })._pan;
        if (!st || !svg.hasPointerCapture(e.pointerId)) return;
        const dx = e.clientX - st.x;
        const dy = e.clientY - st.y;
        st.x = e.clientX;
        st.y = e.clientY;
        onPanZoom({ panX: panX + dx, panY: panY + dy, zoom });
      }}
      onPointerUp={e => {
        const svg = e.currentTarget;
        if (svg.hasPointerCapture(e.pointerId)) {
          svg.releasePointerCapture(e.pointerId);
        }
        delete (svg as SVGSVGElement & { _pan?: unknown })._pan;
      }}
      onPointerCancel={e => {
        const svg = e.currentTarget;
        if (svg.hasPointerCapture(e.pointerId)) {
          svg.releasePointerCapture(e.pointerId);
        }
        delete (svg as SVGSVGElement & { _pan?: unknown })._pan;
      }}
      onWheel={e => {
        e.preventDefault();
        const svg = e.currentTarget;
        const { x: sx, y: sy } = svgClientPoint(svg, e.clientX, e.clientY);
        const wx = (sx - panX) / zoom;
        const wy = (sy - panY) / zoom;
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        const newZoom = Math.min(2.8, Math.max(0.4, zoom * factor));
        onPanZoom({
          zoom: newZoom,
          panX: sx - wx * newZoom,
          panY: sy - wy * newZoom,
        });
      }}
    >
      <g transform={`translate(${panX},${panY}) scale(${zoom})`}>
        {layout.lines.map((l, i) => (
          <line
            key={`ln-${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={lineStroke}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {arrowDrawings.map(d => (
          <g key={d.key} stroke={arrowStroke} strokeWidth={1.75} strokeLinecap="round">
            {d.stem && (
              <line
                x1={d.stem.x1}
                y1={d.stem.y1}
                x2={d.stem.x2}
                y2={d.stem.y2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <line
              x1={d.left.x1}
              y1={d.left.y1}
              x2={d.left.x2}
              y2={d.left.y2}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={d.right.x1}
              y1={d.right.y1}
              x2={d.right.x2}
              y2={d.right.y2}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}

        {layout.nodes.map(placed => {
          const data = nodeById.get(placed.id);
          if (!data) return null;
          return (
            <RoadmapNode
              key={placed.id}
              placed={placed}
              data={data}
              selected={selectedId === placed.id}
              onActivate={onActivateNode}
            />
          );
        })}
      </g>
    </svg>
  );
}
