<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CADASTROS</p>
        <h1>Procedimentos de atendimento</h1>
        <p class="subhead">Gerencie procedimentos clínicos utilizados nos atendimentos, preços padrão, comissões e disponibilidade.</p>
      </div>
      <n-button v-if="!isMobile" type="primary" size="large" @click="openCreate">Novo procedimento</n-button>
    </div>

    <n-button v-if="isMobile" type="primary" size="large" block class="mobile-head-cta" @click="openCreate">Novo procedimento</n-button>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">PROCEDIMENTOS CADASTRADOS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">ATIVOS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.active }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">INATIVOS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.inactive }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">PREÇO MÉDIO</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ formatBRL(summary.averagePrice) }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.name" placeholder="Buscar por nome" clearable @keyup.enter="handleFilter" />
        <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Todos os status" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="mobileSearch" placeholder="Buscar por nome" clearable @keyup.enter="applyMobileFilters" />
        <n-button secondary strong @click="showMobileFilters = true">Filtros</n-button>
      </div>
    </n-card>

    <div v-if="loading" class="skeleton-layout">
      <n-skeleton v-for="i in isMobile ? 3 : 8" :key="i" text :repeat="isMobile ? 4 : 1" />
    </div>

    <template v-else>
      <div v-if="isMobile" class="card-list">
        <template v-if="procedures.length">
          <div v-for="item in procedures" :key="item.id" class="entity-card" @click="openEdit(item)">
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle"><span class="card-line-label">Preço padrão:</span> {{ formatBRL(item.defaultPrice) }}</p>
            <p class="card-subtitle"><span class="card-line-label">Comissão:</span> {{ formatCommission(item.commissionPercent) }}</p>
            <p class="card-subtitle card-status">
              <span class="card-line-label">Status:</span>
              <n-tag :bordered="false" class="status-chip" :style="statusTagStyle(item.isActive)">{{ item.isActive ? 'Ativo' : 'Inativo' }}</n-tag>
            </p>
            <p class="card-subtitle card-subtitle-muted"><span class="card-line-label">Atualizado em:</span> {{ formatDate(item.updatedAt || '') || '—' }}</p>
            <div class="card-actions" @click.stop>
              <n-button size="small" secondary type="primary" @click="openEdit(item)">Ver procedimento</n-button>
              <n-dropdown trigger="click" :options="buildActionOptions(item)" @select="(key: string) => handleActionSelect(key, item)">
                <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
              </n-dropdown>
            </div>
          </div>
          <div class="pagination">
            <n-pagination
              :page="pagination.page"
              :page-size="pagination.limit"
              :item-count="pagination.total"
              show-size-picker
              :page-sizes="[10, 20, 50]"
              @update:page="onPageChange"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </template>
        <n-empty v-else :description="emptyDescription">
          <template #extra>
            <n-button v-if="hasActiveFilters" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button v-else type="primary" @click="openCreate">Novo procedimento</n-button>
          </template>
        </n-empty>
      </div>

      <template v-else>
        <n-data-table
          v-if="procedures.length"
          :columns="columns"
          :data="procedures"
          :pagination="tablePagination"
          :bordered="false"
          :row-props="rowProps"
          remote
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
        <n-empty v-else :description="emptyDescription">
          <template #extra>
            <n-button v-if="hasActiveFilters" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button v-else type="primary" @click="openCreate">Novo procedimento</n-button>
          </template>
        </n-empty>
      </template>
    </template>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="40%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Todos os status" />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Aplicar filtros</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showModal" :mask-closable="false" preset="card" class="procedure-modal" style="width: 760px">
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingProcedure ? 'Editar procedimento' : 'Novo procedimento' }}</h3>
          <p class="modal-subtitle">{{ editingProcedure ? 'Atualize dados, preço padrão, comissão e status do procedimento.' : 'Cadastre um procedimento clínico para uso nos atendimentos.' }}</p>
        </div>
      </template>
      <ProcedureForm ref="procedureFormRef" :value="editingProcedure" :loading="saving" @submit="handleSubmit" />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitProcedureForm">{{ editingProcedure ? 'Salvar alterações' : 'Criar procedimento' }}</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { format } from 'date-fns'
import { NButton, NDropdown, NTag, useDialog, useMessage } from 'naive-ui'
import ProcedureForm, { type Procedure } from '~/components/procedures/ProcedureForm.vue'

interface ProceduresResponse {
  data: Procedure[]
  meta: { page: number; limit: number; total: number }
}

const message = useMessage()
const dialog = useDialog()

const procedures = ref<Procedure[]>([])
const allProcedures = ref<Procedure[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingProcedure = ref<Procedure | null>(null)
const procedureFormRef = ref<{ submit: () => Promise<void> } | null>(null)

const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const filters = reactive({ name: '', status: 'all' as 'all' | 'active' | 'inactive' })
const mobileSearch = ref('')

const pagination = reactive({ page: 1, limit: 10, total: 0 })

const summary = reactive({ total: 0, active: 0, inactive: 0, averagePrice: 0 })

const statusOptions = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' }
]

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))

