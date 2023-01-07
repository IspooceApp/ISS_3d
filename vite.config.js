// vite.config.js
import vitePluginString from 'vite-plugin-string'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: process.env.PORT || 8080
  },
  preview: {
    port: process.env.port || 8080
  },
  plugins: [vitePluginString()]
})
