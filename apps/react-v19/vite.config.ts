import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fallbackRemoteUrl = 'http://localhost:5174/remoteEntry.js'
  const remoteUrl = env.VITE_V16_REMOTE_URL

  if (mode === 'production' && !remoteUrl) {
    throw new Error('VITE_V16_REMOTE_URL is required for production builds')
  }

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
            entry: remoteUrl ?? fallbackRemoteUrl,
            type: 'module',
          },
        },
      }),
    ],
    server: {
      port: 5173,
    },
  }
})