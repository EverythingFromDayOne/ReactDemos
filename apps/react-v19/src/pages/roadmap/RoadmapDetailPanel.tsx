import { useNavigate } from 'react-router-dom';
import type { RoadmapBadge, RoadmapTreeNode } from './roadmap.types';

const STATUS_PANEL: Record<
  RoadmapTreeNode['status'],
  { label: string; dot: string; pillClass: string }
> = {
  done: {
    label: 'Done',
    dot: 'bg-teal-400',
    pillClass:
      'border border-teal-400/60 bg-teal-950/80 text-teal-100',
  },
  'in-progress': {
    label: 'In-progress',
    dot: 'bg-amber-400',
    pillClass:
      'border border-amber-400/60 bg-amber-950/80 text-amber-100',
  },
  planned: {
    label: 'Planned',
    dot: 'bg-slate-400',
    pillClass:
      'border border-slate-500/60 bg-slate-900/90 text-slate-200',
  },
  skipped: {
    label: 'Skipped',
    dot: 'bg-red-500',
    pillClass:
      'border border-red-500/60 bg-red-950/80 text-red-100',
  },
};

const BADGE_PANEL: Record<RoadmapBadge, string> = {
  NEW: 'border-fuchsia-500/50 bg-fuchsia-950/60 text-fuchsia-200',
  optional: 'border-slate-500/50 bg-slate-800/80 text-slate-200',
  recommended: 'border-cyan-500/50 bg-cyan-950/60 text-cyan-100',
};

const BADGE_LABEL: Record<RoadmapBadge, string> = {
  NEW: 'New',
  optional: 'Optional',
  recommended: 'Recommended',
};

interface Props {
  node: RoadmapTreeNode;
  childTitles: { id: string; title: string }[];
  onClose: () => void;
}

export function RoadmapDetailPanel({ node, childTitles, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <aside className="fixed right-0 top-0 z-30 flex h-screen w-[360px] shrink-0 flex-col border-l border-slate-700 bg-slate-900/95 p-6 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-slate-500">Roadmap node</p>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 rounded p-1 text-2xl leading-none text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      <h2 className="mt-1 text-xl font-semibold text-white">{node.title}</h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${STATUS_PANEL[node.status].pillClass}`}
        >
          <span className={`h-2 w-2 rounded-full ${STATUS_PANEL[node.status].dot}`} />
          {STATUS_PANEL[node.status].label}
        </span>
        {node.badge && (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE_PANEL[node.badge]}`}
          >
            {BADGE_LABEL[node.badge]}
          </span>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">{node.description}</p>

      <div className="mt-8">
        <h3 className="text-xs font-semibold tracking-wide text-slate-500">Children</h3>
        {childTitles.length > 0 ? (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
            {childTitles.map(c => (
              <li key={c.id}>{c.title}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No branch children.</p>
        )}
      </div>

      {node.route && (
        <button
          type="button"
          onClick={() => navigate(node.route!)}
          className="mt-auto rounded-lg bg-fuchsia-600/90 px-4 py-2.5 text-sm font-medium text-white hover:bg-fuchsia-500"
        >
          Open demo →
        </button>
      )}
    </aside>
  );
}
