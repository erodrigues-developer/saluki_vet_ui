import { defineNuxtConfig } from 'nuxt/config'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  devServer: {
    port: 3001
  },
  modules: ['nuxtjs-naive-ui', '@pinia/nuxt'],
  css: ['~/assets/fonts.css'],
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
    apiUpstream: process.env.NUXT_API_UPSTREAM || process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
  },
  vite: {
    server: {
      allowedHosts: true,
      hmr: {
        port: Number(process.env.NUXT_HMR_PORT || 24679),
      },
    },
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
