<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">ESTOQUE</p>
        <h1>Histórico de movimentações</h1>
        <p class="subhead">Audite entradas, saídas, ajustes e baixas automáticas geradas pelo sistema.</p>
      </div>
      <n-button type="primary" size="large" @click="navigateTo('/estoque/saldos')">
        Ver saldos
      </n-button>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-history">
        <n-select v-model:value="filters.productId" :options="productOptions" placeholder="Produto" clearable filterable />
        <n-select v-model:value="filters.stockLocationId" :options="locationOptions" placeholder="Local" clearable />
        <n-select v-model:value="filters.movementType" :options="movementTypeOptions" placeholder="Tipo" clearable />
        <n-select v-model:value="filters.expirationStatus" :options="expirationStatusOptions" placeholder="Validade" clearable />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="fetchHistory">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input :value="historyLabel" disabled />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">Filtros</n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div v-for="row in data" :key="row.id" class="entity-card">
        <div class="card-head">
          <div class="card-copy">
            <p class="card-title">{{ row.product?.name || 'Produto' }}</p>
            <p class="card-subtitle">{{ row.stockLocation?.name || '—' }}</p>
          </div>
          <n-tag :bordered="false" class="status-chip" :style="movementTypeStyle(row.movementType)">
            {{ movementTypeLabel(row.movementType) }}
          </n-tag>
        </div>
        <div class="card-meta">
          <p class="card-line"><span class="card-line-label">Data:</span> <span class="card-line-value">{{ formatDateTime(row.occurredAt) }}</span></p>
          <p class="card-line"><span class="card-line-label">Quantidade:</span> <span class="card-line-value">{{ formatQuantity(row.quantity) }}</span></p>
          <p class="card-line"><span class="card-line-label">Lote:</span> <span class="card-line-value">{{ row.stockBatch?.lotCode || '—' }}</span></p>
          <p class="card-line"><span class="card-line-label">Validade:</span> <span class="card-line-value">{{ formatDate(row.stockBatch?.expirationDate) }}</span></p>
          <p class="card-line"><span class="card-line-label">Custo:</span> <span class="card-line-value">{{ formatCurrency(row.unitCost) }}</span></p>
          <p class="card-line"><span class="card-line-label">Origem:</span> <span class="card-line-value">{{ referenceLabel(row) }}</span></p>
          <p class="card-line"><span class="card-line-label">Usuário:</span> <span class="card-line-value">{{ row.createdByUser?.name || 'Sistema' }}</span></p>
          <p class="card-line"><span class="card-line-label">Obs.:</span> <span class="card-line-value">{{ noteLabel(row) }}</span></p>
        </div>
      </div>
      <div class="pagination">
        <n-pagination
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          show-size-picker
          :page-sizes="pagination.pageSizes"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="data"
      :pagination="pagination"
      :bordered="false"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
      remote
    />

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="48%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.productId" :options="productOptions" placeholder="Produto" clearable filterable />
          <n-select v-model:value="filters.stockLocationId" :options="locationOptions" placeholder="Local" clearable />
          <n-select v-model:value="filters.movementType" :options="movementTypeOptions" placeholder="Tipo" clearable />
          <n-select v-model:value="filters.expirationStatus" :options="expirationStatusOptions" placeholder="Validade" clearable />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NTag, useMessage } from 'naive-ui'

interface HistoryRow {
  id: number
  movementType: string
  quantity: number
  unitCost?: number | null
  occurredAt: string
  referenceType?: string | null
  referenceId?: number | null
  notes?: string | null
  reason?: string | null
  stockBatch?: { lotCode?: string | null; expirationDate?: string | null } | null
  product?: { name?: string | null; productCategory?: { name?: string | null } | null } | null
  stockLocation?: { name?: string | null } | null
  createdByUser?: { name?: string | null } | null
}

