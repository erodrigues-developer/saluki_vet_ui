<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">BOXES</p>
        <h1>Cadastro de boxes</h1>
        <p class="subhead">Gerencie leitos, canis, gatis e áreas de internação disponíveis na clínica.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="openCreate">
        Novo box
      </n-button>
    </div>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Boxes cadastrados</p>
        <strong class="summary-value">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Ativos</p>
        <strong class="summary-value">{{ summary.active }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Ocupados</p>
        <strong class="summary-value">{{ summary.occupied }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Livres</p>
        <strong class="summary-value">{{ summary.available }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Boxes cadastrados</p>
        <strong class="summary-value-mobile">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Ativos</p>
        <strong class="summary-value-mobile">{{ summary.active }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Ocupados</p>
        <strong class="summary-value-mobile">{{ summary.occupied }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Livres</p>
        <strong class="summary-value-mobile">{{ summary.available }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.name" placeholder="Buscar box ou descrição" clearable />
        <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Situação do cadastro" clearable />
        <n-select v-model:value="filters.occupancyStatus" :options="occupancyOptions" placeholder="Ocupação atual" clearable />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="fetchBoxes">Filtrar</n-button>
        </div>
      </div>
    </n-card>
    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.name" placeholder="Buscar box ou descrição" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="box in boxes"
        :key="box.id"
        class="entity-card"
        @click="openEdit(box)"
      >
        <div class="card-head">
          <div class="card-copy">
            <p class="card-title" :title="box.name">{{ box.name }}</p>
            <p class="card-subtitle" :title="displayValue(box.description)">{{ displayValue(box.description) }}</p>
          </div>
          <div class="card-badges">
            <n-tag :bordered="false" :class="['occupancy-chip', occupancyChipClass(box.occupancyStatus)]">
              {{ occupancyLabel(box.occupancyStatus) }}
            </n-tag>
            <n-tag :bordered="false" :class="['status-chip', statusChipClass(box.isActive)]">
              {{ box.isActive ? 'Ativo' : 'Inativo' }}
            </n-tag>
          </div>
        </div>
        <div class="card-meta">
          <p class="card-line">
            <span class="card-line-label">Paciente:</span>
            <span class="card-line-value" :title="displayPatient(box)">{{ displayPatient(box) }}</span>
          </p>
          <p class="card-line">
            <span class="card-line-label">Atualizado:</span>
            <span class="card-line-value">{{ formatDate(box.updatedAt || '') || '—' }}</span>
          </p>
        </div>
        <div class="card-actions" @click.stop>
          <n-button size="small" secondary type="primary" @click="openEdit(box)">Ver ficha</n-button>
          <n-dropdown trigger="click" :options="actionOptions" @select="(key: string) => handleActionSelect(key, box)">
            <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
          </n-dropdown>
        </div>
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="boxes"
      :pagination="pagination"
      :bordered="false"
      :sorter="sorter"
      :row-props="rowProps"
      @update:sorter="onSorterChange"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
      remote
    />

    <div v-if="isMobile" class="pagination">
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

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="48%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Situação do cadastro" clearable />
          <n-select v-model:value="filters.occupancyStatus" :options="occupancyOptions" placeholder="Ocupação atual" clearable />
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
      class="box-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingBox ? 'Editar box' : 'Novo box' }}</h3>
          <p class="modal-subtitle">
            {{ editingBox ? 'Atualize os dados cadastrais do leito e mantenha a disponibilidade da internação organizada.' : 'Cadastre um novo box para uso no painel de internação e admissões clínicas.' }}
          </p>
        </div>
      </template>
      <BoxForm
        ref="boxFormRef"
        :value="editingBox"
        :loading="saving"
        @submit="handleSubmit"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitBoxForm">
            {{ editingBox ? 'Salvar alterações' : 'Criar box' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NTag, useDialog, useMessage } from 'naive-ui'
import BoxForm, { type BoxEntity } from '~/components/boxes/BoxForm.vue'

interface BoxesResponse {
  data: BoxEntity[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

const message = useMessage()
const dialog = useDialog()
const router = useRouter()

const filters = reactive({
  name: '',
  isActive: null as boolean | null,
  occupancyStatus: null as 'AVAILABLE' | 'OCCUPIED' | null,
})

const boxes = ref<BoxEntity[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingBox = ref<BoxEntity | null>(null)
const boxFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const activeRequestId = ref(0)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const sorter = ref<{ columnKey: string; order: 'ascend' | 'descend' | false }>({
  columnKey: 'updatedAt',
  order: 'descend',
})

const statusOptions = [
  { label: 'Ativos', value: true },
  { label: 'Inativos', value: false },
]

const occupancyOptions = [
  { label: 'Ocupados', value: 'OCCUPIED' },
  { label: 'Livres', value: 'AVAILABLE' },
]

const actionOptions = [
  { label: 'Editar', key: 'edit' },
  { label: 'Abrir internação', key: 'inpatient' },
  { type: 'divider', key: 'divider' },
  { label: 'Excluir', key: 'delete' },
]

const summary = computed(() => {
  const rows = boxes.value
  return {
    total: pagination.itemCount,
    active: rows.filter((box) => box.isActive).length,
    occupied: rows.filter((box) => box.occupancyStatus === 'OCCUPIED').length,
    available: rows.filter((box) => box.occupancyStatus !== 'OCCUPIED').length,
  }
})

const statusChipClass = (isActive: boolean) => (isActive ? 'chip-active' : 'chip-inactive')
const occupancyChipClass = (status?: string | null) =>
  status === 'OCCUPIED' ? 'chip-occupied' : 'chip-available'

const occupancyLabel = (status?: string | null) =>
  status === 'OCCUPIED' ? 'Ocupado' : 'Livre'

const displayPatient = (box: BoxEntity) => box.currentInpatient?.pet?.name || '—'

const columns = [
  {
    title: 'Box / Descrição',
    key: 'name',
    sorter: true,
    render: (row: BoxEntity) =>
      h('div', { class: 'box-cell' }, [
        h('p', { class: 'box-name ellipsis', title: row.name }, row.name),
        h(
          'p',
          { class: 'box-description ellipsis', title: displayValue(row.description) },
          displayValue(row.description),
        ),
      ]),
  },
  {
    title: 'Cadastro',
    key: 'isActive',
    sorter: true,
    render: (row: BoxEntity) =>
      h(
        NTag,
        {
          bordered: false,
          class: ['status-chip', statusChipClass(row.isActive)],
        },
        { default: () => (row.isActive ? 'Ativo' : 'Inativo') },
      ),
  },
  {
    title: 'Ocupação',
    key: 'occupancyStatus',
    render: (row: BoxEntity) =>
      h(
        NTag,
        {
          bordered: false,
          class: ['occupancy-chip', occupancyChipClass(row.occupancyStatus)],
        },
        { default: () => occupancyLabel(row.occupancyStatus) },
      ),
  },
  {
    title: 'Paciente atual',
    key: 'currentInpatient',
    render: (row: BoxEntity) =>
      h(
        'span',
        {
          class: ['ellipsis', valueClass(displayPatient(row))],
          title: displayPatient(row),
        },
        displayPatient(row),
      ),
  },
  {
    title: 'Atualizado em',
    key: 'updatedAt',
    sorter: true,
    render: (row: BoxEntity) => formatDate(row.updatedAt || ''),
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 180,
    render: (row: BoxEntity) =>
      h('div', { class: 'actions' }, [
        h(
          NButton,
          {
            size: 'small',
            secondary: true,
            type: 'primary',
            class: 'action-primary',
            onClick: (e) => {
              e.stopPropagation()
              openEdit(row)
            },
          },
          { default: () => 'Ver ficha' },
        ),
        h(
          NDropdown,
          {
            trigger: 'click',
            options: actionOptions,
            onSelect: (key: string) => handleActionSelect(key, row),
          },
          {
            default: () =>
              h(
                NButton,
                {
                  size: 'small',
                  quaternary: true,
                  class: 'menu-button',
                  onClick: (e) => e.stopPropagation(),
                },
                { default: () => '⋯' },
              ),
          },
        ),
      ]),
  },
]

const buildQuery = () => {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.pageSize,
  }
  if (filters.name) params.name = filters.name
  if (filters.isActive !== null) params.isActive = filters.isActive
  if (filters.occupancyStatus) params.occupancyStatus = filters.occupancyStatus
  if (sorter.value.columnKey) params.sortBy = sorter.value.columnKey
  if (sorter.value.order) params.sortDirection = sorter.value.order === 'ascend' ? 'asc' : 'desc'
  return params
}

const fetchBoxes = async () => {
  const requestId = ++activeRequestId.value
  loading.value = true
  try {
    const api = useApi()
    const { data, meta } = await api<BoxesResponse>('/api/v1/boxes', {
      query: buildQuery(),
    })
    if (requestId !== activeRequestId.value) return
    boxes.value = data
    pagination.itemCount = meta.total
    pagination.page = meta.page
    pagination.pageSize = meta.limit
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar boxes')
  } finally {
    if (requestId === activeRequestId.value) {
      loading.value = false
    }
  }
}

const handleSubmit = async (payload: BoxEntity) => {
  saving.value = true
  const api = useApi()
  try {
    const { id, occupancyStatus, currentInpatient, createdAt, updatedAt, ...body } = payload
    if (payload.id) {
      await api(`/api/v1/boxes/${payload.id}`, {
        method: 'PATCH',
        body,
      })
      message.success('Box atualizado')
    } else {
      await api('/api/v1/boxes', {
        method: 'POST',
        body,
      })
      message.success('Box criado')
    }
    closeModal()
    await fetchBoxes()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar box')
  } finally {
    saving.value = false
  }
}

const submitBoxForm = async () => {
  await boxFormRef.value?.submit()
}

const confirmDelete = (box: BoxEntity) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir ${box.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/boxes/${box.id}`, {
          method: 'DELETE',
        })
        message.success('Box excluído')
        await fetchBoxes()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir box')
      }
    },
  })
}

const handleActionSelect = (key: string, box: BoxEntity) => {
  if (key === 'edit') {
    openEdit(box)
    return
  }

  if (key === 'inpatient') {
    router.push({
      path: '/atendimento/internacao',
      query: box.id ? { boxId: String(box.id) } : undefined,
    })
    return
  }

  if (key === 'delete') {
    confirmDelete(box)
  }
}

const openCreate = () => {
  editingBox.value = null
  showModal.value = true
}

const openEdit = (box: BoxEntity) => {
  editingBox.value = box
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleClearFilters = () => {
  filters.name = ''
  filters.isActive = null
  filters.occupancyStatus = null
  sorter.value = { columnKey: 'updatedAt', order: 'descend' }
  pagination.page = 1
  fetchBoxes()
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchBoxes()
}

const onPageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchBoxes()
}

const applyMobileFilters = () => {
  showMobileFilters.value = false
  pagination.page = 1
  fetchBoxes()
}

const onSorterChange = (state: { columnKey?: string | number; order?: 'ascend' | 'descend' | false }) => {
  sorter.value = {
    columnKey: (state.columnKey as string) || 'updatedAt',
    order: state.order || 'descend',
  }
  pagination.page = 1
  fetchBoxes()
}

const rowProps = (row: BoxEntity) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row),
})

onMounted(() => {
  fetchBoxes()
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 768px)')
    updateIsMobile()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile)
    } else {
      mediaQuery.addListener(updateIsMobile)
    }
  }
})

onBeforeUnmount(() => {
  if (!mediaQuery) return
  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener('change', updateIsMobile)
  } else {
    mediaQuery.removeListener(updateIsMobile)
  }
})

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const displayValue = (value?: string | null) => {
  const text = (value ?? '').trim()
  return text ? text : '—'
}

const valueClass = (value?: string | null) => {
  const text = (value ?? '').trim()
  return text ? 'value-strong' : 'value-empty'
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.head-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #4b5563;
  margin: 0;
}

h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
}

.subhead {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-grid-mobile {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mobile-card {
  min-height: 88px;
  height: 88px;
  padding-top: 6px;
  padding-bottom: 6px;
}

.mobile-card :deep(.n-card__content) {
  padding: 10px 12px !important;
  height: 100%;
  box-sizing: border-box;
}

.summary-value-mobile {
  display: block;
  margin-top: 8px;
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  color: #111827;
}

.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  min-height: 112px;
}

.summary-card :deep(.n-card__content) {
  padding: 14px 16px !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.summary-label {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.summary-value {
  font-size: 30px;
  line-height: 1;
  color: #111827;
}

.filters-card {
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.filters-card :deep(.n-card__content) {
  padding: 14px !important;
}

.filters-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(200px, 1fr) minmax(200px, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-clear {
  color: #64748b;
}

.btn-filter {
  min-width: 120px;
}

.mobile-filters-card :deep(.n-card__content) {
  padding: 12px !important;
}

.mobile-filter-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.mobile-filter-trigger {
  min-width: 102px;
}

.inline-icon-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.entity-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-copy {
  min-width: 0;
}

.card-badges {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.card-meta {
  display: grid;
  gap: 6px;
}

.card-line {
  margin: 0;
  font-size: 13px;
  color: #334155;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.card-line-label {
  color: #64748b;
}

.card-line-value {
  text-align: right;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.mobile-filters-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-filter-actions,
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.box-cell,
.actions {
  display: flex;
  align-items: center;
}

.box-cell {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.box-name {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.box-description {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.actions {
  justify-content: flex-end;
  gap: 8px;
}

.status-chip,
.occupancy-chip {
  font-weight: 600;
}

.chip-active {
  background: #dcfce7;
  color: #166534;
}

.chip-inactive {
  background: #e5e7eb;
  color: #475569;
}

.chip-occupied {
  background: #fee2e2;
  color: #b91c1c;
}

.chip-available {
  background: #dbeafe;
  color: #1d4ed8;
}

.ellipsis {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value-strong {
  color: #0f172a;
}

.value-empty {
  color: #94a3b8;
}

@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
  }

  .head-cta {
    width: 100%;
  }
}
</style>

<style>
:root .n-modal-container:has(.box-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.box-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.box-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.box-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.box-modal.n-card {
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

.box-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.box-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.box-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.box-modal .modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.box-modal .modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.box-modal .modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.box-modal .modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .box-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .box-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .box-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .box-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .box-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .box-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
