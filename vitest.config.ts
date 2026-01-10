import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'out', 'release'],
    environmentMatchGlobs: [
      // Use jsdom for renderer tests
      ['tests/renderer/**/*.test.{ts,tsx}', 'jsdom'],
    ],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'out',
        'release',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.{js,ts,mjs,cjs}',
        '**/index.ts',
        '**/index.tsx',
        'src/preload/**',
        'src/main/main.ts',
        'src/renderer/main.tsx',
        'demo.jsx',
        '.eslintrc.cjs',
        'META/**',
        'scripts/**',
        '**/demo.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
})
