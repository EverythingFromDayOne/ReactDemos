import { useMemo, useState, useTransition } from 'react'

const ITEM_COUNT = 3000

function slowFormat(value: number, offset: number): string {
  let accumulator = 0
  for (let i = 0; i < 1200; i += 1) {
    accumulator += Math.sqrt((value + offset + i) % 999)
  }
  return `Task ${offset + 1} - score ${Math.round(accumulator)}`
}

export function UseTransitionDemo() {
  const [activeSeed, setActiveSeed] = useState(0)
  const [isPending, startTransition] = useTransition()

  const items = useMemo(
    () => Array.from({ length: ITEM_COUNT }, (_, index) => slowFormat(activeSeed, index)),
    [activeSeed],
  )

  const handleStartTransition = () => {
    startTransition(() => {
      setActiveSeed((prev) => prev + 1)
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        useTransition demo
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        This starts a non-urgent update that re-renders a heavy list while keeping the UI responsive.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleStartTransition}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
        >
          Generate new heavy list
        </button>
        <span
          className={`text-sm ${isPending ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
          aria-live="polite"
        >
          {isPending ? 'Transition pending...' : 'Idle'}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Seed: <span className="font-mono">{activeSeed}</span>
      </p>

      <ul className="mt-4 max-h-64 space-y-1 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {items.slice(0, 120).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export default UseTransitionDemo
