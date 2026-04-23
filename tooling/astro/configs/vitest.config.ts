import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    passWithNoTests: true,
    exclude: [
      'node_modules',
      'dist',
      '.astro',
      'e2e/**/*',
      '.{idea,git,cache,output,temp}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/setup.ts', 'e2e/', '**/*.astro'],
    },
  },
})
