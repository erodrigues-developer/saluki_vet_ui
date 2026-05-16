<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CADASTROS</p>
        <h1>Tipos de agendamento</h1>
        <p class="subhead">Gerencie tipos de atendimento, duração padrão e status de disponibilidade.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="openCreate">Novo tipo</n-button>
    </div>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">TIPOS CADASTRADOS</p>
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
        <p class="summary-label">DURAÇÃO MÉDIA</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.averageDuration }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.search" placeholder="Buscar por nome ou descrição" clearable />
        <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Status" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar por nome ou descrição" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div v-for="item in paginatedTypes" :key="item.id" class="entity-card" @click="openEdit(item)">
        <p class="card-title">{{ item.name }}</p>
        <p class="card-subtitle">{{ item.description || '—' }}</p>
        <p class="card-subtitle"><span class="card-line-label">Duração:</span> {{ item.defaultDurationMinutes }} min</p>
        <p class="card-subtitle card-status">
          <span class="card-line-label">Status:</span>
          <n-tag :bordered="false" :class="['status-chip', item.isActive ? 'status-active' : 'status-inactive']">
            {{ item.isActive ? 'Ativo' : 'Inativo' }}
          </n-tag>
        </p>
        <p class="card-subtitle card-subtitle-muted"><span class="card-line-label">Atualizado em:</span> {{ formatDate(item.updatedAt || '') || '—' }}</p>
        <div class="card-actions" @click.stop>
          <n-button size="small" secondary type="primary" @click="openEdit(item)">Ver tipo</n-button>
          <n-dropdown trigger="click" :options="buildActionOptions(item)" @select="(key: string) => handleActionSelect(key, item)">
            <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
          </n-dropdown>
        </div>
      </div>
      <div class="pagination">
        <n-pagination
          :page="pagination.page"
          :page-size="pagination.limit"
          :item-count="filteredTypes.length"
          show-size-picker
          :page-sizes="[10, 20, 50]"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="paginatedTypes"
      :pagination="tablePagination"
      :bordered="false"
      :row-props="rowProps"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="40%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Status" />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      class="appointment-type-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingType ? 'Editar tipo de agendamento' : 'Novo tipo de agendamento' }}</h3>
          <p class="modal-subtitle">
            {{ editingType ? 'Atualize os dados do tipo, duração padrão e status.' : 'Cadastre um tipo de atendimento e defina sua duração padrão.' }}
          </p>
        </div>
      </template>
      <AppointmentTypeForm
        ref="appointmentTypeFormRef"
        :value="editingType"
        :loading="saving"
        @submit="handleSubmit"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitAppointmentTypeForm">
            {{ editingType ? 'Salvar alterações' : 'Criar tipo' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NTag, useDialog, useMessage } from 'naive-ui'
import { format } from 'date-fns'
import AppointmentTypeForm, { type AppointmentType } from '~/components/appointment-types/AppointmentTypeForm.vue'

const message = useMessage()
const dialog = useDialog()

const filters = reactive({
  search: '',
  isActive: null as boolean | null
})

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Ativos', value: true },
  { label: 'Inativos', value: false }
]

const types = ref<AppointmentType[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingType = ref<AppointmentType | null>(null)
const appointmentTypeFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const blockedDeleteIds = ref<Set<number>>(new Set())
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const pagination = reactive({
  page: 1,
  limit: 10
})

const formatDate = (value: string) => {
  if (!value) return ''
  return format(new Date(value), 'dd/MM/yyyy HH:mm')
}

const filteredTypes = computed(() => {
  const searchTerm = filters.search.trim().toLowerCase()
  return types.value.filter((item) => {
    const matchesSearch = !searchTerm
      || item.name.toLowerCase().includes(searchTerm)
      || (item.description || '').toLowerCase().includes(searchTerm)
    const matchesStatus = filters.isActive === null || item.isActive === filters.isActive
    return matchesSearch && matchesStatus
  })
})

const paginatedTypes = computed(() => {
  const start = (pagination.page - 1) * pagination.limit
  return filteredTypes.value.slice(start, start + pagination.limit)
})

const summary = computed(() => {
  const rows = filteredTypes.value
  const total = rows.length
  const active = rows.filter((row) => row.isActive).length
  const inactive = rows.filter((row) => !row.isActive).length
  const averageRaw = total ? rows.reduce((acc, row) => acc + Number(row.defaultDurationMinutes || 0), 0) / total : 0
  return {
    total,
    active,
    inactive,
    averageDuration: `${Math.round(averageRaw)} min`
  }
})

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: filteredTypes.value.length,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))

