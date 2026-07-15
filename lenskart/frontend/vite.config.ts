import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('react/'))
              return 'vendor'
            if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('redux-persist'))
              return 'redux'
            if (id.includes('@tanstack/react-query'))
              return 'query'
            if (id.includes('framer-motion'))
              return 'motion'
            if (id.includes('lucide-react') || id.includes('sonner'))
              return 'ui'
            if (id.includes('@mediapipe'))
              return 'mediapipe'
            if (id.includes('three') || id.includes('@react-three'))
              return 'threejs'
          }
        },
      },
    },
  },
})
