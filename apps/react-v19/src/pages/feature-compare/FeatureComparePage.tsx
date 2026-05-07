import { useMemo, useState } from 'react';
import { LifecycleTab } from './lifecycle/LifecycleTab';
import { PlaceholderTab } from './PlaceholderTab';
import { TabBar } from './TabBar';

type FeatureTabId = 'lifecycle' | 'state' | 'context' | 'suspense';
const VALID_TABS: FeatureTabId[] = ['lifecycle', 'state', 'context', 'suspense'];

const PLACEHOLDER_CONTENT: Record<Exclude<FeatureTabId, 'lifecycle'>, { title: string; description: string }> = {
  state: {
    title: 'State',
    description: 'React 16 `setState` batching behaviour vs React 19 automatic batching with `startTransition`.',
  },
  context: {
    title: 'Context',
    description: 'React 16 `contextType` on class components vs React 19 `use(Context)` and context selectors.',
  },
  suspense: {
    title: 'Suspense',
    description: 'React 19 `<Suspense>` with `use()` for data fetching — React 16 does not support Suspense for data.',
  },
};

export default function FeatureComparePage() {
  const [activeTab, setActiveTab] = useState<FeatureTabId>('lifecycle');
  const [lifecycleSessionKey, setLifecycleSessionKey] = useState(0);

  const handleTabChange = (id: string) => {
    if (!VALID_TABS.includes(id as FeatureTabId)) return;
    const nextTab = id as FeatureTabId;
    if (nextTab === activeTab) return;

    if (activeTab === 'lifecycle' && nextTab !== 'lifecycle') {
      // Clear lifecycle event log synchronously by forcing a fresh LifecycleTab instance.
      setLifecycleSessionKey(previous => previous + 1);
    }

    setActiveTab(nextTab);
  };

  const lifecyclePanelId = 'feature-panel-lifecycle';
  const lifecycleTabId = 'feature-tab-lifecycle';

  const activePlaceholder = useMemo(() => {
    if (activeTab === 'lifecycle') return null;
    return PLACEHOLDER_CONTENT[activeTab];
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-6 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold">React Feature Compare</h1>
          <p className="text-sm text-slate-400">Compare React 16 and React 19 behavior side-by-side.</p>
        </header>

        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {activeTab === 'lifecycle' ? (
          <LifecycleTab
            key={lifecycleSessionKey}
            panelId={lifecyclePanelId}
            tabId={lifecycleTabId}
            onUnmount={() => {}}
          />
        ) : (
          <PlaceholderTab
            title={activePlaceholder?.title ?? ''}
            description={activePlaceholder?.description ?? ''}
            panelId={`feature-panel-${activeTab}`}
            tabId={`feature-tab-${activeTab}`}
          />
        )}
      </div>
    </main>
  );
}
