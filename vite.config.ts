import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/dashboard',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000,
    rollupOptions: {
      output: {
        entryFileNames: 'dashboard.js',
        chunkFileNames: 'dashboard-[name].js',
        assetFileNames: (assetInfo) =>
          assetInfo.names.some((name) => name.endsWith('.css'))
            ? 'dashboard.css'
            : 'asset-[name][extname]',
      },
    },
  },
})
