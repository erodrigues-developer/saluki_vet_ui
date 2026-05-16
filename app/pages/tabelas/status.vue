<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">TABELAS</p>
        <h1>Status de agendamento</h1>
        <p class="subhead">Gerencie os status utilizados no fluxo de agendamentos da clínica.</p>
      </div>
      <n-button v-if="!isMobile" type="primary" size="large" @click="openCreate">Novo status</n-button>
    </div>

    <n-button v-if="isMobile" type="primary" size="large" block class="mobile-head-cta" @click="openCreate">Novo status</n-button>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">STATUS CADASTRADOS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">STATUS DO SISTEMA</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.system }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">STATUS PERSONALIZADOS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.custom }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">IMUTÁVEIS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.immutable }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.search" placeholder="Buscar por nome ou código" clearable @keyup.enter="handleFilter" />
        <n-select v-model:value="filters.type" :options="typeOptions" placeholder="Todos os tipos" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="mobileSearch" placeholder="Buscar por nome ou código" clearable @keyup.enter="applyMobileFilters" />
        <n-button secondary strong @click="showMobileFilters = true">Filtros</n-button>
      </div>
    </n-card>

    <div v-if="loading" class="skeleton-layout">
      <n-skeleton v-for="i in isMobile ? 3 : 8" :key="i" text :repeat="isMobile ? 4 : 1" />
    </div>

    <template v-else>
      <div v-if="isMobile" class="card-list">
        <template v-if="pagedData.length">
          <div v-for="item in pagedData" :key="item.id" class="entity-card" @click="openEdit(item)">
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle"><span class="card-line-label">Código:</span> <span class="code-chip">{{ item.code }}</span></p>
            <p class="card-subtitle card-status">
              <span class="card-line-label">Tipo:</span>
              <n-tag :bordered="false" class="type-chip" :style="typeTagStyle(item.isSystem)">{{ item.isSystem ? 'Sistema' : 'Personalizado' }}</n-tag>
            </p>
            <p class="card-subtitle card-subtitle-muted"><span class="card-line-label">Atualizado em:</span> {{ formatDate(item.updatedAt || '') || '—' }}</p>
            <div class="card-actions" @click.stop>
              <n-button size="small" secondary type="primary" @click="openEdit(item)">Ver status</n-button>
              <n-dropdown trigger="click" :options="buildActionOptions(item)" @select="(key: string) => handleActionSelect(key, item)">
                <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
              </n-dropdown>
            </div>
          </div>
          <div class="pagination">
            <n-pagination
              :page="pagination.page"
              :page-size="pagination.limit"
              :item-count="filteredStatuses.length"
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
            <n-button v-else type="primary" @click="openCreate">Novo status</n-button>
          </template>
        </n-empty>
      </div>

      <template v-else>
        <n-data-table
          v-if="pagedData.length"
          :columns="columns"
          :data="pagedData"
          :pagination="tablePagination"
          :bordered="false"
          :row-props="rowProps"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
        <n-empty v-else :description="emptyDescription">
          <template #extra>
            <n-button v-if="hasActiveFilters" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button v-else type="primary" @click="openCreate">Novo status</n-button>
          </template>
        </n-empty>
      </template>
    </template>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="40%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.type" :options="typeOptions" placeholder="Todos os tipos" />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Aplicar filtros</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showModal" :mask-closable="false" preset="card" class="appointment-status-modal" style="width: 760px">
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <p class="modal-subtitle">{{ modalSubtitle }}</p>
        </div>
      </template>
      <AppointmentStatusForm ref="appointmentStatusFormRef" :value="editingStatus" :loading="saving" @submit="handleSubmit" />
      <template #footer>
        <div class="modal-actions">
          <n-button v-if="editingStatus?.isSystem" type="primary" @click="closeModal">Fechar</n-button>
          <template v-else>
            <n-button tertiary @click="closeModal" :disabled="saving">Cancelar</n-button>
            <n-button type="primary" :loading="saving" @click="submitAppointmentStatusForm">
              {{ editingStatus ? 'Salvar alterações' : 'Criar status' }}
            </n-button>
          </template>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { format } from 'date-fns'
