import { useActionState } from 'react'

type FormStatus = {
  type: 'idle' | 'success' | 'error'
  message: string
}

const initialStatus: FormStatus = {
  type: 'idle',
  message: 'Submit the form to simulate a server action.',
}

async function submitProfileAction(_: FormStatus, formData: FormData): Promise<FormStatus> {
  const name = String(formData.get('name') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()

  await new Promise((resolve) => setTimeout(resolve, 900))

  if (!name) {
    return {
      type: 'error',
      message: 'Name is required before saving.',
    }
  }

  if (name.toLowerCase() === 'error') {
    return {
      type: 'error',
      message: 'Simulated server rejection: the name "error" is not allowed.',
    }
  }

  return {
    type: 'success',
    message: `Saved profile for ${name}${note ? ` (${note})` : ''}.`,
  }
}

export function UseActionStateDemo() {
  const [status, formAction, isPending] = useActionState(submitProfileAction, initialStatus)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        useActionState demo
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Submit this form to run an async action and view pending/success/error states.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Name
          </span>
          <input
            name="name"
            type="text"
            placeholder="Type a name, or `error` to force a failure"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Note (optional)
          </span>
          <input
            name="note"
            type="text"
            placeholder="Optional note"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      <p
        className={`mt-4 rounded-md border px-3 py-2 text-sm ${
          status.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            : status.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
              : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}
        aria-live="polite"
      >
        {isPending ? 'Submitting action...' : status.message}
      </p>
    </section>
  )
}

export default UseActionStateDemo
