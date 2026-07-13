<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">ESTOQUE</p>
        <h1>Saldos de estoque</h1>
        <p class="subhead">Acompanhe saldo por produto e local, alertas de estoque e registre movimentações manuais.</p>
      </div>
      <div class="head-actions">
        <n-button tertiary size="large" @click="navigateTo('/estoque/movimentacoes')">Histórico</n-button>
        <n-button secondary size="large" @click="openMovement('OUT')">Saída</n-button>
        <n-button secondary size="large" @click="openMovement('ADJUST')">Ajustar</n-button>
        <n-button type="primary" size="large" @click="openMovement('IN')">Entrada</n-button>
      </div>
    </div>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Registros</p>
        <strong class="summary-value">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Normal</p>
        <strong class="summary-value">{{ summary.normal }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Próx. vencimento</p>
        <strong class="summary-value">{{ summary.expiring }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Vencidos</p>
        <strong class="summary-value">{{ summary.expired }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-stock">
        <n-input v-model:value="filters.search" placeholder="Buscar produto, SKU ou código de barras" clearable />
        <n-select v-model:value="filters.stockLocationId" :options="locationOptions" placeholder="Local de estoque" clearable />
        <n-select v-model:value="filters.productCategoryId" :options="categoryOptions" placeholder="Categoria" clearable />
        <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Status" clearable />
        <n-select v-model:value="filters.expirationStatus" :options="expirationStatusOptions" placeholder="Validade" clearable />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="fetchBalance">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar produto" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">Filtros</n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div v-for="row in data" :key="`${row.productId}-${row.stockLocationId ?? 'na'}`" class="entity-card">
        <div class="card-head">
          <div class="card-copy">
            <p class="card-title">{{ row.productName }}</p>
            <p class="card-subtitle">{{ row.categoryName || 'Sem categoria' }}</p>
          </div>
          <n-tag :bordered="false" class="status-chip" :style="statusStyle(row.status)">{{ statusLabel(row.status) }}</n-tag>
        </div>
        <div class="card-meta">
          <p class="card-line"><span class="card-line-label">Local:</span> <span class="card-line-value">{{ row.stockLocationName }}</span></p>
          <p class="card-line"><span class="card-line-label">Saldo:</span> <span class="card-line-value">{{ row.trackStock ? formatQuantity(row.currentStock) : '—' }}</span></p>
          <p class="card-line"><span class="card-line-label">Mínimo:</span> <span class="card-line-value">{{ row.trackStock ? formatQuantity(row.minimumStock) : '—' }}</span></p>
          <p class="card-line"><span class="card-line-label">Próx. validade:</span> <span class="card-line-value">{{ formatDate(row.nextExpirationDate) }}</span></p>
          <p class="card-line"><span class="card-line-label">Custo:</span> <span class="card-line-value">{{ formatCurrency(row.costPrice) }}</span></p>
          <p class="card-line"><span class="card-line-label">Venda:</span> <span class="card-line-value">{{ formatCurrency(row.salePrice) }}</span></p>
        </div>
        <div class="card-actions">
          <n-button size="small" secondary :disabled="!row.trackStock" @click="openMovement('IN', row)">Entrada</n-button>
          <n-button size="small" secondary :disabled="!row.trackStock" @click="openMovement('OUT', row)">Saída</n-button>
          <n-button size="small" quaternary :disabled="!row.trackStock" @click="openMovement('ADJUST', row)">Ajustar</n-button>
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

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="52%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.stockLocationId" :options="locationOptions" placeholder="Local de estoque" clearable />
          <n-select v-model:value="filters.productCategoryId" :options="categoryOptions" placeholder="Categoria" clearable />
          <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Status" clearable />
          <n-select v-model:value="filters.expirationStatus" :options="expirationStatusOptions" placeholder="Validade" clearable />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showMovementModal" :mask-closable="false" preset="card" class="stock-movement-modal">
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <p class="modal-subtitle">{{ modalSubtitle }}</p>
        </div>
      </template>
      <StockMovementForm
        ref="movementFormRef"
        :mode="movementMode"
        :loading="saving"
        :preset="movementPreset"
        @submit="handleMovementSubmit"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeMovementModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitMovementForm">Confirmar</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NTag, useMessage } from 'naive-ui'
import StockMovementForm from '~/components/stock/StockMovementForm.vue'

interface BalanceRow {
  productId: number
  productName: string
  categoryName?: string | null
  stockLocationId?: number | null
  stockLocationName: string
  currentStock?: number | null
  minimumStock?: number | null
  status: string
  expirationStatus?: string
  nextExpirationDate?: string | null
  expiringLotsCount?: number
  expiredLotsCount?: number
  costPrice?: number | null
  salePrice?: number | null
  trackStock: boolean
  tracksExpiration?: boolean
}

interface BalanceResponse {
  data: BalanceRow[]
  meta: {
    page: number
    limit: number
    total: number
    summary?: {
      total: number
      normal: number
      low: number
      zero: number
      untracked: number
      expiring: number
      expired: number
    }
  }
}

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const showMobileFilters = ref(false)
const showMovementModal = ref(false)
const movementMode = ref<'IN' | 'OUT' | 'ADJUST'>('IN')
const movementPreset = ref<{ productId?: number | null; stockLocationId?: number | null } | null>(null)
const movementFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const isMobile = ref(false)
const data = ref<BalanceRow[]>([])
const categoryOptions = ref<{ label: string; value: number }[]>([])
const locationOptions = ref<{ label: string; value: number }[]>([])
let mediaQuery: MediaQueryList | null = null

const filters = reactive({
  search: '',
  stockLocationId: null as number | null,
  productCategoryId: null as number | null,
  status: null as string | null,
  expirationStatus: null as string | null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const summary = reactive({
  total: 0,
  normal: 0,
  low: 0,
  zero: 0,
  untracked: 0,
  expiring: 0,
  expired: 0
})

const statusOptions = [
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Baixo', value: 'LOW' },
  { label: 'Zerado', value: 'ZERO' },
  { label: 'Não rastreado', value: 'UNTRACKED' }
]

const expirationStatusOptions = [
  { label: 'Sem filtro de validade', value: 'ALL' },
  { label: 'Válido', value: 'VALID' },
  { label: 'Próx. vencimento', value: 'EXPIRING' },
  { label: 'Vencido', value: 'EXPIRED' },
  { label: 'Sem controle', value: 'UNTRACKED' }
]

const modalTitle = computed(() => {
  if (movementMode.value === 'IN') return 'Entrada de estoque'
  if (movementMode.value === 'OUT') return 'Saída manual'
  return 'Ajustar saldo'
})

const modalSubtitle = computed(() => {
  if (movementMode.value === 'IN') return 'Registre uma entrada manual no local selecionado.'
  if (movementMode.value === 'OUT') return 'Registre uma baixa manual respeitando o saldo disponível.'
  return 'Informe o saldo contado e o sistema calculará a diferença.'
})

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const fetchBalance = async () => {
  loading.value = true
  const api = useApi()
  try {
    const response = await api<BalanceResponse>('/api/v1/stock-movements/balance', {
      query: {
        page: pagination.page,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        stockLocationId: filters.stockLocationId || undefined,
        productCategoryId: filters.productCategoryId || undefined,
        status: filters.status || undefined,
        expirationStatus: filters.expirationStatus || undefined
      }
    })

    data.value = response.data
    pagination.itemCount = response.meta.total
    Object.assign(summary, response.meta.summary || summary)
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar saldos de estoque.')
  } finally {
    loading.value = false
  }
}

const fetchOptions = async () => {
  const api = useApi()
  try {
    const [categories, locations] = await Promise.all([
      api<any>('/api/v1/product-categories', {
        query: { page: 1, limit: 200 }
      }),
      api<any>('/api/v1/stock-locations', {
        query: { activeOnly: true }
      })
    ])

    categoryOptions.value = (categories.data || []).map((item: any) => ({
      label: item.name,
      value: item.id
    }))
    const locationRows = Array.isArray(locations) ? locations : (locations.data || [])
    locationOptions.value = locationRows.map((item: any) => ({
      label: item.isDefault ? `${item.name} • padrão` : item.name,
      value: item.id
    }))
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar filtros de estoque.')
  }
}

const clearFilters = async () => {
  filters.search = ''
  filters.stockLocationId = null
  filters.productCategoryId = null
  filters.status = null
  filters.expirationStatus = null
  pagination.page = 1
  showMobileFilters.value = false
  await fetchBalance()
}

const applyMobileFilters = async () => {
  pagination.page = 1
  showMobileFilters.value = false
  await fetchBalance()
}

const openMovement = (mode: 'IN' | 'OUT' | 'ADJUST', row?: BalanceRow) => {
  movementMode.value = mode
  movementPreset.value = row
    ? {
        productId: row.productId,
        stockLocationId: row.stockLocationId ?? null
      }
    : null
  showMovementModal.value = true
}

const closeMovementModal = () => {
  showMovementModal.value = false
  movementPreset.value = null
}

const submitMovementForm = async () => {
  await movementFormRef.value?.submit()
}

const handleMovementSubmit = async (payload: Record<string, any>) => {
  saving.value = true
  const api = useApi()
  try {
    const endpoint = movementMode.value === 'IN'
      ? '/api/v1/stock-movements/in'
      : movementMode.value === 'OUT'
        ? '/api/v1/stock-movements/out'
        : '/api/v1/stock-movements/adjust'

    await api(endpoint, {
      method: 'POST',
      body: payload
    })

    message.success('Movimentação registrada com sucesso.')
    closeMovementModal()
    await fetchBalance()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao registrar movimentação.')
  } finally {
    saving.value = false
  }
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchBalance()
}

const onPageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchBalance()
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

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

const statusLabel = (status: string) => {
  if (status === 'LOW') return 'Baixo'
  if (status === 'ZERO') return 'Zerado'
  if (status === 'UNTRACKED') return 'Não rastreado'
  return 'Normal'
}

const statusStyle = (status: string) => {
  if (status === 'LOW') return { background: '#fef3c7', color: '#92400e' }
  if (status === 'ZERO') return { background: '#fee2e2', color: '#991b1b' }
  if (status === 'UNTRACKED') return { background: '#e2e8f0', color: '#475569' }
  return { background: '#dcfce7', color: '#166534' }
}

const columns = [
  { title: 'Produto', key: 'productName' },
  { title: 'Categoria', key: 'categoryName', render: (row: BalanceRow) => row.categoryName || '—' },
  { title: 'Local', key: 'stockLocationName' },
  {
    title: 'Quantidade atual',
    key: 'currentStock',
    render: (row: BalanceRow) => row.trackStock ? formatQuantity(row.currentStock) : '—'
  },
  {
    title: 'Estoque mínimo',
    key: 'minimumStock',
    render: (row: BalanceRow) => row.trackStock ? formatQuantity(row.minimumStock) : '—'
  },
  {
    title: 'Próx. validade',
    key: 'nextExpirationDate',
    render: (row: BalanceRow) => formatDate(row.nextExpirationDate)
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: BalanceRow) =>
      h(NTag, { bordered: false, class: 'status-chip', style: statusStyle(row.status) }, {
        default: () => statusLabel(row.status)
      })
  },
  { title: 'Custo', key: 'costPrice', render: (row: BalanceRow) => formatCurrency(row.costPrice) },
  { title: 'Preço de venda', key: 'salePrice', render: (row: BalanceRow) => formatCurrency(row.salePrice) },
  {
    title: '',
    key: 'actions',
    width: 240,
    render: (row: BalanceRow) => h('div', { class: 'table-actions' }, [
      h(NButton, {
        size: 'small',
        secondary: true,
        disabled: !row.trackStock,
        onClick: () => openMovement('IN', row)
      }, { default: () => 'Entrada' }),
      h(NButton, {
        size: 'small',
        secondary: true,
        disabled: !row.trackStock,
        onClick: () => openMovement('OUT', row)
      }, { default: () => 'Saída' }),
      h(NButton, {
        size: 'small',
        quaternary: true,
        disabled: !row.trackStock,
        onClick: () => openMovement('ADJUST', row)
      }, { default: () => 'Ajustar' })
    ])
  }
]

onMounted(() => {
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 900px)')
    updateIsMobile()
    mediaQuery.addEventListener?.('change', updateIsMobile)
  }
  fetchOptions()
  fetchBalance()
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
.head-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.summary-grid-mobile { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.summary-card { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; min-height: 112px; }
.summary-card :deep(.n-card__content) { padding: 14px 16px !important; display: flex; flex-direction: column; justify-content: space-between; }
.summary-label { margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 500; }
.summary-value { display: block; margin-top: 10px; font-size: 32px; font-weight: 700; color: #111827; line-height: 1; }
.filters-card { border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; }
.filters-card :deep(.n-card__content) { padding: 14px 16px !important; }
.filters-grid-stock { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr auto; gap: 10px; align-items: stretch; }
.filters-grid-stock :deep(.n-input),
.filters-grid-stock :deep(.n-base-selection) { min-height: 40px; }
.filters-grid-stock :deep(.n-input .n-input-wrapper),
.filters-grid-stock :deep(.n-base-selection .n-base-selection-label) { min-height: 40px; height: 40px; }
.filter-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.btn-clear { color: #6b7280; font-weight: 500; }
.btn-filter { width: 112px; }
:deep(.btn-filter.n-button) { border: 1px solid #334155; color: #1e293b; }
:deep(.btn-filter.n-button:hover) { border-color: #0f172a; color: #0f172a; }
.card-list { display: flex; flex-direction: column; gap: 12px; }
.entity-card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; background: #fff; display: flex; flex-direction: column; gap: 10px; }
.card-head, .card-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-copy { min-width: 0; }
.card-title { font-weight: 700; font-size: 15px; margin: 0 0 2px; color: #0f172a; }
.card-subtitle { margin: 0; font-size: 12px; color: #64748b; }
.card-meta { display: flex; flex-direction: column; gap: 4px; }
.card-line { margin: 0; font-size: 12px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #64748b; }
.card-line-label { color: #64748b; font-weight: 500; }
.card-line-value { color: #0f172a; font-weight: 600; }
.table-actions { display: flex; justify-content: flex-end; gap: 8px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 10px; }
.mobile-filters-card { padding: 8px; }
.mobile-filter-top { display: flex; flex-direction: column; gap: 8px; }
.mobile-filter-trigger { height: 44px; }
:deep(.mobile-filter-trigger.n-button) { border: 1px solid #334155; color: #1e293b; background: #ffffff; }
:deep(.mobile-filter-trigger.n-button:hover) { border-color: #0f172a; color: #0f172a; }
.mobile-filters-panel { display: flex; flex-direction: column; gap: 14px; }
.mobile-filter-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; line-height: 1.2; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

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
  .head-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .page { gap: 12px; }
  .page-head { flex-direction: column; align-items: flex-start; gap: 8px; }
  .head-copy { gap: 2px; }
  .head-copy h1 { font-size: 19px; line-height: 1.1; }
  .subhead { font-size: 13px; }
  .mobile-filter-top :deep(.n-input) { width: 100%; }
  .card-actions { margin-top: 2px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: nowrap; }
  .card-actions :deep(.n-button) { min-height: 36px; }
}
</style>

<style>
:root .n-modal-container:has(.stock-movement-modal) .n-modal-body-wrapper { overflow: hidden !important; }
:root .n-modal-container:has(.stock-movement-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.stock-movement-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.stock-movement-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}
.stock-movement-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
  width: 760px !important;
  max-width: calc(100vw - 24px) !important;
  max-height: calc(100vh - 48px) !important;
  max-height: calc(100dvh - 48px) !important;
  margin: 0 auto !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.stock-movement-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}
.stock-movement-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}
.stock-movement-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}
@media (max-width: 768px) {
  .stock-movement-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }
  .stock-movement-modal.n-card .n-card-header { padding: 14px 14px 10px; }
  .stock-movement-modal.n-card .n-card__content { padding: 10px 12px 16px; scroll-padding-bottom: 96px; -webkit-overflow-scrolling: touch; }
  .stock-movement-modal.n-card .n-card__footer { padding: 8px 12px; }
  .stock-movement-modal .modal-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
  .stock-movement-modal .modal-actions .n-button { width: 100%; min-height: 44px; }
}
</style>
