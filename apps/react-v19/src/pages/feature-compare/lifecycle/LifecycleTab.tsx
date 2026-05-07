import { useCallback, useEffect, useState } from 'react';
import type { LifecycleEventDetail } from '../../../event-bus';
import { EVENTS } from '../../../event-bus';
import { FederationErrorBoundary } from '../../../components/FederationErrorBoundary';
import { LifecycleEventLog } from './LifecycleEventLog';
import type { LogEntry } from './LifecycleEventLog';
import { V16LifecyclePanel } from './V16LifecyclePanel';
import { V19LifecyclePanel } from './V19LifecyclePanel';

type LifecycleTabProps = {
  onUnmount: () => void;
  panelId: string;
  tabId: string;
};

function V16ErrorFallback() {
  return (
    <section className="h-full rounded-xl border border-rose-900 bg-rose-950/30 p-4">
      <h3 className="text-sm font-semibold text-rose-100">React 16 remote failed</h3>
      <p className="mt-1 text-xs text-rose-200">
        React 16 remote failed to render. Check whether the dev server is running on port 5174 and refresh this page.
      </p>
    </section>
  );
}

function normalizeDetail(eventType: string, detail: unknown): LogEntry | null {
  if (!detail || typeof detail !== 'object') return null;

  const candidate = detail as Partial<LifecycleEventDetail>;
  if (candidate.source !== 'v16' && candidate.source !== 'v19') return null;
  if (typeof candidate.timestamp !== 'number') return null;

  let hook = typeof candidate.hook === 'string' ? candidate.hook : '';
  if (!hook) {
    if (eventType === EVENTS.MOUNTED) hook = 'mounted';
    if (eventType === EVENTS.UNMOUNTED) hook = 'unmounted';
  }
  if (!hook) return null;

  return {
    source: candidate.source,
    timestamp: candidate.timestamp,
    hook,
  };
}

export function LifecycleTab({ onUnmount, panelId, tabId }: LifecycleTabProps) {
  const [eventLog, setEventLog] = useState<LogEntry[]>([]);

  const handleLifecycleEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<unknown>;
    const normalized = normalizeDetail(customEvent.type, customEvent.detail);
    if (!normalized) return;
    setEventLog(previous => [normalized, ...previous]);
  }, []);

  useEffect(() => {
    window.addEventListener(EVENTS.HOOK_FIRED, handleLifecycleEvent);
    window.addEventListener(EVENTS.MOUNTED, handleLifecycleEvent);
    window.addEventListener(EVENTS.UNMOUNTED, handleLifecycleEvent);

    return () => {
      window.removeEventListener(EVENTS.HOOK_FIRED, handleLifecycleEvent);
      window.removeEventListener(EVENTS.MOUNTED, handleLifecycleEvent);
      window.removeEventListener(EVENTS.UNMOUNTED, handleLifecycleEvent);
      onUnmount();
    };
  }, [handleLifecycleEvent, onUnmount]);

  return (
    <section id={panelId} role="tabpanel" aria-labelledby={tabId} className="grid min-h-[420px] grid-rows-[1fr_auto] gap-4">
      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <FederationErrorBoundary fallback={<V16ErrorFallback />}>
          <V16LifecyclePanel />
        </FederationErrorBoundary>
        <V19LifecyclePanel />
      </div>

      <LifecycleEventLog entries={eventLog} onClear={() => setEventLog([])} />
    </section>
  );
}
