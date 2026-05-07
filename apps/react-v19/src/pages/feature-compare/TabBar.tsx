import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

type TabId = 'lifecycle' | 'state' | 'context' | 'suspense';

type TabItem = {
  id: TabId;
  label: string;
  planned: boolean;
};

const TABS: TabItem[] = [
  { id: 'lifecycle', label: 'Lifecycle', planned: false },
  { id: 'state', label: 'State', planned: true },
  { id: 'context', label: 'Context', planned: true },
  { id: 'suspense', label: 'Suspense', planned: true },
];

type TabBarProps = {
  activeTab: string;
  onTabChange: (id: string) => void;
};

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveFocus = (index: number) => {
    const normalized = (index + TABS.length) % TABS.length;
    const tab = TABS[normalized];
    const el = tabRefs.current[normalized];
    el?.focus();
    onTabChange(tab.id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocus(index + 1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocus(index - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="React version feature comparison"
      className="flex flex-wrap gap-2 border-b border-slate-800 pb-3"
    >
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const tabId = `feature-tab-${tab.id}`;
        const panelId = `feature-panel-${tab.id}`;

        return (
          <button
            key={tab.id}
            ref={el => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={tabId}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={event => onKeyDown(event, index)}
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              isActive
                ? 'border-cyan-500/70 bg-cyan-500/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18)]'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-600/70 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.planned ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                  isActive ? 'bg-cyan-900/60 text-cyan-200' : 'bg-slate-700 text-slate-200'
                }`}
              >
                Planned
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
