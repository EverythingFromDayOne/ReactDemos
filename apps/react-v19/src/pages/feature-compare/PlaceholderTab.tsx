type PlaceholderTabProps = {
  title: string;
  description: string;
  panelId: string;
  tabId: string;
};

export function PlaceholderTab({ title, description, panelId, tabId }: PlaceholderTabProps) {
  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      className="grid min-h-[420px] place-items-center rounded-xl border border-slate-800 bg-slate-900/40 p-6"
    >
      <div className="max-w-xl rounded-lg border border-slate-700 bg-slate-900 p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Coming soon</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-100">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{description}</p>
      </div>
    </section>
  );
}
