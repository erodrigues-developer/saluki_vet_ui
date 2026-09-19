import type { DashboardOverview } from '~/types/dashboard.types'

export const useDashboardOverview = () => {
  const data = useState<DashboardOverview | null>('dashboard-overview:data', () => null)
  const pending = useState('dashboard-overview:pending', () => false)
  const error = useState<string | null>('dashboard-overview:error', () => null)
  const loaded = useState('dashboard-overview:loaded', () => false)
  let activeRequest: Promise<DashboardOverview | null> | null = null

  const refresh = async () => {
    if (activeRequest) return activeRequest
    if (pending.value) return data.value
    activeRequest = (async () => {
      pending.value = true
      error.value = null
      try {
        const api = useApi()
        const response = await api<DashboardOverview | { data: DashboardOverview }>('/api/v1/dashboard/overview')
        data.value = 'data' in response ? response.data : response
        loaded.value = true
        return response
      } catch (cause: any) {
        error.value = cause?.data?.message || cause?.message || 'Não foi possível carregar o dashboard.'
        return null
      } finally {
        pending.value = false
        activeRequest = null
      }
    })()
    return activeRequest
  }

  const ensureLoaded = () => loaded.value ? Promise.resolve(data.value) : refresh()
  const lastUpdated = computed(() => data.value?.generatedAt || null)

  return { data, pending, error, loaded, lastUpdated, refresh, ensureLoaded }
}
