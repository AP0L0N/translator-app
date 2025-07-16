import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isWidget = mode === 'widget'
  
  if (isWidget) {
    // Widget build configuration
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/widget/index.jsx'),
          name: 'TranslatorWidget',
          fileName: 'widget',
          formats: ['iife']
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {},
            // Inline all CSS
            assetFileNames: (assetInfo) => {
              if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                return 'widget.css';
              }
              return assetInfo.name;
            }
          }
        },
        outDir: 'dist/widget',
        emptyOutDir: true,
        sourcemap: false,
        minify: 'terser',
        cssCodeSplit: false
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      css: {
        devSourcemap: false
      }
    }
  }

  // Regular app build configuration
  return {
    plugins: [react()],
    build: {
      outDir: 'dist/app',
      emptyOutDir: true
    },
    server: {
      port: 3000,
      open: true
    }
  }
})
