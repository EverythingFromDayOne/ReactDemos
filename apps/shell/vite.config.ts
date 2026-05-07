import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

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
  ],
  server: {
    port: 3000,
  },
})