import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import path from 'path'

import { site } from './src/content/copy.ts'

const portOffset = Number(process.env.WORKTREE_PORT_OFFSET) || 0

export default defineConfig({
  integrations: [react()],
  // `ASTRO_SITE` overrides the deployed origin for a staging or preview
  // build, which is what a bare `site.origin` cannot do.
  site: process.env.ASTRO_SITE || site.origin,
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