const canDeleteType = (row: AppointmentType) => !blockedDeleteIds.value.has(Number(row.id))

const buildActionOptions = (row: AppointmentType) => {
  const options: Array<{ label?: string; key: string; type?: 'divider' }> = [
    { label: 'Editar', key: 'edit' },
    { label: row.isActive ? 'Inativar' : 'Ativar', key: 'toggleStatus' }
  ]

  if (canDeleteType(row)) {
    options.push({ type: 'divider', key: `divider-${row.id}` })
    options.push({ label: 'Excluir', key: 'delete' })
  }

  return options
}

const handleActionSelect = (key: string, row: AppointmentType) => {
  if (key === 'edit') {
    openEdit(row)
    return
  }
  if (key === 'toggleStatus') {
    toggleStatus(row)
    return
  }
  if (key === 'delete') {
    confirmDelete(row)
  }
}

const columns = [
  { title: 'Tipo', key: 'name' },
  { title: 'Descrição', key: 'description', render: (row: AppointmentType) => row.description || '—' },
  { title: 'Duração', key: 'defaultDurationMinutes', render: (row: AppointmentType) => `${row.defaultDurationMinutes} min` },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: AppointmentType) =>
      h(NTag, {
        bordered: false,
        class: ['status-chip', row.isActive ? 'status-active' : 'status-inactive']
      }, { default: () => (row.isActive ? 'Ativo' : 'Inativo') })
  },
  { title: 'Atualizado em', key: 'updatedAt', render: (row: AppointmentType) => formatDate(row.updatedAt || '') || '—' },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: AppointmentType) =>
      h('div', { class: 'table-actions' }, [
        h(NButton, {
          size: 'small',
          secondary: true,
          type: 'primary',
          onClick: (e) => {
            e.stopPropagation()
            openEdit(row)
          }
        }, { default: () => 'Ver tipo' }),
        h(NDropdown, {
          trigger: 'click',
          options: buildActionOptions(row),
          onSelect: (key: string) => handleActionSelect(key, row)
        }, {
          default: () => h(NButton, {
            size: 'small',
            quaternary: true,
            class: 'menu-button',
            onClick: (e) => e.stopPropagation()
          }, { default: () => '⋯' })
        })
      ])
  }
]

const fetchTypes = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<AppointmentType[]>('/api/v1/appointment-types')
    types.value = res
  } catch (err) {
    message.error('Erro ao buscar tipos de agendamento')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: AppointmentType) => {
  const duplicateActive = types.value.some((item) => {
    if (payload.id && Number(item.id) === Number(payload.id)) return false
    return item.isActive && payload.isActive && item.name.trim().toLowerCase() === payload.name.trim().toLowerCase()
  })

  if (duplicateActive) {
    message.error('Já existe um tipo ativo com esse nome.')
    return
  }

  saving.value = true
  const api = useApi()
  try {
    if (payload.id) {
      await api(`/api/v1/appointment-types/${payload.id}`, { method: 'PATCH', body: payload })
      message.success('Tipo atualizado')
    } else {
      await api('/api/v1/appointment-types', { method: 'POST', body: payload })
      message.success('Tipo criado')
    }
    closeModal()
    await fetchTypes()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar tipo')
  } finally {
    saving.value = false
  }
}

const submitAppointmentTypeForm = async () => {
  await appointmentTypeFormRef.value?.submit()
}

const toggleStatus = (type: AppointmentType) => {
  const label = type.isActive ? 'inativar' : 'ativar'
  dialog.warning({
    title: `Confirmar ${label}`,
    content: `Deseja ${label} o tipo ${type.name}?`,
    positiveText: type.isActive ? 'Inativar' : 'Ativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/appointment-types/${type.id}`, {
          method: 'PATCH',
          body: { isActive: !type.isActive }
        })
        message.success(type.isActive ? 'Tipo inativado' : 'Tipo ativado')
        await fetchTypes()
      } catch (err) {
        message.error('Erro ao atualizar status')
      }
    }
  })
}

