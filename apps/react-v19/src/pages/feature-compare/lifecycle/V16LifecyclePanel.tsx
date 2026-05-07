import { useEffect, useRef, useState } from 'react';

type LifecycleRemoteModule = {
  mount: (container: HTMLElement, props: Record<string, never>) => () => void;
};

type ModuleFederationRuntime = {
  loadRemote: (remoteId: string) => Promise<unknown>;
};

type ModuleFederationGlobal = {
  initPromise: Promise<ModuleFederationRuntime>;
};

const RUNTIME_INIT_KEY_SUFFIX = '__mf_v__runtimeInit__mf_v__.js__';
const RUNTIME_INIT_KEY_PREFIX = '__mf_init____mf__virtual/';

function findRuntimeInitKey(): string | null {
  for (const key of Object.keys(globalThis as Record<string, unknown>)) {
    if (key.startsWith(RUNTIME_INIT_KEY_PREFIX) && key.endsWith(RUNTIME_INIT_KEY_SUFFIX)) {
      return key;
    }
  }
  return null;
}

async function loadRemoteViaRuntime(remoteId: string): Promise<unknown> {
  const key = findRuntimeInitKey();
  if (!key) {
    throw new Error('Module Federation runtime is not initialized in this host.');
  }

  const mfGlobal = (globalThis as Record<string, ModuleFederationGlobal>)[key];
  if (!mfGlobal?.initPromise) {
    throw new Error('Module Federation runtime initPromise is missing.');
  }

  const runtime = await mfGlobal.initPromise;
  const mod = await runtime.loadRemote(remoteId);

  if (mod === undefined || mod === null) {
    throw new Error(`Module Federation loadRemote returned no module for "${remoteId}".`);
  }

  return mod;
}

function isLifecycleRemoteModule(value: unknown): value is LifecycleRemoteModule {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { mount?: unknown };
  return typeof candidate.mount === 'function';
}

function resolveLifecycleRemote(value: unknown): LifecycleRemoteModule {
  if (isLifecycleRemoteModule(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    const withDefault = value as { default?: unknown };
    if (isLifecycleRemoteModule(withDefault.default)) {
      return withDefault.default;
    }
  }

  throw new Error('Federated LifecycleFeature module did not expose a mount(container, props) function.');
}

export function V16LifecyclePanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const teardownRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const mountRemote = async () => {
      try {
        const imported = await loadRemoteViaRuntime('react_v16/LifecycleFeature');
        const remote = resolveLifecycleRemote(imported);

        if (cancelled || !containerRef.current) return;

        teardownRef.current = remote.mount(containerRef.current, {});
        setIsLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.error('[feature-compare] Failed to load react-v16 remote', error);
        const message = error instanceof Error ? error.message : 'Unknown error.';
        setLoadError(`React 16 remote failed to load: ${message}`);
        setIsLoading(false);
      }
    };

    void mountRemote();

    return () => {
      cancelled = true;
      teardownRef.current?.();
      teardownRef.current = null;
    };
  }, []);

  return (
    <section className="h-full rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-slate-100">React 16 (federated remote)</h3>
        <p className="mt-1 text-xs text-slate-400">Class component lifecycle methods mounted via federation.</p>
      </header>

      {isLoading ? <p className="mb-2 text-xs text-slate-400">Loading React 16…</p> : null}
      {loadError ? (
        <p className="mb-2 rounded border border-rose-900 bg-rose-950/40 px-2 py-1 text-xs text-rose-200">
          {loadError}
        </p>
      ) : null}

      <div ref={containerRef} className="min-h-[220px] rounded-md border border-slate-800 bg-slate-950/70" />
    </section>
  );
}
