<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CADASTROS</p>
        <h1>Categorias de produto</h1>
        <p class="subhead">Gerencie categorias utilizadas para organização dos produtos da clínica.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="openCreate">Nova categoria</n-button>
    </div>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">CATEGORIAS CADASTRADAS</p>
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
        <p class="summary-label">PRODUTOS VINCULADOS</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.productsLinked }}</strong>
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
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">🔎 Filtros</n-button>
      </div>
    </n-card>

    <div v-if="loading" class="skeleton-layout">
      <n-skeleton v-for="i in isMobile ? 3 : 6" :key="i" text :repeat="isMobile ? 4 : 1" />
    </div>

    <template v-else>
      <div v-if="isMobile" class="card-list">
        <template v-if="categories.length">
          <div v-for="item in categories" :key="item.id" class="entity-card" @click="openEdit(item)">
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle">{{ item.description || '—' }}</p>
            <p class="card-subtitle"><span class="card-line-label">Produtos vinculados:</span> {{ formatProductsLinked(item.productsLinked) }}</p>
            <p class="card-subtitle card-status">
              <span class="card-line-label">Status:</span>
              <n-tag :bordered="false" :class="['status-chip', item.isActive ? 'status-active' : 'status-inactive']">
                {{ item.isActive ? 'Ativo' : 'Inativo' }}
              </n-tag>
            </p>
            <p class="card-subtitle card-subtitle-muted"><span class="card-line-label">Atualizado em:</span> {{ formatDate(item.updatedAt || '') || '—' }}</p>
            <div class="card-actions" @click.stop>
              <n-button size="small" secondary type="primary" @click="openEdit(item)">Ver categoria</n-button>
              <n-dropdown trigger="click" :options="buildActionOptions(item)" @select="(key: string) => handleActionSelect(key, item)">
                <n-button size="small" quaternary class="menu-button">•••</n-button>
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
        <n-empty v-else description="Nenhuma categoria encontrada.">
          <template #extra>
            <n-button type="primary" @click="openCreate">Nova categoria</n-button>
          </template>
        </n-empty>
      </div>

      <template v-else>
        <n-data-table
          v-if="categories.length"
          :columns="columns"
          :data="categories"
          :pagination="tablePagination"
          :bordered="false"
          :row-props="rowProps"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
          remote
        />
        <n-empty v-else description="Nenhuma categoria encontrada.">
          <template #extra>
            <n-button type="primary" @click="openCreate">Nova categoria</n-button>
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

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      class="category-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingCategory ? 'Editar categoria' : 'Nova categoria' }}</h3>
          <p class="modal-subtitle">
            {{ editingCategory ? 'Atualize os dados e status da categoria.' : 'Cadastre uma nova categoria para organização dos produtos.' }}
          </p>
        </div>
      </template>
      <ProductCategoryForm
        ref="categoryFormRef"
        :value="editingCategory"
        :loading="saving"
        @submit="handleSubmit"
        @validity-change="onCategoryFormValidityChange"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" :disabled="!canSubmitCategoryForm" @click="submitCategoryForm">
            {{ editingCategory ? 'Salvar alterações' : 'Criar categoria' }}
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
import ProductCategoryForm, { type ProductCategory } from '~/components/product-categories/ProductCategoryForm.vue'

interface ProductCategoriesResponse {
  data: ProductCategory[]
  meta: {
    page: number
    limit: number
    total: number
    summary?: {
      total: number
      active: number
      inactive: number
      productsLinked: number
    }
  }
}

const message = useMessage()
const dialog = useDialog()

const filters = reactive({
  search: '',
  isActive: null as boolean | null
})

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Ativo', value: true },
  { label: 'Inativo', value: false }
]

const categories = ref<ProductCategory[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingCategory = ref<ProductCategory | null>(null)
const categoryFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const canSubmitCategoryForm = ref(false)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})
const summaryData = reactive({
  total: 0,
  active: 0,
  inactive: 0,
  productsLinked: 0
})

