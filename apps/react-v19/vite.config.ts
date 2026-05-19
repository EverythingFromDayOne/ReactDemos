import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// In dev-server mode (`vite`), @module-federation/vite does not expose
// federation artifacts as concrete routes. Vite's SPA fallback can return
// index.html for these paths, so we serve dist/ files directly instead.
function serveFederationDistPlugin(): Plugin {
  return {
    name: 'serve-federation-dist',
    apply: 'serve',
    configureServer(server) {
      const distDir = path.resolve(__dirname, 'dist')
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0]
        const isFederationBootstrap = /^\/mf-entry-bootstrap-.*\.js$/.test(url)
        if (
          url === '/remoteEntry.js' ||
          isFederationBootstrap ||
          url.startsWith('/assets/')
        ) {
          const filePath = path.resolve(distDir, url.slice(1))
          if (existsSync(filePath)) {
            server.config.logger.info(
              `[serve-federation-dist] serving ${url} from dist`,
              { timestamp: true },
            )
            const mime =
              path.extname(filePath) === '.css'
                ? 'text/css'
                : 'application/javascript'
            res.setHeader('Content-Type', mime)
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(readFileSync(filePath))
            return
          }
        }
        next()
      })
    },
  }
}

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
  const isWatchBuild = process.argv.includes('--watch')

  return {
    plugins: [
      react(),
      tailwindcss(),
      serveFederationDistPlugin(),
      federation({
        name: 'react_v19',
        filename: 'remoteEntry.js',
        dts: false,
        exposes: {
          './UseTransitionDemo': './src/exposed/UseTransitionDemo.tsx',
          './UseActionStateDemo': './src/exposed/UseActionStateDemo.tsx',
        },
        remotes: {
          react_v16: {
            name: 'react_v16',
            entry: remoteUrl,
            type: 'module',
          },
        },
        // CRITICAL: must remain an explicit empty object — do NOT enable singleton
        // sharing here. Two reasons:
        //
        // 1. react-v16 compat — `normalizeShared(undefined)` auto-shares every dep
        //    as singleton: true, which pushes react-dom@19 into the global shared
        //    cache that react-v16 reads, breaking its `render` import. Empty object
        //    opts out of auto-sharing on this side too.
        //
        // 2. Isolated demos don't need singleton React — the exposed components
        //    (UseTransitionDemo, UseActionStateDemo) are fully self-contained. They
        //    inherit dark mode via CSS (.dark class on <html>), not React context.
        //    Dual React@19 instances managing separate DOM trees are safe.
        //    Enabling singleton sharing introduces MF's async virtual module
        //    initialisation for React, which breaks this app's own synchronous
        //    boot sequence (null React during useRef call at startup).
        //    Singleton sharing is only needed when remotes consume host-owned React
        //    context (auth, i18n, etc.) — that is Phase 6+, not now.
        shared: {},
      }),
      watchFederatedRemote(path.resolve(__dirname, '../react-v16/dist')),
    ],
    build: {
      ...(isWatchBuild
        ? {
            // Keep dist stable during `vite build --watch` incremental updates.
            emptyOutDir: false,
            watch: {
              exclude: /node_modules[\\/]__mf__virtual[\\/]/,
            },
          }
        : {}),
    },
    server: {
      port: 5173,
      cors: true,
    },
  }
})