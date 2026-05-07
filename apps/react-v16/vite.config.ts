import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// In dev-server mode (`vite`), @module-federation/vite does NOT serve
// remoteEntry.js as a real HTTP route — Vite's SPA fallback wins and returns
// the app's index.html instead.  This plugin runs before that fallback and
// short-circuits federation-specific paths by reading them straight from
// the pre-built dist/.  Run `vite build` once before starting the dev server
// (the `dev` script does this automatically: "vite build && vite").
function serveFederationDistPlugin() {
  return {
    name: 'serve-federation-dist',
    apply: 'serve' as const,
    configureServer(server: import('vite').ViteDevServer) {
      const distDir = resolve(__dirname, 'dist')
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0]
        // Intercept only the federation-generated paths, not the SPA root.
        if (
          url === '/remoteEntry.js' ||
          url === '/mf-entry-bootstrap-0.js' ||
          url.startsWith('/assets/')
        ) {
          const filePath = resolve(distDir, url.slice(1))
          if (existsSync(filePath)) {
            const mime =
              extname(filePath) === '.css'
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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'react_v16',
      filename: 'remoteEntry.js',
      dts: false,
      exposes: {
        './LifecycleFeature': './src/exposed/LifecycleFeature.ts',
      },
      // singleton: false — v16's react-dom must never be substituted by the
      // host's react-dom@19.x; requiredVersion rejects incompatible versions.
      shared: {
        'react-dom': {
          singleton: false,
          requiredVersion: '~16.14.0',
          version: '16.14.0',
        },
      },
    }),
    serveFederationDistPlugin(),
  ],
  build: {
    // Keep false so vite build --watch (dev:mfe) updates files in-place
    // rather than wiping dist/ before every incremental rebuild.
    emptyOutDir: false,
    watch: {
      // @module-federation/vite materialises virtual modules as real .mjs
      // files in node_modules/__mf__virtual/ and watches them via Rollup's
      // addWatchFile.  Each build rewrites those files → triggers another
      // build → infinite loop.  Excluding that directory breaks the chain.
      exclude: /node_modules[\\/]__mf__virtual[\\/]/,
    },
  },
  server: {
    port: 5174,
    cors: true,
  },
  preview: {
    port: 5174,
  },
})