const formatDate = (value: string) => {
  if (!value) return ''
  return format(new Date(value), 'dd/MM/yyyy HH:mm')
}

const formatProductsLinked = (value?: number) => {
  const total = Number(value || 0)
  if (total === 0) return 'Nenhum'
  return `${total} ${total === 1 ? 'produto' : 'produtos'}`
}

const summary = computed(() => {
  return {
    total: summaryData.total,
    active: summaryData.active,
    inactive: summaryData.inactive,
    productsLinked: summaryData.productsLinked
  }
})

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))

const canDeleteCategory = (row: ProductCategory) => Number(row.productsLinked || 0) === 0

const buildActionOptions = (row: ProductCategory) => {
  const options: Array<{ label?: string; key: string; type?: 'divider' }> = [
    { label: 'Editar', key: 'edit' },
    { label: row.isActive ? 'Inativar' : 'Ativar', key: 'toggleStatus' }
  ]

  if (canDeleteCategory(row)) {
    options.push({ type: 'divider', key: `divider-${row.id}` })
    options.push({ label: 'Excluir', key: 'delete' })
  }

  return options
}

const handleActionSelect = (key: string, row: ProductCategory) => {
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
  { title: 'Categoria', key: 'name' },
  { title: 'Descrição', key: 'description', render: (row: ProductCategory) => row.description || '—' },
  {
    title: 'Produtos vinculados',
    key: 'productsLinked',
    render: (row: ProductCategory) => formatProductsLinked(row.productsLinked)
  },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: ProductCategory) =>
      h(NTag, {
        bordered: false,
        class: ['status-chip', row.isActive ? 'status-active' : 'status-inactive']
      }, { default: () => (row.isActive ? 'Ativo' : 'Inativo') })
  },
  { title: 'Atualizado em', key: 'updatedAt', render: (row: ProductCategory) => formatDate(row.updatedAt || '') || '—' },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: ProductCategory) =>
      h('div', { class: 'table-actions' }, [
        h(NButton, {
          size: 'small',
          secondary: true,
          type: 'primary',
          onClick: (e) => {
            e.stopPropagation()
            openEdit(row)
          }
        }, { default: () => 'Ver categoria' }),
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
          }, { default: () => '•••' })
        })
      ])
  }
]

const fetchCategories = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<ProductCategoriesResponse>('/api/v1/product-categories', {
      query: {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        isActive: typeof filters.isActive === 'boolean' ? filters.isActive : undefined,
        sortBy: 'updatedAt',
        sortDirection: 'desc'
      }
    })
    categories.value = res.data
    pagination.total = Number(res.meta?.total || 0)
    summaryData.total = Number(res.meta?.summary?.total || 0)
    summaryData.active = Number(res.meta?.summary?.active || 0)
    summaryData.inactive = Number(res.meta?.summary?.inactive || 0)
    summaryData.productsLinked = Number(res.meta?.summary?.productsLinked || 0)
  } catch (err) {
    message.error('Erro ao buscar categorias')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: ProductCategory) => {
  saving.value = true
  const api = useApi()
  try {
    if (payload.id) {
      await api(`/api/v1/product-categories/${payload.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Categoria atualizada')
    } else {
      await api('/api/v1/product-categories', {
        method: 'POST',
        body: payload
      })
      message.success('Categoria criada')
    }
    closeModal()
    await fetchCategories()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar categoria')
  } finally {
    saving.value = false
  }
}

const submitCategoryForm = async () => {
  await categoryFormRef.value?.submit()
}

const toggleStatus = (category: ProductCategory) => {
  const label = category.isActive ? 'inativar' : 'ativar'
  dialog.warning({
    title: `Confirmar ${label}`,
    content: `Deseja ${label} a categoria ${category.name}?`,
    positiveText: category.isActive ? 'Inativar' : 'Ativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/product-categories/${category.id}`, {
          method: 'PATCH',
          body: { isActive: !category.isActive }
        })
        message.success(category.isActive ? 'Categoria inativada' : 'Categoria ativada')
        await fetchCategories()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao atualizar status')
      }
    }
  })
}

