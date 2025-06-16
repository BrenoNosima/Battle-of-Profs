import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    assetsInlineLimit: 4096, // Arquivos menores que 4KB serão embutidos como base64
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]', // Estrutura de pastas para assets
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js'
      }
    }
  },
  server: {
    host: '0.0.0.0', // Permite acesso em rede local
    port: 5175, // Mantém a porta que você está usando
    strictPort: true // Evita mudança automática de porta
  }
})