const hasActiveFilters = computed(() => Boolean(filters.name || filters.status !== 'all'))
const emptyDescription = computed(() => hasActiveFilters.value ? 'Nenhum procedimento encontrado com os filtros aplicados.' : 'Nenhum procedimento cadastrado.')

const formatDate = (value: string) => value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : ''
const formatBRL = (value?: number | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const formatCommission = (value?: number | null) => `${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
const statusTagStyle = (isActive: boolean) => isActive
  ? '--n-color: #edf7ef; --n-text-color: #28663b; --n-border: 1px solid #d5eadb;'
  : '--n-color: #f3f4f6; --n-text-color: #374151; --n-border: 1px solid #e5e7eb;'

const columns = [
  {
    title: 'Procedimento',
    key: 'name',
    render: (row: Procedure) => h('div', { class: 'item-cell' }, [
      h('p', { class: 'item-name' }, row.name)
    ])
  },
  { title: 'Preço padrão', key: 'defaultPrice', render: (row: Procedure) => formatBRL(row.defaultPrice) },
  { title: 'Comissão', key: 'commissionPercent', render: (row: Procedure) => formatCommission(row.commissionPercent) },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: Procedure) => h(NTag, { bordered: false, class: 'status-chip', style: statusTagStyle(row.isActive) }, { default: () => row.isActive ? 'Ativo' : 'Inativo' })
  },
  { title: 'Atualizado em', key: 'updatedAt', render: (row: Procedure) => formatDate(String(row.updatedAt || '')) || '—' },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: Procedure) => h('div', { class: 'table-actions' }, [
      h(NButton, {
        size: 'small',
        secondary: true,
        type: 'primary',
        onClick: (e) => { e.stopPropagation(); openEdit(row) }
      }, { default: () => 'Ver procedimento' }),
      h(NDropdown, { trigger: 'click', options: buildActionOptions(row), onSelect: (key: string) => handleActionSelect(key, row) }, {
        default: () => h(NButton, { size: 'small', quaternary: true, class: 'menu-button', onClick: (e) => e.stopPropagation() }, { default: () => '⋯' })
      })
    ])
  }
]

const buildActionOptions = (item: Procedure) => [
  { label: 'Editar', key: 'edit' },
  { label: item.isActive ? 'Inativar' : 'Ativar', key: 'toggleStatus' },
  { type: 'divider', key: `divider-${item.id}` },
  { label: 'Excluir', key: 'delete' }
]

const handleActionSelect = (key: string, item: Procedure) => {
  if (key === 'edit') return openEdit(item)
  if (key === 'toggleStatus') return item.isActive ? confirmDeactivate(item) : confirmReactivate(item)
  if (key === 'delete') return confirmDelete(item)
}

const fetchSummary = async () => {
  const api = useApi()
  const res = await api<ProceduresResponse>('/api/v1/procedures', { query: { page: 1, limit: 500, name: filters.name || undefined } })
  allProcedures.value = (res.data || []).filter((item) => {
    if (filters.status === 'active') return item.isActive
    if (filters.status === 'inactive') return !item.isActive
    return true
  })

  summary.total = allProcedures.value.length
  summary.active = allProcedures.value.filter((item) => item.isActive).length
  summary.inactive = allProcedures.value.filter((item) => !item.isActive).length
  const activeWithPrice = allProcedures.value.filter((item) => item.isActive)
  const totalPrice = activeWithPrice.reduce((acc, item) => acc + Number(item.defaultPrice || 0), 0)
  summary.averagePrice = activeWithPrice.length ? totalPrice / activeWithPrice.length : 0
}

const fetchProcedures = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<ProceduresResponse>('/api/v1/procedures', {
      query: {
        page: pagination.page,
        limit: pagination.limit,
        name: filters.name || undefined,
        isActive: filters.status === 'all' ? undefined : filters.status === 'active',
        sortBy: 'updatedAt',
        sortDirection: 'desc'
      }
    })
    procedures.value = res.data || []
    pagination.total = Number(res.meta.total || 0)
    await fetchSummary()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao buscar procedimentos')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: Procedure) => {
  saving.value = true
  const api = useApi()
  try {
    const { id, ...body } = payload
    if (id) {
      await api(`/api/v1/procedures/${id}`, { method: 'PATCH', body })
      message.success('Procedimento atualizado')
    } else {
      await api('/api/v1/procedures', { method: 'POST', body })
      message.success('Procedimento criado')
    }
    closeModal()
    await fetchProcedures()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar procedimento')
  } finally {
    saving.value = false
  }
}

const submitProcedureForm = async () => { await procedureFormRef.value?.submit() }

const confirmDelete = (procedure: Procedure) => {
  if (!procedure.id) return
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o procedimento ${procedure.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/procedures/${procedure.id}`, { method: 'DELETE' })
        message.success('Procedimento excluído')
        await fetchProcedures()
      } catch (err: any) {
        message.error(err?.data?.message || 'Não foi possível excluir o procedimento.')
      }
    }
  })
}

