import React from 'react'
import { EVENTS } from '../../event-bus'

type LifecycleFeaturePageProps = Record<string, never>
type LifecycleFeaturePageState = {
  count: number
}

export class LifecycleFeaturePage extends React.Component<LifecycleFeaturePageProps, LifecycleFeaturePageState> {
  state: LifecycleFeaturePageState = {
    count: 0,
  }

  constructor(props: LifecycleFeaturePageProps) {
    super(props)
    this.dispatchLifecycleEvent('constructor', EVENTS.HOOK_FIRED)
  }

  componentDidMount() {
    window.addEventListener(EVENTS.HOOK_FIRED, this.handleLifecycleEvent)
    this.dispatchLifecycleEvent('componentDidMount', EVENTS.MOUNTED)
  }

  componentDidUpdate(_prevProps: LifecycleFeaturePageProps, prevState: LifecycleFeaturePageState) {
    if (prevState.count !== this.state.count) {
      this.dispatchLifecycleEvent('componentDidUpdate', EVENTS.HOOK_FIRED)
    }
  }

  componentWillUnmount() {
    window.removeEventListener(EVENTS.HOOK_FIRED, this.handleLifecycleEvent)
    this.dispatchLifecycleEvent('componentWillUnmount', EVENTS.UNMOUNTED)
  }

  dispatchLifecycleEvent = (hook: string, eventName: string) => {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: {
          source: 'v16',
          hook,
          timestamp: Date.now(),
        },
      }),
    )
  }

  handleLifecycleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<unknown>
    const detail = customEvent.detail as { source?: unknown; hook?: unknown } | null | undefined

    // Ignore noise and ignore events emitted by this component itself.
    if (detail?.source !== 'v19' || typeof detail.hook !== 'string') return
  }

  handleIncrement = () => {
    this.setState(previous => ({ count: previous.count + 1 }))
  }

  render() {
    return (
      <section className="h-full rounded-xl border border-amber-900 bg-amber-950/20 p-4 text-amber-100">
        <header className="mb-3">
          <h3 className="text-sm font-semibold">React 16 (class component)</h3>
          <p className="mt-1 text-xs text-amber-200/80">
            Demonstrates constructor, componentDidMount, componentDidUpdate, and componentWillUnmount.
          </p>
        </header>

        <div className="space-y-3">
          <p className="text-sm">Update count: {this.state.count}</p>
          <button
            type="button"
            onClick={this.handleIncrement}
            className="rounded border border-amber-700 bg-amber-950/60 px-3 py-1.5 text-xs font-semibold text-amber-100"
          >
            Trigger componentDidUpdate
          </button>
        </div>
      </section>
    )
  }
}
