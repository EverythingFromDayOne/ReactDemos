// Named imports avoid CJS default-export interop issues under @module-federation/vite.
// React 16 and react-dom are CJS-only; named exports survive federation bundling reliably.
import { createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { LifecycleFeaturePage } from '../features/lifecycle/LifecycleFeaturePage'

export type LifecycleFeatureProps = {}

export function mount(container: HTMLElement, props: LifecycleFeatureProps): () => void {
  render(createElement(LifecycleFeaturePage, props), container)
  return () => unmountComponentAtNode(container)
}
