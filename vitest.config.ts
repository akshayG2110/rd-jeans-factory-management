import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'lib/services/**/*.ts',
        'lib/auth.ts',
        'lib/api.ts',
        'lib/utils.ts',
        'lib/dashboard-data.ts',
        'middleware.ts'
      ],
      exclude: ['lib/db.ts', 'lib/employee-store.ts', 'node_modules/**', '.next/**', 'tests/**'],
      thresholds: {
        lines: 65,
        statements: 65,
        branches: 50,
        functions: 75
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