const confirmDelete = (type: AppointmentType) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o tipo ${type.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/appointment-types/${type.id}`, { method: 'DELETE' })
        message.success('Tipo excluído')
        await fetchTypes()
      } catch (err: any) {
        await handleDeleteBlocked(type, err?.data?.message)
      }
    }
  })
}

const handleDeleteBlocked = async (type: AppointmentType, messageText?: string) => {
  const lowered = (messageText || '').toLowerCase()
  const hasLinkError = lowered.includes('foreign key')
    || lowered.includes('constraint')
    || lowered.includes('referenc')
    || lowered.includes('vincul')
    || lowered.includes('agendamento')

  if (!hasLinkError) {
    message.error(messageText || 'Erro ao excluir tipo')
    return
  }

  blockedDeleteIds.value = new Set([...blockedDeleteIds.value, Number(type.id)])

  dialog.warning({
    title: 'Exclusão indisponível',
    content: 'Este tipo já está vinculado a agendamentos existentes e não pode ser excluído. Deseja inativar esse tipo?',
    positiveText: 'Inativar tipo',
    negativeText: 'Fechar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/appointment-types/${type.id}`, {
          method: 'PATCH',
          body: { isActive: false }
        })
        message.success('Tipo inativado')
        await fetchTypes()
      } catch (err) {
        message.error('Não foi possível inativar o tipo')
      }
    }
  })
}

const openCreate = () => {
  editingType.value = null
  showModal.value = true
}

const openEdit = (type: AppointmentType) => {
  editingType.value = type
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const rowProps = (row: AppointmentType) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

const onPageChange = (page: number) => {
  pagination.page = page
}

const onPageSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
}

const handleFilter = () => {
  pagination.page = 1
}

const handleClearFilters = () => {
  filters.search = ''
  filters.isActive = null
  pagination.page = 1
}

const applyMobileFilters = () => {
  pagination.page = 1
  showMobileFilters.value = false
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  fetchTypes()
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

.summary-grid { display: grid; gap: 10px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-grid-mobile { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.summary-card { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; min-height: 112px; }
.summary-card :deep(.n-card__content) {
  padding: 14px 16px !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.summary-label {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  font-weight: 500;
}
.summary-value { display: block; margin-top: 10px; font-size: 32px; font-weight: 700; color: #111827; line-height: 1; }
.summary-value-mobile { display: block; margin-top: 8px; font-size: 26px; line-height: 1; font-weight: 700; color: #111827; }

.filters-card { border-radius: 14px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
.filters-grid { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(180px, 1fr) auto; gap: 12px; align-items: center; }
.filter-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.btn-clear { color: #6b7280; font-weight: 500; }
.btn-filter { width: 112px; }
:deep(.btn-filter.n-button) { border: 1px solid #334155; color: #1e293b; }
:deep(.btn-filter.n-button:hover) { border-color: #0f172a; color: #0f172a; }

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
.table-actions { display: flex; align-items: center; gap: 8px; }
.status-chip {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  line-height: 1.15;
  border: 1px solid transparent;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
}
.status-active { background: #edf7ef !important; color: #28663b !important; border-color: #d5eadb !important; }
.status-inactive { background: #fef2f2 !important; color: #9f1239 !important; border-color: #fdd3de !important; }
:deep(.status-chip.n-tag) { border-width: 1px !important; }
:deep(.status-chip.status-active.n-tag) { background: #edf7ef !important; color: #28663b !important; border-color: #d5eadb !important; }
:deep(.status-chip.status-inactive.n-tag) { background: #fef2f2 !important; color: #9f1239 !important; border-color: #fdd3de !important; }

.mobile-filters-card { padding: 8px; }
.mobile-filter-top { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.mobile-filter-trigger { white-space: nowrap; }
:deep(.mobile-filter-trigger.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
  background: #ffffff;
}
:deep(.mobile-filter-trigger.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}
.mobile-filters-panel { display: grid; gap: 12px; }
.mobile-filter-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; }

.card-list { display: flex; flex-direction: column; gap: 12px; }
.entity-card { border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; padding: 14px; }
.card-title { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
.card-subtitle { margin: 6px 0 0; color: #475569; font-size: 13px; line-height: 1.4; }
.card-subtitle-muted { color: #94a3b8; }
.card-status { display: flex; align-items: center; gap: 8px; }
.card-line-label { color: #64748b; font-weight: 600; }
.card-actions { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.menu-button { letter-spacing: 1px; font-weight: 700; }
.pagination { display: flex; justify-content: center; padding: 4px 0 2px; }

.modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .head-cta { width: 100%; }
  h1 { font-size: 19px; }

  .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>

<style>
:root .n-modal-container:has(.appointment-type-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.appointment-type-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.appointment-type-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.appointment-type-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.appointment-type-modal.n-card {
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

.appointment-type-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.appointment-type-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.appointment-type-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .appointment-type-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .appointment-type-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .appointment-type-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .appointment-type-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }
}
</style>
