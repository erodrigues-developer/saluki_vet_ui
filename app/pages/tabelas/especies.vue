<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">TABELAS</p>
        <h1>Espécies</h1>
        <p class="subhead">Gerencie as espécies utilizadas no cadastro e atendimento dos pets.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="openCreate">Nova espécie</n-button>
    </div>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">ESPÉCIES CADASTRADAS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">ATIVAS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.active }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">INATIVAS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.inactive }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">RAÇAS VINCULADAS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.breedsLinked }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.search" placeholder="Buscar por nome" clearable />
        <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Status" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar por nome" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <div v-if="loading" class="skeleton-layout">
      <n-skeleton v-for="i in isMobile ? 3 : 6" :key="i" text :repeat="isMobile ? 4 : 1" />
    </div>

    <template v-else>
      <div v-if="isMobile" class="card-list">
        <template v-if="species.length">
          <div v-for="item in species" :key="item.id" class="entity-card" @click="openEdit(item)">
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle"><span class="card-line-label">Raças vinculadas:</span> {{ formatBreedsLinked(item) }}</p>
            <p class="card-subtitle card-status">
              <span class="card-line-label">Status:</span>
              <n-tag :bordered="false" :class="['status-chip', item.isActive ? 'status-active' : 'status-inactive']">
                {{ item.isActive ? 'Ativo' : 'Inativo' }}
              </n-tag>
            </p>
            <p class="card-subtitle card-subtitle-muted"><span class="card-line-label">Atualizado em:</span> {{ formatDate(item.updatedAt || '') || '—' }}</p>
            <div class="card-actions" @click.stop>
              <n-button size="small" secondary type="primary" @click="openEdit(item)">Ver espécie</n-button>
              <n-dropdown trigger="click" :options="buildActionOptions(item)" @select="(key: string) => handleActionSelect(key, item)">
                <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
              </n-dropdown>
            </div>
          </div>
          <div class="pagination-wrap">
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
        <n-empty v-else description="Nenhuma espécie encontrada.">
          <template #extra>
            <n-button type="primary" @click="openCreate">Nova espécie</n-button>
          </template>
        </n-empty>
      </div>

      <template v-else>
        <n-data-table
          v-if="species.length"
          :columns="columns"
          :data="species"
          :pagination="tablePagination"
          :bordered="false"
          :row-props="rowProps"
          remote
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
        <n-empty v-else description="Nenhuma espécie encontrada.">
          <template #extra>
            <n-button type="primary" @click="openCreate">Nova espécie</n-button>
          </template>
        </n-empty>
      </template>
    </template>

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

    <n-modal v-model:show="showModal" :mask-closable="false" preset="card" class="species-modal" style="width: 760px">
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingItem ? 'Editar espécie' : 'Nova espécie' }}</h3>
          <p class="modal-subtitle">
            {{ editingItem ? 'Atualize os dados e status da espécie.' : 'Cadastre uma nova espécie para classificação dos pets.' }}
          </p>
        </div>
      </template>

      <SpeciesForm
        ref="formRef"
        :value="editingItem"
        :loading="saving"
        @submit="handleSubmit"
        @validity-change="onFormValidityChange"
      />

      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" :disabled="!canSubmitForm" @click="submitForm">
            {{ editingItem ? 'Salvar alterações' : 'Criar espécie' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { format } from 'date-fns'
import { NButton, NDropdown, NTag, useDialog, useMessage } from 'naive-ui'
import SpeciesForm, { type Species } from '~/components/species/SpeciesForm.vue'

interface SpeciesResponse {
  data: Species[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

const message = useMessage()
const dialog = useDialog()

const species = ref<Species[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingItem = ref<Species | null>(null)
const formRef = ref<{ submit: () => Promise<void> } | null>(null)
const canSubmitForm = ref(false)

const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const filters = reactive({
  search: '',
  isActive: null as boolean | null
})

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Ativo', value: true },
  { label: 'Inativo', value: false }
]

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const summary = reactive({
  total: 0,
  active: 0,
  inactive: 0,
  breedsLinked: 0
})

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))


const formatDate = (value: string) => {
  if (!value) return ''
  return format(new Date(value), 'dd/MM/yyyy HH:mm')
}

const resolveBreedsCount = (row: Species) => Number((row as any).breedsCount || (row as any).breedCount || 0)
const formatBreedsLinked = (row: Species) => {
  const total = resolveBreedsCount(row)
  if (total <= 0) return 'Nenhuma'
  return `${total} ${total === 1 ? 'raça' : 'raças'}`
}

const hasLinks = (row: Species) => resolveBreedsCount(row) > 0 || Number((row as any).petsCount || 0) > 0

const buildActionOptions = (row: Species) => {
  const options: Array<{ label?: string; key: string; type?: 'divider' }> = [
    { label: 'Editar', key: 'edit' },
    { label: row.isActive ? 'Inativar' : 'Ativar', key: 'toggleStatus' }
  ]

  if (!hasLinks(row)) {
    options.push({ type: 'divider', key: `divider-${row.id}` })
    options.push({ label: 'Excluir', key: 'delete' })
  }

  return options
}

const handleActionSelect = (key: string, row: Species) => {
  if (key === 'edit') return openEdit(row)
  if (key === 'toggleStatus') return toggleStatus(row)
  if (key === 'delete') return confirmDelete(row)
}

const columns = [
  { title: 'Espécie', key: 'name' },
  { title: 'Raças vinculadas', key: 'breedsCount', render: (row: Species) => formatBreedsLinked(row) },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: Species) => h(NTag, {
      bordered: false,
      class: ['status-chip', row.isActive ? 'status-active' : 'status-inactive']
    }, { default: () => (row.isActive ? 'Ativo' : 'Inativo') })
  },
  { title: 'Atualizado em', key: 'updatedAt', render: (row: Species) => formatDate(row.updatedAt || '') || '—' },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: Species) => h('div', { class: 'table-actions' }, [
      h(NButton, {
        size: 'small',
        secondary: true,
        type: 'primary',
        onClick: (e) => {
          e.stopPropagation()
          openEdit(row)
        }
      }, { default: () => 'Ver espécie' }),
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

const fetchSpecies = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<SpeciesResponse>('/api/v1/species', {
      query: {
        page: pagination.page,
        limit: pagination.limit,
        name: filters.search || undefined,
        isActive: typeof filters.isActive === 'boolean' ? filters.isActive : undefined,
        sortBy: 'updatedAt',
        sortDirection: 'desc'
      }
    })

    species.value = res.data || []
    pagination.total = Number(res.meta?.total || 0)

    summary.total = pagination.total
    summary.active = species.value.filter((item) => item.isActive).length
    summary.inactive = species.value.filter((item) => !item.isActive).length
    summary.breedsLinked = species.value.reduce((acc, item) => acc + resolveBreedsCount(item), 0)
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar espécies')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: Species) => {
  saving.value = true
  try {
    const api = useApi()
    const body = {
      name: payload.name,
      isActive: payload.isActive,
    }
    if (payload.id) {
      await api(`/api/v1/species/${payload.id}`, { method: 'PATCH', body })
      message.success('Espécie atualizada')
    } else {
      await api('/api/v1/species', { method: 'POST', body })
      message.success('Espécie criada')
    }
    closeModal()
    await fetchSpecies()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar espécie')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: Species) => {
  if (hasLinks(item)) {
    message.warning('Não é possível excluir espécies com vínculos existentes.')
    return
  }

  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir ${item.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      try {
        const api = useApi()
        await api(`/api/v1/species/${item.id}`, { method: 'DELETE' })
        message.success('Espécie excluída')
        await fetchSpecies()
      } catch (err: any) {
        message.warning(err?.data?.message || 'Não é possível excluir espécies com vínculos existentes.')
      }
    }
  })
}

