import { useAuthStore } from '~/stores/auth'

export const useApi = () => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const apiFetch = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    onRequest({ options }) {
      // Garante reidratação da sessão em refresh/hard reload antes do primeiro request.
      if (process.client && !authStore.token) {
        authStore.initAuth()
      }

      if (authStore.token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${authStore.token}`,
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        authStore.logout()
        return
      }

      if (response.status === 403 && process.client) {
        const route = useRoute()
        if (route.path !== '/403') {
          navigateTo('/403')
        }
      }
    }
  })

  return apiFetch
}