const confirmDelete = (category: ProductCategory) => {
  if (!canDeleteCategory(category)) {
    message.warning('Não é possível excluir categorias com produtos vinculados.')
    return
  }

  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir a categoria ${category.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/product-categories/${category.id}`, { method: 'DELETE' })
        message.success('Categoria excluída')
        await fetchCategories()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir categoria')
      }
    }
  })
}

const openCreate = () => {
  editingCategory.value = null
  showModal.value = true
}

const openEdit = (category: ProductCategory) => {
  editingCategory.value = category
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const onCategoryFormValidityChange = (valid: boolean) => {
  canSubmitCategoryForm.value = valid
}

const rowProps = (row: ProductCategory) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

const onPageChange = (page: number) => {
  pagination.page = page
  fetchCategories()
}

const onPageSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchCategories()
}

const handleFilter = () => {
  pagination.page = 1
  fetchCategories()
}

const handleClearFilters = () => {
  filters.search = ''
  filters.isActive = null
  pagination.page = 1
  fetchCategories()
}

const applyMobileFilters = () => {
  pagination.page = 1
  showMobileFilters.value = false
  fetchCategories()
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  fetchCategories()
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

.skeleton-layout { display: grid; gap: 10px; }

:deep(.n-data-table) { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
:deep(.n-data-table-th) { font-weight: 600; color: #374151; }
:deep(.n-data-table-tr:hover td) { background: #f8fafc; }
:deep(.n-data-table-td) { padding-top: 6px !important; padding-bottom: 6px !important; line-height: 1.2; }
:deep(.n-data-table-th),
:deep(.n-data-table-td) { white-space: nowrap; word-break: normal; }
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
.status-inactive { background: #f3f4f6 !important; color: #374151 !important; border-color: #e5e7eb !important; }
:deep(.status-chip.n-tag) { border-width: 1px !important; }
:deep(.status-chip.status-active.n-tag) {
  background: #edf7ef !important;
  color: #28663b !important;
  border-color: #d5eadb !important;
}
:deep(.status-chip.status-inactive.n-tag) {
  background: #f3f4f6 !important;
  color: #374151 !important;
  border-color: #e5e7eb !important;
}

.mobile-filters-card { padding: 8px; }
.mobile-filter-top { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.mobile-filter-trigger { white-space: nowrap; }
:deep(.mobile-filter-trigger.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
  background: #ffffff;
}
.mobile-filters-panel { display: grid; gap: 12px; }
.mobile-filter-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; }

.card-list { display: flex; flex-direction: column; gap: 12px; }
.entity-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  padding: 14px;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.entity-card:hover { background: #f8fafc; border-color: #cbd5e1; }
.card-title { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
.card-subtitle { margin: 6px 0 0; color: #475569; font-size: 13px; line-height: 1.4; }
.card-subtitle-muted { color: #94a3b8; }
.card-status { display: flex; align-items: center; gap: 8px; }
.card-line-label { color: #64748b; font-weight: 600; }
.card-actions { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.menu-button { letter-spacing: 1px; font-weight: 700; }
.pagination { display: flex; justify-content: center; padding: 4px 0 2px; }

.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; line-height: 1.2; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

@media (max-width: 768px) {
  .page-head { flex-direction: column; align-items: flex-start; gap: 8px; }
  .head-cta { width: 100%; }
  h1 { font-size: 26px; }

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
:root .n-modal-container:has(.category-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.category-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.category-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.category-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.category-modal.n-card {
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

.category-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.category-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.category-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .category-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .category-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .category-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .category-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }
}
</style>
