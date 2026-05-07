import { useCallback, useEffect, useState } from 'react';
import { EVENTS } from '../../../event-bus';

function dispatchLifecycleEvent(source: 'v16' | 'v19', hook: string, eventName: string) {
  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: { source, hook, timestamp: Date.now() },
    }),
  );
}

export function V19LifecyclePanel() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    dispatchLifecycleEvent('v19', 'useEffect[]', EVENTS.MOUNTED);
    return () => {
      dispatchLifecycleEvent('v19', 'useEffect cleanup[]', EVENTS.UNMOUNTED);
    };
  }, []);

  useEffect(() => {
    dispatchLifecycleEvent('v19', 'useEffect[count]', EVENTS.HOOK_FIRED);
  }, [count]);

  const increment = useCallback(() => {
    setCount(previous => previous + 1);
  }, []);

  return (
    <section className="h-full rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-slate-100">React 19 (native)</h3>
        <p className="mt-1 text-xs text-slate-400">Function component + hooks lifecycle equivalents.</p>
      </header>

      <div className="space-y-3">
        <p className="text-sm text-slate-200">Update count: {count}</p>
        <button
          type="button"
          onClick={increment}
          className="rounded-md border border-cyan-800 bg-cyan-950/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:border-cyan-700"
        >
          Trigger update effect
        </button>
      </div>
    </section>
  );
}
