<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CADASTROS</p>
        <h1>Locais de estoque</h1>
        <p class="subhead">Gerencie os estoques operacionais, local padrão e status ativo da clínica.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="openCreate">
        Novo local
      </n-button>
    </div>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Locais cadastrados</p>
        <strong class="summary-value">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Ativos</p>
        <strong class="summary-value">{{ summary.active }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Inativos</p>
        <strong class="summary-value">{{ summary.inactive }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Padrão ativo</p>
        <strong class="summary-value">{{ summary.defaults }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.search" placeholder="Buscar local" clearable />
        <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Status" clearable />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="fetchLocations">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar local" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">Filtros</n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div v-for="item in data" :key="item.id" class="entity-card" @click="openEdit(item)">
        <div class="card-head">
          <div class="card-copy">
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle">{{ item.isDefault ? 'Local padrão de venda' : 'Local operacional' }}</p>
          </div>
          <n-tag :bordered="false" class="status-chip" :style="statusTagStyle(item.isActive)">
            {{ item.isActive ? 'Ativo' : 'Inativo' }}
          </n-tag>
        </div>
        <div class="card-meta">
          <p class="card-line"><span class="card-line-label">Padrão:</span> <span class="card-line-value">{{ item.isDefault ? 'Sim' : 'Não' }}</span></p>
          <p class="card-line"><span class="card-line-label">Atualizado:</span> <span class="card-line-value">{{ formatDate(item.updatedAt) }}</span></p>
        </div>
        <div class="card-actions" @click.stop>
          <n-button size="small" secondary type="primary" @click="openEdit(item)">Editar</n-button>
          <n-dropdown trigger="click" :options="actionOptions(item)" @select="(key: string) => handleAction(key, item)">
            <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
          </n-dropdown>
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
      :row-props="rowProps"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
      remote
    />

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="42%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Status" clearable />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showModal" :mask-closable="false" preset="card" class="stock-location-modal">
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingItem ? 'Editar local' : 'Novo local' }}</h3>
          <p class="modal-subtitle">
            {{ editingItem ? 'Atualize o status e a configuração do local de estoque.' : 'Cadastre um novo ponto de armazenamento da clínica.' }}
          </p>
        </div>
      </template>
      <StockLocationForm ref="formRef" :value="editingItem" :loading="saving" @submit="handleSubmit" />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitForm">
            {{ editingItem ? 'Salvar alterações' : 'Criar local' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NTag, useDialog, useMessage } from 'naive-ui'
import StockLocationForm, { type StockLocation } from '~/components/stock/StockLocationForm.vue'

interface StockLocationsResponse {
  data: StockLocation[]
  meta: {
    page: number
    limit: number
    total: number
    summary?: {
      total: number
      active: number
      inactive: number
      defaults: number
    }
  }
}

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingItem = ref<StockLocation | null>(null)
const formRef = ref<{ submit: () => Promise<void> } | null>(null)
const data = ref<StockLocation[]>([])
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const filters = reactive({
  search: '',
  isActive: null as boolean | null
})

const summary = reactive({
  total: 0,
  active: 0,
  inactive: 0,
  defaults: 0
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const statusOptions = [
  { label: 'Ativos', value: true },
  { label: 'Inativos', value: false }
]

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const fetchLocations = async () => {
  loading.value = true
  const api = useApi()
  try {
    const response = await api<StockLocationsResponse>('/api/v1/stock-locations', {
      query: {
        page: pagination.page,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        isActive: filters.isActive === null ? undefined : String(filters.isActive)
      }
    })
    data.value = response.data
    pagination.itemCount = response.meta.total
    Object.assign(summary, response.meta.summary || {
      total: response.meta.total,
      active: 0,
      inactive: 0,
      defaults: 0
    })
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar locais de estoque.')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingItem.value = null
  showModal.value = true
}

const openEdit = (item: StockLocation) => {
  editingItem.value = { ...item }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const submitForm = async () => {
  await formRef.value?.submit()
}

const handleSubmit = async (payload: StockLocation) => {
  saving.value = true
  const api = useApi()
  try {
    if (editingItem.value?.id) {
      await api(`/api/v1/stock-locations/${editingItem.value.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Local atualizado com sucesso.')
    } else {
      await api('/api/v1/stock-locations', {
        method: 'POST',
        body: payload
      })
      message.success('Local criado com sucesso.')
    }
    closeModal()
    await fetchLocations()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao salvar local.')
  } finally {
    saving.value = false
  }
}

const removeItem = (item: StockLocation) => {
  dialog.warning({
    title: 'Excluir local',
    content: `Deseja excluir o local "${item.name}"?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    async onPositiveClick() {
      const api = useApi()
      try {
        await api(`/api/v1/stock-locations/${item.id}`, { method: 'DELETE' })
        message.success('Local excluído com sucesso.')
        await fetchLocations()
      } catch (error: any) {
        message.error(error?.data?.message || 'Erro ao excluir local.')
      }
    }
  })
}

const handleAction = (key: string, item: StockLocation) => {
  if (key === 'edit') openEdit(item)
  if (key === 'delete') removeItem(item)
}

const actionOptions = (item: StockLocation) => [
  { label: 'Editar', key: 'edit' },
  { label: `Excluir ${item.name}`, key: 'delete' }
]

const clearFilters = async () => {
  filters.search = ''
  filters.isActive = null
  pagination.page = 1
  showMobileFilters.value = false
  await fetchLocations()
}

const applyMobileFilters = async () => {
  pagination.page = 1
  showMobileFilters.value = false
  await fetchLocations()
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchLocations()
}

const onPageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchLocations()
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

const statusTagStyle = (isActive: boolean) => isActive
  ? { background: '#dcfce7', color: '#166534' }
  : { background: '#e2e8f0', color: '#475569' }

const columns = [
  {
    title: 'Nome',
    key: 'name'
  },
  {
    title: 'Padrão',
    key: 'isDefault',
    render: (row: StockLocation) => row.isDefault ? 'Sim' : 'Não'
  },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: StockLocation) =>
      h(NTag, { bordered: false, class: 'status-chip', style: statusTagStyle(row.isActive) }, {
        default: () => row.isActive ? 'Ativo' : 'Inativo'
      })
  },
  {
    title: 'Atualizado',
    key: 'updatedAt',
    render: (row: StockLocation) => formatDate(row.updatedAt)
  },
  {
    title: '',
    key: 'actions',
    width: 84,
    render: (row: StockLocation) =>
      h(NDropdown, {
        trigger: 'click',
        options: actionOptions(row),
        onSelect: (key: string) => handleAction(key, row)
      }, {
        default: () => h(NButton, { size: 'small', quaternary: true, class: 'menu-button' }, { default: () => '•••' })
      })
  }
]

const rowProps = (row: StockLocation) => ({
  style: 'cursor: pointer;',
  onClick: () => openEdit(row)
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 900px)')
    updateIsMobile()
    mediaQuery.addEventListener?.('change', updateIsMobile)
  }
  fetchLocations()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', updateIsMobile)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.head-copy { display: flex; flex-direction: column; gap: 6px; }
.eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; color: #2563eb; }
.head-copy h1 { margin: 0; font-size: 32px; line-height: 1.05; color: #0f172a; }
.subhead { margin: 0; max-width: 720px; font-size: 14px; line-height: 1.6; color: #64748b; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.summary-grid-mobile { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.summary-card, .filters-card, .entity-card { border-radius: 20px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); }
.summary-label { margin: 0 0 10px; font-size: 13px; color: #64748b; }
.summary-value { font-size: 28px; line-height: 1; color: #0f172a; }
.filters-card :deep(.n-card__content) { padding: 18px; }
.filters-grid { display: grid; grid-template-columns: 1.4fr 0.9fr auto; gap: 12px; align-items: center; }
.filter-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.card-list { display: flex; flex-direction: column; gap: 12px; }
.entity-card { border: 1px solid #e5e7eb; padding: 16px; background: #fff; }
.card-head, .card-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-copy { min-width: 0; }
.card-title { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
.card-subtitle, .card-line { margin: 0; font-size: 13px; color: #64748b; }
.card-meta { display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
.card-line-label { font-weight: 600; color: #475569; }
.pagination { display: flex; justify-content: center; padding-top: 4px; }
.mobile-filter-top { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
.mobile-filters-panel { display: flex; flex-direction: column; gap: 14px; }
.mobile-filter-actions { display: flex; justify-content: space-between; gap: 8px; }
.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; line-height: 1.2; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

@media (max-width: 900px) {
  .page-head { align-items: flex-start; flex-direction: column; }
  .head-cta { width: 100%; }
}
</style>

<style>
:root .n-modal-container:has(.stock-location-modal) .n-modal-body-wrapper { overflow: hidden !important; }
:root .n-modal-container:has(.stock-location-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.stock-location-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.stock-location-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}
.stock-location-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
  width: 760px !important;
  max-width: calc(100vw - 24px) !important;
  max-height: calc(100vh - 48px) !important;
  max-height: calc(100dvh - 48px) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.stock-location-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
}
.stock-location-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
}
.stock-location-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
}
@media (max-width: 768px) {
  .stock-location-modal.n-card .n-card-header { padding: 14px 14px 10px; }
  .stock-location-modal.n-card .n-card__content { padding: 10px 12px 16px; }
  .stock-location-modal.n-card .n-card__footer { padding: 8px 12px; }
  .stock-location-modal .modal-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
  .stock-location-modal .modal-actions .n-button { width: 100%; min-height: 44px; }
}
</style>
