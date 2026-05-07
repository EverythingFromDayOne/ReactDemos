export const EVENTS = Object.freeze({
  HOOK_FIRED: 'react-demos:lifecycle:hook-fired',
  MOUNTED: 'react-demos:lifecycle:mounted',
  UNMOUNTED: 'react-demos:lifecycle:unmounted',
})

export type LifecycleEventDetail = {
  source: 'v16' | 'v19'
  hook: string
  timestamp: number
}
