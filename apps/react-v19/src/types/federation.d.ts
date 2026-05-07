declare module 'react_v16/LifecycleFeature' {
  export type LifecycleFeatureProps = {}
  export function mount(container: HTMLElement, props: LifecycleFeatureProps): () => void
}
