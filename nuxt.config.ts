import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxtjs-naive-ui'],
  css: ['vfonts/Lato.css', 'vfonts/FiraCode.css'],
  build: {
    transpile: ['vueuc', 'naive-ui', '@css-render/vue3-ssr', 'date-fns', 'lodash-es'],
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
    }
  },
  routeRules: {
    '/api/**': { proxy: `${process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/**` }
  },
  vite: {
    plugins: [
      AutoImport({
        imports: [
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar',
            ],
          },
        ],
      }),
      Components({
        resolvers: [NaiveUiResolver()],
      }),
    ],
    optimizeDeps: {
      include: ['vueuc', 'naive-ui', '@css-render/vue3-ssr', 'date-fns', 'lodash-es'],
    },
  },
})
