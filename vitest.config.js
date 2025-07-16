import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.js',
        'src/**/*.test.{js,jsx}',
        'src/**/*.spec.{js,jsx}',
        'dist/',
        'public/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});