import { NButton, NDropdown, NTag, useDialog, useMessage } from 'naive-ui'
import AppointmentStatusForm, { type AppointmentStatus } from '~/components/appointment-statuses/AppointmentStatusForm.vue'

const message = useMessage()
const dialog = useDialog()

const statuses = ref<AppointmentStatus[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingStatus = ref<AppointmentStatus | null>(null)
const appointmentStatusFormRef = ref<{ submit: () => Promise<void> } | null>(null)

const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const filters = reactive({ search: '', type: 'all' as 'all' | 'system' | 'custom' })
const mobileSearch = ref('')
const pagination = reactive({ page: 1, limit: 10 })

const typeOptions = [
  { label: 'Todos os tipos', value: 'all' },
  { label: 'Sistema', value: 'system' },
  { label: 'Personalizado', value: 'custom' }
]

const formatDate = (value: string) => value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : ''
const typeTagStyle = (isSystem: boolean) => isSystem
  ? '--n-color: #eef2f7; --n-text-color: #334155; --n-border: 1px solid #dbe2ea;'
  : '--n-color: #edf7ef; --n-text-color: #28663b; --n-border: 1px solid #d5eadb;'

const hasActiveFilters = computed(() => Boolean(filters.search || filters.type !== 'all'))
const emptyDescription = computed(() => hasActiveFilters.value ? 'Nenhum status encontrado com os filtros aplicados.' : 'Nenhum status de agendamento encontrado.')

const filteredStatuses = computed(() => (statuses.value || []).filter((item) => {
  const q = filters.search.trim().toLowerCase()
  if (q && !item.name.toLowerCase().includes(q) && !item.code.toLowerCase().includes(q)) return false
  if (filters.type === 'system' && !item.isSystem) return false
  if (filters.type === 'custom' && item.isSystem) return false
  return true
}))

const pagedData = computed(() => {
  const start = (pagination.page - 1) * pagination.limit
  return filteredStatuses.value.slice(start, start + pagination.limit)
})

const summary = computed(() => {
  const total = statuses.value.length
  const system = statuses.value.filter((s) => s.isSystem).length
  const custom = total - system
  return { total, system, custom, immutable: system }
})

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: filteredStatuses.value.length,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))
const modalTitle = computed(() => {
  if (!editingStatus.value) return 'Novo status'
  if (editingStatus.value.isSystem) return 'Detalhes do status'
  return 'Editar status'
})
const modalSubtitle = computed(() => {
  if (!editingStatus.value) return 'Cadastre um status personalizado para o fluxo de agendamentos.'
  if (editingStatus.value.isSystem) return 'Consulte as informações deste status de agendamento.'
  return 'Atualize nome, código e disponibilidade do status.'
})

const buildActionOptions = (item: AppointmentStatus) => {
  if (item.isSystem) return [{ label: 'Ver detalhes', key: 'view' }]
  return [{ label: 'Editar', key: 'edit' }, { type: 'divider', key: `divider-${item.id}` }, { label: 'Excluir', key: 'delete' }]
}

const handleActionSelect = (key: string, item: AppointmentStatus) => {
  if (key === 'view' || key === 'edit') return openEdit(item)
  if (key === 'delete') return confirmDelete(item)
}

