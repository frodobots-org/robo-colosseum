import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const devApiProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET || 'http://127.0.0.1:8443'
const datasetProxyTarget = process.env.VITE_DEV_DATASET_PROXY_TARGET
const basePath = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base: basePath,
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      ...(datasetProxyTarget ? { '/api/datasets': { target: datasetProxyTarget, changeOrigin: true, secure: false } } : {}),
      '/api': {
        target: devApiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
