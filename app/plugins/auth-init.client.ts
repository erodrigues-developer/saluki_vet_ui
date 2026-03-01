import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    authStore.initAuth()
  }
})