const columns = [
  { title: 'Status', key: 'name', render: (row: AppointmentStatus) => h('p', { class: 'item-name' }, row.name) },
  { title: 'Código', key: 'code', render: (row: AppointmentStatus) => h('span', { class: 'code-chip' }, row.code) },
  {
    title: 'Tipo',
    key: 'type',
    render: (row: AppointmentStatus) => h(NTag, { bordered: false, class: 'type-chip', style: typeTagStyle(row.isSystem) }, { default: () => row.isSystem ? 'Sistema' : 'Personalizado' })
  },
  { title: 'Atualizado em', key: 'updatedAt', render: (row: AppointmentStatus) => formatDate(String(row.updatedAt || '')) || '—' },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: AppointmentStatus) => h('div', { class: 'table-actions' }, [
      h(NButton, { size: 'small', secondary: true, type: 'primary', onClick: (e) => { e.stopPropagation(); openEdit(row) } }, { default: () => 'Ver status' }),
      h(NDropdown, { trigger: 'click', options: buildActionOptions(row), onSelect: (key: string) => handleActionSelect(key, row) }, {
        default: () => h(NButton, { size: 'small', quaternary: true, class: 'menu-button', onClick: (e) => e.stopPropagation() }, { default: () => '⋯' })
      })
    ])
  }
]

const fetchStatuses = async () => {
  loading.value = true
  try {
    const api = useApi()
    statuses.value = await api<AppointmentStatus[]>('/api/v1/appointment-statuses')
  } catch {
    message.error('Erro ao buscar status de agendamento')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: AppointmentStatus) => {
  saving.value = true
  try {
    const api = useApi()
    if (payload.id) {
      await api(`/api/v1/appointment-statuses/${payload.id}`, { method: 'PATCH', body: payload })
      message.success('Status atualizado')
    } else {
      await api('/api/v1/appointment-statuses', { method: 'POST', body: payload })
      message.success('Status criado')
    }
    closeModal()
    await fetchStatuses()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar status')
  } finally {
    saving.value = false
  }
}

const submitAppointmentStatusForm = async () => {
  if (editingStatus.value?.isSystem) return
  await appointmentStatusFormRef.value?.submit()
}

const confirmDelete = (status: AppointmentStatus) => {
  if (status.isSystem) {
    message.warning('Status nativo do sistema não pode ser excluído.')
    return
  }
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o status ${status.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/appointment-statuses/${status.id}`, { method: 'DELETE' })
        message.success('Status excluído')
        await fetchStatuses()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir status')
      }
    }
  })
}

const openCreate = () => { editingStatus.value = null; showModal.value = true }
const openEdit = (status: AppointmentStatus) => { editingStatus.value = status; showModal.value = true }
const closeModal = () => { showModal.value = false }

const onPageChange = (page: number) => { pagination.page = page }
const onPageSizeChange = (size: number) => { pagination.limit = size; pagination.page = 1 }

const handleFilter = () => { pagination.page = 1 }
const handleClearFilters = () => {
  filters.search = ''
  filters.type = 'all'
  mobileSearch.value = ''
  pagination.page = 1
  showMobileFilters.value = false
}
const applyMobileFilters = () => {
  filters.search = mobileSearch.value.trim()
  pagination.page = 1
  showMobileFilters.value = false
}

const rowProps = (row: AppointmentStatus) => ({ style: { cursor: 'pointer' }, onClick: () => openEdit(row) })

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  fetchStatuses()
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
h1 { margin: 0; font-size: 22px; line-height: 1.1; }
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

.item-name { margin: 0; font-weight: 700; color: #0f172a; }
.code-chip {
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #334155;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2px 8px;
}
.type-chip { border-radius: 999px; font-size: 11px; font-weight: 600; padding: 4px 10px; line-height: 1.15; border: 1px solid transparent; min-height: 24px; display: inline-flex; align-items: center; }
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
  h1 { font-size: 19px; }
  .subhead { font-size: 13px; }
  .modal-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .modal-actions .n-button { min-height: 44px; width: 100%; }
}
</style>

<style>
:root .n-modal-container:has(.appointment-status-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.appointment-status-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.appointment-status-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.appointment-status-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.appointment-status-modal.n-card {
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

.appointment-status-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.appointment-status-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.appointment-status-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .appointment-status-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .appointment-status-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .appointment-status-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .appointment-status-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }
}
</style>
