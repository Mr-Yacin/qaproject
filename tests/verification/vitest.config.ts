import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'api-verification',
    root: path.resolve(__dirname),
    environment: 'node',
    globals: true,
    setupFiles: [path.resolve(__dirname, 'setup.ts')],
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    include: [
      '**/*.test.ts',
      '**/*.spec.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**'
    ],
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/verification-results.json'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './test-results/coverage',
      include: [
        'src/**/*.ts',
        'src/**/*.tsx'
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@/tests': path.resolve(__dirname, '..'),
      '@/verification': path.resolve(__dirname, '.')
    }
  },
  define: {
    'process.env.NODE_ENV': '"test"'
  }
});