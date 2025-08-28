import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    assetsInlineLimit: 0, // 禁用内联，确保图片作为独立文件
  },
  publicDir: 'public', // 确保 public 目录内容被复制
})
