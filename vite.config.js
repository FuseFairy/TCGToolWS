import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import vuetify from 'vite-plugin-vuetify'
import vueDevTools from 'vite-plugin-vue-devtools'
import ViteFonts from 'unplugin-fonts/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    vuetify({
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    ViteFonts({
      google: {
        families: [
          {
            name: 'LXGW WenKai Mono TC',
            styles: 'ital,wght@0,300;0,400;0,700;1,300;1,400;1,700',
          },
        ],
      },
    }),
    visualizer({
      emitFile: true,
      filename: 'stats.html',
    }),
    legacy({
      targets: ['defaults'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  uild: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const extensions = ['.js', '.ts', '.mjs']
          if (id.includes('node_modules') && extensions.some((ext) => id.endsWith(ext))) {
            return 'packages'
          }
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