interface HistoryResponse {
  data: HistoryRow[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

const message = useMessage()
const loading = ref(false)
const data = ref<HistoryRow[]>([])
const productOptions = ref<{ label: string; value: number }[]>([])
const locationOptions = ref<{ label: string; value: number }[]>([])
const isMobile = ref(false)
const showMobileFilters = ref(false)
let mediaQuery: MediaQueryList | null = null

const filters = reactive({
  productId: null as number | null,
  stockLocationId: null as number | null,
  movementType: null as string | null,
  expirationStatus: null as string | null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const movementTypeOptions = [
  { label: 'Entrada', value: 'IN' },
  { label: 'Saída', value: 'OUT' },
  { label: 'Ajuste positivo', value: 'ADJUSTMENT_IN' },
  { label: 'Ajuste negativo', value: 'ADJUSTMENT_OUT' }
]

const expirationStatusOptions = [
  { label: 'Sem filtro de validade', value: 'ALL' },
  { label: 'Válido', value: 'VALID' },
  { label: 'Próx. vencimento', value: 'EXPIRING' },
  { label: 'Vencido', value: 'EXPIRED' },
  { label: 'Sem controle', value: 'UNTRACKED' }
]

const historyLabel = computed(() => {
  if (filters.movementType) return movementTypeLabel(filters.movementType)
  return 'Todos os tipos'
})

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const fetchHistory = async () => {
  loading.value = true
  const api = useApi()
  try {
    const response = await api<HistoryResponse>('/api/v1/stock-movements/history', {
      query: {
        page: pagination.page,
        limit: pagination.pageSize,
        productId: filters.productId || undefined,
        stockLocationId: filters.stockLocationId || undefined,
        movementType: filters.movementType || undefined,
        expirationStatus: filters.expirationStatus || undefined
      }
    })
    data.value = response.data
    pagination.itemCount = response.meta.total
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar histórico de estoque.')
  } finally {
    loading.value = false
  }
}

const fetchOptions = async () => {
  const api = useApi()
  try {
    const [products, locations] = await Promise.all([
      api<any>('/api/v1/products', {
        query: { page: 1, limit: 200, isService: false, isActive: true, sortBy: 'name', sortDirection: 'asc' }
      }),
      api<any>('/api/v1/stock-locations', {
        query: { activeOnly: true }
      })
    ])

    productOptions.value = (products.data || []).map((item: any) => ({
      label: item.name,
      value: item.id
    }))
    const locationRows = Array.isArray(locations) ? locations : (locations.data || [])
    locationOptions.value = locationRows.map((item: any) => ({
      label: item.name,
      value: item.id
    }))
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar filtros do histórico.')
  }
}

const clearFilters = async () => {
  filters.productId = null
  filters.stockLocationId = null
  filters.movementType = null
  filters.expirationStatus = null
  pagination.page = 1
  showMobileFilters.value = false
  await fetchHistory()
}

const applyMobileFilters = async () => {
  pagination.page = 1
  showMobileFilters.value = false
  await fetchHistory()
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchHistory()
}

const onPageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchHistory()
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

const formatQuantity = (value?: number | null) =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  })

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

const movementTypeLabel = (value?: string | null) => {
  if (value === 'IN') return 'Entrada'
  if (value === 'OUT') return 'Saída'
  if (value === 'ADJUSTMENT_IN') return 'Ajuste +'
  if (value === 'ADJUSTMENT_OUT') return 'Ajuste -'
  return value || '—'
}

const movementTypeStyle = (value?: string | null) => {
  if (value === 'IN' || value === 'ADJUSTMENT_IN') return { background: '#dcfce7', color: '#166534' }
  if (value === 'OUT' || value === 'ADJUSTMENT_OUT') return { background: '#fee2e2', color: '#991b1b' }
  return { background: '#e2e8f0', color: '#475569' }
}

const referenceLabel = (row: HistoryRow) =>
  row.referenceType ? `${row.referenceType}${row.referenceId ? ` #${row.referenceId}` : ''}` : 'Manual'

const noteLabel = (row: HistoryRow) => {
  const chunks = [row.reason, row.notes].filter(Boolean)
  return chunks.length ? chunks.join(' • ') : '—'
}

const columns = [
  { title: 'Data', key: 'occurredAt', render: (row: HistoryRow) => formatDateTime(row.occurredAt) },
  { title: 'Produto', key: 'product', render: (row: HistoryRow) => row.product?.name || '—' },
  { title: 'Local', key: 'stockLocation', render: (row: HistoryRow) => row.stockLocation?.name || '—' },
  {
    title: 'Tipo',
    key: 'movementType',
    render: (row: HistoryRow) => h(NTag, { bordered: false, class: 'status-chip', style: movementTypeStyle(row.movementType) }, {
      default: () => movementTypeLabel(row.movementType)
    })
  },
  { title: 'Quantidade', key: 'quantity', render: (row: HistoryRow) => formatQuantity(row.quantity) },
  { title: 'Lote', key: 'stockBatch', render: (row: HistoryRow) => row.stockBatch?.lotCode || '—' },
  { title: 'Validade', key: 'expirationDate', render: (row: HistoryRow) => formatDate(row.stockBatch?.expirationDate) },
  { title: 'Custo unitário', key: 'unitCost', render: (row: HistoryRow) => formatCurrency(row.unitCost) },
  { title: 'Origem / referência', key: 'referenceType', render: (row: HistoryRow) => referenceLabel(row) },
  { title: 'Usuário', key: 'createdByUser', render: (row: HistoryRow) => row.createdByUser?.name || 'Sistema' },
  { title: 'Observação', key: 'notes', render: (row: HistoryRow) => noteLabel(row) }
]

onMounted(() => {
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 900px)')
    updateIsMobile()
    mediaQuery.addEventListener?.('change', updateIsMobile)
  }
  fetchOptions()
  fetchHistory()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', updateIsMobile)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.head-copy { display: flex; flex-direction: column; gap: 2px; }
.eyebrow { margin: 0; color: #6b7280; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; }
.head-copy h1 { margin: 0; font-size: 22px; line-height: 1.15; color: #111827; }
.subhead { margin: 0; color: #6b7280; font-size: 14px; }
.filters-card { border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; }
.filters-card :deep(.n-card__content) { padding: 14px 16px !important; }
.filters-grid-history { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr auto; gap: 10px; align-items: stretch; }
.filters-grid-history :deep(.n-input),
.filters-grid-history :deep(.n-base-selection) { min-height: 40px; }
.filters-grid-history :deep(.n-input .n-input-wrapper),
.filters-grid-history :deep(.n-base-selection .n-base-selection-label) { min-height: 40px; height: 40px; }
.filter-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.btn-clear { color: #6b7280; font-weight: 500; }
.btn-filter { width: 112px; }
:deep(.btn-filter.n-button) { border: 1px solid #334155; color: #1e293b; }
:deep(.btn-filter.n-button:hover) { border-color: #0f172a; color: #0f172a; }
.card-list { display: flex; flex-direction: column; gap: 12px; }
.entity-card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; background: #fff; display: flex; flex-direction: column; gap: 10px; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-copy { min-width: 0; }
.card-title { font-weight: 700; font-size: 15px; margin: 0 0 2px; color: #0f172a; }
.card-subtitle { margin: 0; font-size: 12px; color: #64748b; }
.card-meta { display: flex; flex-direction: column; gap: 4px; }
.card-line { margin: 0; font-size: 12px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #64748b; }
.card-line-label { color: #64748b; font-weight: 500; }
.card-line-value { color: #0f172a; font-weight: 600; }
.pagination { display: flex; justify-content: flex-end; margin-top: 10px; }
.mobile-filters-card { padding: 8px; }
.mobile-filter-top { display: flex; flex-direction: column; gap: 8px; }
.mobile-filter-trigger { height: 44px; }
:deep(.mobile-filter-trigger.n-button) { border: 1px solid #334155; color: #1e293b; background: #ffffff; }
:deep(.mobile-filter-trigger.n-button:hover) { border-color: #0f172a; color: #0f172a; }
.mobile-filters-panel { display: flex; flex-direction: column; gap: 14px; }
.mobile-filter-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }

:deep(.n-data-table) { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
:deep(.n-data-table-th) { font-weight: 600; color: #374151; }
:deep(.n-data-table-tr:hover td) { background: #f8fafc; }
:deep(.n-data-table-td) { padding-top: 6px !important; padding-bottom: 6px !important; line-height: 1.2; }
:deep(.n-data-table-th),
:deep(.n-data-table-td) { white-space: nowrap; word-break: normal; }
:deep(.n-data-table .n-data-table__pagination),
:deep(.n-data-table .n-data-table-pagination) {
  min-height: 40px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

@media (max-width: 900px) {
  .page-head { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 768px) {
  .page { gap: 12px; }
  .page-head { flex-direction: column; align-items: flex-start; gap: 8px; }
  .head-copy { gap: 2px; }
  .head-copy h1 { font-size: 19px; line-height: 1.1; }
  .subhead { font-size: 13px; }
  .mobile-filter-top :deep(.n-input) { width: 100%; }
}
</style>
