import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tcg-remote-overlay/',
  server: {
    watch: {
      ignored: [
        '**/public/images/cardlist/**',
        '**/public/images/cardlist/hololive/**',
        '**/test/**',
        '**/.git/**',
        '**/node_modules/**'
      ]
    }
  }
})
