import { useEffect, useMemo, useRef } from 'react';

export type LogEntry = {
  timestamp: number;
  source: 'v16' | 'v19';
  hook: string;
};

type LifecycleEventLogProps = {
  entries: LogEntry[];
  onClear: () => void;
};

export function LifecycleEventLog({ entries, onClear }: LifecycleEventLogProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollerRef.current) return;
    // Newest entries are rendered first, so keep viewport pinned to the top.
    scrollerRef.current.scrollTop = 0;
  }, [entries]);

  const baselineTimestamp = useMemo(() => {
    if (entries.length === 0) return 0;
    return entries[entries.length - 1].timestamp;
  }, [entries]);

  return (
    <section className="min-h-0 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Lifecycle event log</h3>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-slate-600"
        >
          Clear log
        </button>
      </div>

      <div ref={scrollerRef} className="h-48 overflow-auto rounded-md border border-slate-800 bg-slate-950/70">
        {entries.length === 0 ? (
          <p className="p-3 text-xs text-slate-500">No lifecycle events yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {entries.map((entry, index) => (
              <li key={`${entry.source}-${entry.hook}-${entry.timestamp}-${index}`} className="px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">+{entry.timestamp - baselineTimestamp}ms</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      entry.source === 'v16'
                        ? 'bg-amber-950/70 text-amber-300'
                        : 'bg-cyan-950/70 text-cyan-300'
                    }`}
                  >
                    {entry.source}
                  </span>
                  <span className="text-slate-200">{entry.hook}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
