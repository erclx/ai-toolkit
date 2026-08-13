import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import path from 'path'

const portOffset = Number(process.env.WORKTREE_PORT_OFFSET) || 0

export default defineConfig({
  integrations: [react()],
  site: process.env.ASTRO_SITE,
  server: {
    port: 4321 + portOffset,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
    server: {
      strictPort: true,
    },
    preview: {
      strictPort: true,
    },
  },
})