const confirmDeactivate = (procedure: Procedure) => {
  if (!procedure.id) return
  dialog.warning({
    title: 'Confirmar inativação',
    content: `Deseja inativar o procedimento ${procedure.name}?`,
    positiveText: 'Inativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      await api(`/api/v1/procedures/${procedure.id}`, { method: 'PATCH', body: { isActive: false } })
      message.success('Procedimento inativado')
      await fetchProcedures()
    }
  })
}

const confirmReactivate = (procedure: Procedure) => {
  if (!procedure.id) return
  dialog.success({
    title: 'Confirmar ativação',
    content: `Deseja ativar o procedimento ${procedure.name}?`,
    positiveText: 'Ativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      await api(`/api/v1/procedures/${procedure.id}`, { method: 'PATCH', body: { isActive: true } })
      message.success('Procedimento ativado')
      await fetchProcedures()
    }
  })
}

const openCreate = () => { editingProcedure.value = null; showModal.value = true }
const openEdit = (procedure: Procedure) => { editingProcedure.value = procedure; showModal.value = true }
const closeModal = () => { showModal.value = false }

const onPageChange = (page: number) => { pagination.page = page; fetchProcedures() }
const onPageSizeChange = (size: number) => { pagination.limit = size; pagination.page = 1; fetchProcedures() }
const handleFilter = () => { pagination.page = 1; fetchProcedures() }
const handleClearFilters = () => {
  filters.name = ''
  filters.status = 'all'
  mobileSearch.value = ''
  pagination.page = 1
  showMobileFilters.value = false
  fetchProcedures()
}
const applyMobileFilters = () => {
  filters.name = mobileSearch.value.trim()
  pagination.page = 1
  showMobileFilters.value = false
  fetchProcedures()
}

const rowProps = (row: Procedure) => ({ style: { cursor: 'pointer' }, onClick: () => openEdit(row) })

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  fetchProcedures()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateIsMobile)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.head-copy { display: flex; flex-direction: column; gap: 4px; }
.eyebrow { margin: 0; font-size: 12px; color: #6b7280; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
h1 { margin: 0; font-size: 30px; line-height: 1.1; }
.subhead { margin: 0; color: #64748b; font-size: 14px; }
.mobile-head-cta { margin-top: -4px; }

.summary-grid { display: grid; gap: 10px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-grid-mobile { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.summary-card { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; min-height: 112px; }
.summary-card :deep(.n-card__content) { padding: 14px 16px !important; display: flex; flex-direction: column; justify-content: space-between; }
.summary-label { margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 500; }
.summary-value { display: block; margin-top: 10px; font-size: 32px; font-weight: 700; color: #111827; line-height: 1; }
.summary-value-mobile { display: block; margin-top: 8px; font-size: 26px; line-height: 1; font-weight: 700; color: #111827; }

.filters-card { border-radius: 14px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
.filters-grid { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(180px, 1fr) auto; gap: 12px; align-items: center; }
.filter-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.btn-clear { color: #6b7280; font-weight: 500; }
.btn-filter { width: 112px; }
:deep(.btn-filter.n-button) { border: 1px solid #334155; color: #1e293b; }

.skeleton-layout { display: grid; gap: 10px; }
:deep(.n-data-table) { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
:deep(.n-data-table-th) { font-weight: 600; color: #374151; }
:deep(.n-data-table-tr:hover td) { background: #f8fafc; }
:deep(.n-data-table-td) { padding-top: 6px !important; padding-bottom: 6px !important; line-height: 1.15; }
:deep(.n-data-table-th), :deep(.n-data-table-td) { white-space: nowrap; word-break: normal; }

.item-cell { display: flex; flex-direction: column; gap: 4px; }
.item-name { margin: 0; font-weight: 700; color: #0f172a; }
.item-subline { margin: 0; font-size: 12px; color: #64748b; max-width: 240px; overflow: hidden; text-overflow: ellipsis; }
.status-chip { border-radius: 999px; font-size: 11px; font-weight: 600; padding: 4px 10px; line-height: 1.15; border: 1px solid transparent; min-height: 24px; display: inline-flex; align-items: center; }
.table-actions { display: flex; align-items: center; gap: 8px; }

.card-list { display: flex; flex-direction: column; gap: 12px; }
.entity-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fff; }
.card-title { margin: 0; font-size: 16px; font-weight: 700; }
.card-subtitle { margin: 4px 0 0; font-size: 12px; color: #334155; }
.card-subtitle-muted { color: #64748b; }
.card-line-label { color: #64748b; font-weight: 500; }
.card-status { display: flex; align-items: center; gap: 6px; }
.card-actions { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.pagination { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }

.mobile-filter-top { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.mobile-filters-panel { display: grid; gap: 10px; }
.mobile-filter-actions { margin-top: 2px; display: flex; justify-content: flex-end; gap: 8px; }

.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; line-height: 1.2; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

@media (max-width: 768px) {
  h1 { font-size: 26px; }
  .subhead { font-size: 13px; }
  .modal-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .modal-actions .n-button { min-height: 44px; width: 100%; }
}
</style>

<style>
:root .n-modal-container:has(.procedure-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.procedure-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.procedure-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.procedure-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.procedure-modal.n-card {
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

.procedure-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.procedure-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.procedure-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .procedure-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .procedure-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .procedure-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .procedure-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }
}
</style>
