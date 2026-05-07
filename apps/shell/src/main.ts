type LifecycleFeatureProps = {}

type LifecycleRemote = {
  mount: (container: HTMLElement, props: LifecycleFeatureProps) => () => void
}

let teardownV16: (() => void) | null = null

async function bootstrap(): Promise<void> {
  const paneV16 = document.querySelector<HTMLElement>('#pane-v16')
  const paneV19 = document.querySelector<HTMLElement>('#pane-v19')

  if (!paneV16) {
    throw new Error('Missing #pane-v16 container in shell')
  }

  if (paneV19) {
    const iframe = document.createElement('iframe')
    iframe.src = 'http://localhost:5173/feature-compare'
    iframe.title = 'react-v19 feature compare'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = '0'
    paneV19.replaceChildren(iframe)
  }

  try {
    const remote = (await import('react_v16/LifecycleFeature')) as LifecycleRemote
    teardownV16 = remote.mount(paneV16, {})
    console.info('[shell] Mounted react-v16 LifecycleFeature')
  } catch (error) {
    console.error(
      '[shell] Failed to load react_v16/LifecycleFeature. Ensure react-v16 preview server is running on http://localhost:5174.',
      error,
    )
    paneV16.textContent = 'Failed to load react-v16 remote. Check browser console for details.'
  }
}

window.addEventListener('beforeunload', () => {
  teardownV16?.()
})

void bootstrap()
