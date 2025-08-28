import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // 使用绝对路径，适合 Cloudflare Pages
  build: {
    assetsDir: 'assets', // 资源目录
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  publicDir: 'public', // 确保 public 目录内容被复制
})
