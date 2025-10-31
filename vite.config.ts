import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // IMPORTANT: replace with your repo name for GitHub Pages
  base: '/circuitquest/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      includeAssets: ['levels/index.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
      },
      manifest: {
        name: 'Circuit Quest',
        short_name: 'CircuitQuest',
        start_url: '.',
        display: 'standalone',
        background_color: '#101116',
        theme_color: '#0bd3ff',
        icons: [
          { src: 'vite.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      }
    })
  ]
})
