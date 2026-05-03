import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RoadmapData, RoadmapTreeNode } from './roadmap.types';
import { computeRoadmapLayout } from './roadmap-layout';
import { RoadmapCanvas } from './RoadmapCanvas';
import { RoadmapDetailPanel } from './RoadmapDetailPanel';

function svgClientToRoot(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const inv = svg.getScreenCTM()?.inverse();
  if (!inv) return { x: clientX, y: clientY };
  const p = pt.matrixTransform(inv);
  return { x: p.x, y: p.y };
}

function indexNodes(root: RoadmapTreeNode[]): Map<string, RoadmapTreeNode> {
  const m = new Map<string, RoadmapTreeNode>();
  const walk = (n: RoadmapTreeNode) => {
    m.set(n.id, n);
    (n.children ?? []).forEach(walk);
  };
  root.forEach(walk);
  return m;
}

/** Top of first spine node in world space — anchor for “start from top” framing */
function firstSpineTopY(layout: { nodes: { kind: string; y: number }[] }): number {
  const spines = layout.nodes.filter(n => n.kind === 'spine').sort((a, b) => a.y - b.y);
  return spines[0]?.y ?? 0;
}

/** Pan so the graph is horizontally centered and the first spine sits near the top of the viewport */
function topAlignedPan(
  layout: NonNullable<ReturnType<typeof computeRoadmapLayout>>,
  viewportW: number,
  zoom: number,
  topPadding = 20,
) {
  const cx = (layout.bounds.minX + layout.bounds.maxX) / 2;
  const topY = firstSpineTopY(layout);
  return {
    panX: viewportW / 2 - cx * zoom,
    panY: topPadding - topY * zoom,
  };
}

export default function RoadmapPage() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(0.9);
  const mainRef = useRef<HTMLDivElement>(null);
  const centeredRef = useRef(false);

  useEffect(() => {
    fetch('/assets/react-roadmap.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const nodeById = useMemo(() => (data ? indexNodes(data.spine) : new Map()), [data]);

  const layout = useMemo(
    () => (data ? computeRoadmapLayout(data.spine) : null),
    [data],
  );

  const selectedNode = selectedId ? nodeById.get(selectedId) ?? null : null;

  const childTitles = useMemo(() => {
    if (!selectedNode?.children?.length) return [];
    return selectedNode.children.map((c: RoadmapTreeNode) => ({ id: c.id, title: c.title }));
  }, [selectedNode]);

  useLayoutEffect(() => {
    if (!layout || !mainRef.current || centeredRef.current) return;
    const el = mainRef.current;
    const apply = () => {
      const w = el.clientWidth;
      if (w === 0) {
        requestAnimationFrame(apply);
        return;
      }
      const z = 0.9;
      setZoom(z);
      const { panX: px, panY: py } = topAlignedPan(layout, w, z);
      setPanX(px);
      setPanY(py);
      centeredRef.current = true;
    };
    apply();
  }, [layout]);

  const onActivateNode = useCallback(
    (id: string) => {
      setSelectedId(prev => (prev === id ? null : id));
    },
    [],
  );

  const onPanZoom = useCallback((next: { panX: number; panY: number; zoom: number }) => {
    setPanX(next.panX);
    setPanY(next.panY);
    setZoom(next.zoom);
  }, []);

  const resetView = useCallback(() => {
    if (!layout || !mainRef.current) return;
    const el = mainRef.current;
    const w = el.clientWidth;
    const z = 1;
    setZoom(z);
    const { panX: px, panY: py } = topAlignedPan(layout, w, z);
    setPanX(px);
    setPanY(py);
  }, [layout]);

  const zoomBy = useCallback(
    (factor: number) => {
      if (!mainRef.current) return;
      const el = mainRef.current;
      const svg = el.querySelector('svg');
      if (!(svg instanceof SVGSVGElement)) return;
      const r = svg.getBoundingClientRect();
      const { x: sx, y: sy } = svgClientToRoot(svg, r.left + r.width / 2, r.top + r.height / 2);
      const wx = (sx - panX) / zoom;
      const wy = (sy - panY) / zoom;
      const newZoom = Math.min(2.8, Math.max(0.4, zoom * factor));
      setZoom(newZoom);
      setPanX(sx - wx * newZoom);
      setPanY(sy - wy * newZoom);
    },
    [panX, panY, zoom],
  );

  if (!data || !layout) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <span className="text-sm text-slate-500">Loading roadmap…</span>
      </div>
    );
  }

  const detailOpen = Boolean(selectedNode);

  return (
    <div className="relative flex h-screen flex-col bg-slate-950">
      <header
        className={`shrink-0 border-b border-slate-800 bg-slate-950 px-6 py-3 transition-[padding] duration-150 ${
          detailOpen ? 'pr-[calc(360px+1.5rem)]' : ''
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white">React learning path</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Drag to pan · Scroll to zoom · Click a node for details
            </p>
          </div>
          <button
            type="button"
            onClick={resetView}
            className="shrink-0 rounded-md border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Reset view
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-6 border-t border-slate-800/80 pt-3">
          {(
            [
              { label: 'Done', color: '#2dd4bf' },
              { label: 'In-progress', color: '#f59e0b' },
              { label: 'Planned', color: '#94a3b8' },
              { label: 'Skipped', color: '#ef4444' },
            ] as const
          ).map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div ref={mainRef} className="relative min-h-0 flex-1">
        <RoadmapCanvas
          layout={layout}
          nodeById={nodeById}
          selectedId={selectedId}
          panX={panX}
          panY={panY}
          zoom={zoom}
          onActivateNode={onActivateNode}
          onPanZoom={onPanZoom}
        />

        <div
          className={`pointer-events-none absolute bottom-6 z-20 flex flex-col gap-2 ${detailOpen ? 'right-[calc(360px+1rem)]' : 'right-4'}`}
        >
          <div className="pointer-events-auto flex flex-col gap-1 rounded-lg border border-slate-700 bg-slate-900/95 p-1 shadow-lg">
            <button
              type="button"
              className="rounded px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              onClick={() => zoomBy(1.12)}
            >
              +
            </button>
            <button
              type="button"
              className="rounded px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
              onClick={resetView}
            >
              1:1
            </button>
            <button
              type="button"
              className="rounded px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              onClick={() => zoomBy(1 / 1.12)}
            >
              −
            </button>
          </div>
        </div>
      </div>

      {selectedNode && (
        <RoadmapDetailPanel
          node={selectedNode}
          childTitles={childTitles}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
