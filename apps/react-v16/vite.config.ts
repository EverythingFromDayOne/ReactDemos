import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

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
    }),
  ],
  server: {
    port: 5174,
    cors: true,
  },
  preview: {
    port: 5174,
  },
})