const toggleStatus = (item: Species) => {
  const actionLabel = item.isActive ? 'inativar' : 'ativar'
  dialog.warning({
    title: `Confirmar ${actionLabel}`,
    content: `Deseja ${actionLabel} ${item.name}?`,
    positiveText: item.isActive ? 'Inativar' : 'Ativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      try {
        const api = useApi()
        await api(`/api/v1/species/${item.id}`, {
          method: 'PATCH',
          body: { isActive: !item.isActive }
        })
        message.success(item.isActive ? 'Espécie inativada' : 'Espécie ativada')
        await fetchSpecies()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao atualizar status')
      }
    }
  })
}

const openCreate = () => {
  editingItem.value = null
  canSubmitForm.value = false
  showModal.value = true
}

const openEdit = (item: Species) => {
  editingItem.value = { ...item }
  canSubmitForm.value = true
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitForm = async () => {
  await formRef.value?.submit()
}

const onFormValidityChange = (valid: boolean) => {
  canSubmitForm.value = valid
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchSpecies()
}

const onPageSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchSpecies()
}

const handleFilter = () => {
  pagination.page = 1
  fetchSpecies()
}

const handleClearFilters = () => {
  filters.search = ''
  filters.isActive = null
  pagination.page = 1
  fetchSpecies()
}

const applyMobileFilters = () => {
  showMobileFilters.value = false
  handleFilter()
}

const rowProps = (row: Species) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  fetchSpecies()
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 768px)')
    updateIsMobile()
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', updateIsMobile)
    else mediaQuery.addListener(updateIsMobile)
  }
})

