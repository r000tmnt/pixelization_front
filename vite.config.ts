import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    // Keep scoped-style IDs identical between the prerender server and the
    // production client build so SSR markup matches the emitted CSS selectors.
    vue({ features: { componentIdGenerator: 'filepath' } }),
    ...(command === 'serve' && mode !== 'prerender' ? [vueDevTools()] : []),
  ],
  base: '/',
  build: {
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
