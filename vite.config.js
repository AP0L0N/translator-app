import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue()
  ],
  build: {
    lib: {
      entry: './src/main.js',
      name: 'TranslationWidget',
      fileName: 'translation-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'translation-widget.[ext]'
      }
    },
    cssCodeSplit: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})