import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署路徑：https://malagege.github.io/strTemplate-test/
  base: '/strTemplate-test/',
  plugins: [
    vue(),
    // 只用於本機開發 HTTPS（Clipboard API 需要安全環境），不影響 production build
    mkcert(),
  ],
  server: {
    port: 5000,
  },
})
