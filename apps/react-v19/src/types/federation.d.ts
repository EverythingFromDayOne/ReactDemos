declare module 'react_v16/LifecycleFeature' {
  export type LifecycleFeatureProps = Record<string, never>
  export function mount(container: HTMLElement, props: LifecycleFeatureProps): () => void
}
