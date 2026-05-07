import React from 'react'
import ReactDOM from 'react-dom'
import { LifecycleFeaturePage } from '../features/lifecycle/LifecycleFeaturePage'

export type LifecycleFeatureProps = {}

export function mount(container: HTMLElement, props: LifecycleFeatureProps): () => void {
  ReactDOM.render(React.createElement(LifecycleFeaturePage, props), container)
  return () => ReactDOM.unmountComponentAtNode(container)
}
