import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  clearScreen: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // src-tauri/target 是 Rust 构建产物（数万文件，含运行中的 exe，Windows 下监听会 EBUSY 崩溃）
      ignored: ['**/src-tauri/**']
    }
  },
  build: {
    target: 'chrome110',
    chunkSizeWarningLimit: 3000
  }
})
