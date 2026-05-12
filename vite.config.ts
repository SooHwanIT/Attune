import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('@pixiv/three-vrm-animation')) {
            return 'vrm-animation';
          }

          if (id.includes('@pixiv/three-vrm')) {
            return 'vrm-core';
          }

          if (id.includes('three/addons')) {
            return 'three-addons';
          }

          if (id.includes('/three/')) {
            return 'three-core';
          }

          if (id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
            return 'react-three';
          }

          if (id.includes('recharts')) {
            return 'charts';
          }

          if (id.includes('react-router-dom')) {
            return 'router';
          }

          if (id.includes('lucide-react')) {
            return 'icons';
          }

          if (id.includes('axios')) {
            return 'http';
          }

          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
  server: {
    proxy: {
      // '/google-api'로 시작하는 요청이 오면 구글 서버로 토스해줍니다.
      '/google-api': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-api/, ''),
        secure: false,
      },
    },
  },
})
