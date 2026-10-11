import { setup } from '@css-render/vue3-ssr'

export default defineNuxtPlugin((nuxtApp) => {
  // Each SSR app owns its collector; never share styles between requests.
  const { collect } = setup(nuxtApp.vueApp)

  // collect() returns complete style tags, including the cssr-id attributes
  // Naive UI uses to reuse server styles during hydration.
  nuxtApp.ssrContext?.head.hooks.hook('ssr:rendered', (context) => {
    context.html.headTags += collect()
  })
})
