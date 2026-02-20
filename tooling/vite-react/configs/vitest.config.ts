import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default defineConfig((configEnv) =>
  mergeConfig(
    typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig,
    defineConfig({
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.ts',
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/e2e/**',
          '**/.{idea,git,cache,output,temp}/**',
        ],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: ['node_modules/', 'src/test/setup.ts', 'e2e/'],
        },
      },
    }),
  ),
)
