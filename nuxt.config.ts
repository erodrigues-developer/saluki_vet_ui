import { defineNuxtConfig } from 'nuxt/config'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: 3001
  },
  modules: ['nuxtjs-naive-ui', '@pinia/nuxt'],
  css: ['vfonts/Lato.css', 'vfonts/FiraCode.css'],
  build: {
    transpile: [
      'naive-ui',
      'vueuc',
      '@css-render/vue3-ssr',
      '@juggle/resize-observer',
      'date-fns',
      'lodash-es',
    ],
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
        resolvers: [
          NaiveUiResolver({
            importStyle: 'css',
          }),
        ],
      }),
    ],
    optimizeDeps: {
      include: [
        'naive-ui',
        'vueuc',
        'date-fns-tz/formatInTimeZone',
        'evtd',
        'seemly',
        'treemate',
        'vdirs',
        'vooks',
        'naive-ui/es/locales/common/ptBR',
        'naive-ui/es/locales/date/ptBR',
        'naive-ui/es/config-provider',
        'naive-ui/es/card',
        'naive-ui/es/form',
        'naive-ui/es/form-item',
        'naive-ui/es/input',
        'naive-ui/es/button',
        'naive-ui/es/alert'
      ],
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
      },
    },
  },
})
