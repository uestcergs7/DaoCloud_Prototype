import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5175,
      proxy: {
        // 统一代理到 Node 服务，开发/生产路径一致
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
        },
        '/proxy': {
          target: 'http://localhost:3002',
          changeOrigin: true,
        },
        '/config.js': {
          target: 'http://localhost:3002',
          changeOrigin: true,
        },
      },
    },
  }
})
