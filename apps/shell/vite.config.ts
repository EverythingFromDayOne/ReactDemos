import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
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

export default defineConfig({
  plugins: [
    tailwindcss(),
    federation({
      name: 'shell',
      dts: false,
      remotes: {
        react_v16: {
          name: 'react_v16',
          entry: 'http://localhost:5174/remoteEntry.js',
          type: 'module',
        },
      },
    }),
    watchFederatedRemote(path.resolve(__dirname, '../react-v16/dist')),
  ],
  server: {
    port: 3000,
  },
})