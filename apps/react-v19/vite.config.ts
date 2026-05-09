import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// vite preview has no HMR client. This plugin makes the host's own dev server
// watch the federated remote's dist/ output and broadcast a full-reload over
// its existing HMR socket whenever the remote rebuilds, so we don't have to
// hit reload manually after editing v16 sources.
function watchFederatedRemote(remoteDistPath: string): Plugin {
  let timer: ReturnType<typeof setTimeout> | undefined
  return {
    name: 'watch-federated-remote',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(remoteDistPath)
      const triggerReload = (file: string) => {
        if (!file.startsWith(remoteDistPath)) return
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          server.config.logger.info(
            `[watch-federated-remote] remote rebuilt, reloading host`,
            { timestamp: true },
          )
          server.ws.send({ type: 'full-reload', path: '*' })
        }, 150)
      }
      server.watcher.on('change', triggerReload)
      server.watcher.on('add', triggerReload)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const remoteUrl = env.VITE_V16_REMOTE_URL

  return {
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: 'react_v19',
        dts: false,
        remotes: {
          react_v16: {
            name: 'react_v16',
            entry: remoteUrl,
            type: 'module',
          },
        },
        // No `shared` block on purpose. React 19 is bundled into the host so it
        // never collides with the v16 remote's React 16 via the global
        // `__mf_module_cache__.share` slot.
      }),
      watchFederatedRemote(path.resolve(__dirname, '../react-v16/dist')),
    ],
    server: {
      port: 5173,
    },
  }
})