onBeforeUnmount(() => {
  if (!mediaQuery) return
  if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', updateIsMobile)
  else mediaQuery.removeListener(updateIsMobile)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
h1 { margin: 0; font-size: 22px; line-height: 1.1; }
.eyebrow { margin: 0; font-size: 12px; color: #6b7280; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.subhead { margin: 0; color: #64748b; font-size: 14px; }
.head-cta { min-width: 170px; }
.summary-grid { display: grid; gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-card { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; min-height: 112px; }
.summary-card :deep(.n-card__content) {
  padding: 14px 16px !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.summary-label { margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 500; }
.summary-value { display: block; margin-top: 10px; font-size: 32px; font-weight: 700; color: #111827; line-height: 1; }
.summary-value-mobile { display: block; margin-top: 8px; font-size: 26px; line-height: 1; font-weight: 700; color: #111827; }
.filters-card { border-radius: 14px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
.filters-grid { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(180px, 1fr) auto; gap: 12px; align-items: center; }
.filter-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.btn-clear { color: #6b7280; font-weight: 500; }
.btn-filter { width: 112px; }
:deep(.btn-filter.n-button) { border: 1px solid #334155; color: #1e293b; }
:deep(.btn-filter.n-button:hover) { border-color: #0f172a; color: #0f172a; }
.mobile-filters-card { padding: 8px; }
.mobile-filter-top { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.mobile-filter-trigger { white-space: nowrap; }
:deep(.mobile-filter-trigger.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
  background: #ffffff;
}
.skeleton-layout { display: grid; gap: 8px; }
.table-actions { display: inline-flex; align-items: center; gap: 8px; }
.menu-button { font-size: 18px; font-weight: 700; }
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
.status-inactive { background: #f3f4f6 !important; color: #374151 !important; border-color: #e5e7eb !important; }
:deep(.status-chip.n-tag) { border-width: 1px !important; }
:deep(.status-chip.status-active.n-tag) { background: #edf7ef !important; color: #28663b !important; border-color: #d5eadb !important; }
:deep(.status-chip.status-inactive.n-tag) { background: #f3f4f6 !important; color: #374151 !important; border-color: #e5e7eb !important; }
.card-list { display: flex; flex-direction: column; gap: 12px; }
.entity-card { border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; padding: 14px; display: flex; flex-direction: column; gap: 6px; }
.entity-card:hover { background: #f8fafc; }
.card-title { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
.card-subtitle { margin: 0; font-size: 13px; color: #334155; }
.card-subtitle-muted { color: #64748b; }
.card-line-label { font-weight: 600; color: #475569; }
.card-status { display: flex; align-items: center; gap: 8px; }
.card-actions { margin-top: 8px; display: flex; gap: 8px; justify-content: flex-end; }
.pagination-wrap { display: flex; justify-content: flex-end; }
.pagination-caption { margin: 4px 0 0; font-size: 13px; color: #64748b; }
.mobile-filters-panel { display: grid; gap: 12px; }
.mobile-filter-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; line-height: 1.2; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
@media (max-width: 768px) {
  .page-head { flex-direction: column; align-items: stretch; }
  h1 { font-size: 19px; }
  .head-cta { width: 100%; }
  .summary-grid, .summary-grid-mobile { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .modal-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .modal-actions .n-button { min-height: 44px; width: 100%; }
}
</style>

<style>
:root .n-modal-container:has(.species-modal) .n-modal-body-wrapper { display: flex; align-items: center; justify-content: center; }
:root .n-modal-container:has(.species-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.species-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.species-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content { width: 100%; display: flex; justify-content: center; }
.species-modal.n-card {
  --n-padding-top: 0; --n-padding-bottom: 0; --n-padding-left: 0; --n-padding-right: 0;
  width: 760px !important; max-width: calc(100vw - 24px) !important; max-height: calc(100vh - 48px) !important; max-height: calc(100dvh - 48px) !important;
  margin: 0 auto !important; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden;
}
.species-modal.n-card .n-card-header { flex: 0 0 auto; background: #fff; border-bottom: 1px solid #e5e7eb; padding: 16px 20px 12px; z-index: 4; }
.species-modal.n-card .n-card__content { flex: 1 1 auto; min-height: 0; max-height: none !important; overflow-y: auto; overflow-x: hidden; padding: 12px 16px 20px; scroll-padding-bottom: 88px; }
.species-modal.n-card .n-card__footer { flex: 0 0 auto; background: #fff; border-top: 1px solid #e5e7eb; box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05); padding: 10px 16px; z-index: 4; }
@media (max-width: 768px) {
  .species-modal.n-card { width: 100% !important; max-width: calc(100vw - 24px) !important; max-height: calc(100vh - 48px) !important; max-height: calc(100dvh - 48px) !important; }
  .species-modal.n-card .n-card-header { padding: 14px 14px 10px; }
  .species-modal.n-card .n-card__content { padding: 10px 12px 16px; scroll-padding-bottom: 96px; -webkit-overflow-scrolling: touch; }
  .species-modal.n-card .n-card__footer { padding: 8px 12px; }
}
</style>
