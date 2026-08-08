<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CADASTROS</p>
        <h1>Fornecedores</h1>
        <p class="subhead">Gerencie fornecedores, contatos, documentos e status de relacionamento com a clínica.</p>
      </div>
      <n-button v-if="canCreateSuppliers" type="primary" size="large" class="head-cta" @click="openCreate">Novo fornecedor</n-button>
    </div>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">FORNECEDORES CADASTRADOS</p>
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
        <p class="summary-label">COM CONTATO</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ summary.withContact }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input
          v-model:value="filters.search"
          placeholder="Buscar por nome, razão social ou documento"
          clearable
        />
        <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Status" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input
          v-model:value="filters.search"
          placeholder="Buscar por nome, razão social ou documento"
          clearable
        />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <div v-if="loading" class="skeleton-layout">
      <n-skeleton v-for="i in isMobile ? 3 : 8" :key="i" text :repeat="isMobile ? 4 : 1" />
    </div>

    <template v-else>
      <div v-if="isMobile" class="card-list">
        <template v-if="suppliers.length">
          <div v-for="item in suppliers" :key="item.id" class="entity-card" @click="openEdit(item)">
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle">{{ item.legalName || '—' }}</p>
            <p class="card-subtitle"><span class="card-line-label">Documento:</span> {{ formatDocument(item.document) }}</p>
            <p class="card-subtitle"><span class="card-line-label">Contato:</span> {{ formatContactSingleLine(item) }}</p>
            <p class="card-subtitle card-status">
              <span class="card-line-label">Status:</span>
              <n-tag :bordered="false" :class="['status-chip', item.isActive ? 'status-active' : 'status-inactive']">
                {{ item.isActive ? 'Ativo' : 'Inativo' }}
              </n-tag>
            </p>
            <p class="card-subtitle card-subtitle-muted"><span class="card-line-label">Atualizado em:</span> {{ formatDate(item.updatedAt || '') || '—' }}</p>
            <div class="card-actions" @click.stop>
              <n-button size="small" secondary type="primary" @click="openEdit(item)">Ver fornecedor</n-button>
              <n-dropdown v-if="buildActionOptions(item).length" trigger="click" :options="buildActionOptions(item)" @select="(key: string) => handleActionSelect(key, item)">
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
        <n-empty v-else description="Nenhum fornecedor encontrado.">
          <template #extra>
            <n-button v-if="canCreateSuppliers" type="primary" @click="openCreate">Novo fornecedor</n-button>
          </template>
        </n-empty>
      </div>

      <template v-else>
        <n-data-table
          v-if="suppliers.length"
          :columns="columns"
          :data="suppliers"
          :pagination="tablePagination"
          :bordered="false"
          :row-props="rowProps"
          remote
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
        <n-empty v-else description="Nenhum fornecedor encontrado.">
          <template #extra>
            <n-button v-if="canCreateSuppliers" type="primary" @click="openCreate">Novo fornecedor</n-button>
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
      class="supplier-modal"
      style="width: 700px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingSupplier ? 'Editar fornecedor' : 'Novo fornecedor' }}</h3>
          <p class="modal-subtitle">
            {{ editingSupplier ? 'Atualize dados cadastrais e status do fornecedor.' : 'Cadastre um novo fornecedor para compras e abastecimento.' }}
          </p>
        </div>
      </template>
      <SupplierForm
        ref="supplierFormRef"
        :value="editingSupplier"
        :loading="saving"
        @submit="handleSubmit"
        @validity-change="onSupplierFormValidityChange"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button v-if="canSaveSupplier" type="primary" :loading="saving" :disabled="!canSubmitSupplierForm" @click="submitSupplierForm">
            {{ editingSupplier ? 'Salvar alterações' : 'Criar fornecedor' }}
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
import SupplierForm, { type Supplier } from '~/components/suppliers/SupplierForm.vue'
import { PERMISSIONS } from '~/constants/permissions'
import { useAuthStore } from '~/stores/auth'

interface SuppliersResponse {
  data: Supplier[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()

const suppliers = ref<Supplier[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingSupplier = ref<Supplier | null>(null)
const supplierFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const canSubmitSupplierForm = ref(false)

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
  withContact: 0
})

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))

const canCreateSuppliers = computed(() => authStore.hasPermission(PERMISSIONS.suppliersCreate))
const canUpdateSuppliers = computed(() => authStore.hasPermission(PERMISSIONS.suppliersUpdate))
const canDeleteSuppliers = computed(() => authStore.hasPermission(PERMISSIONS.suppliersDelete))
const canSaveSupplier = computed(() => editingSupplier.value ? canUpdateSuppliers.value : canCreateSuppliers.value)

const formatDate = (value: string) => {
  if (!value) return ''
  return format(new Date(value), 'dd/MM/yyyy HH:mm')
}

const digitsOnly = (value?: string | null) => String(value || '').replace(/\D/g, '')

const formatDocument = (value?: string | null) => {
  const digits = digitsOnly(value)
  if (!digits) return '—'
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value || '—'
}

const formatContactSingleLine = (item: Supplier) => {
  const parts: string[] = []
  if (item.email) parts.push(`E-mail: ${item.email}`)
  if (item.phone) parts.push(`Tel: ${item.phone}`)
  return parts.length ? parts.join(' | ') : '—'
}

const canShowDeleteAction = (_item: Supplier) => false

const buildActionOptions = (item: Supplier) => {
  const options: Array<{ label?: string; key: string; type?: 'divider' }> = []

  if (canUpdateSuppliers.value) {
    options.push({ label: 'Editar', key: 'edit' })
    options.push({ label: item.isActive ? 'Inativar' : 'Ativar', key: 'toggleStatus' })
  }

  if (canDeleteSuppliers.value && canShowDeleteAction(item)) {
    if (options.length) options.push({ type: 'divider', key: `divider-${item.id}` })
    options.push({ label: 'Excluir', key: 'delete' })
  }

  return options
}

const handleActionSelect = (key: string, item: Supplier) => {
  if (key === 'edit') return openEdit(item)
  if (key === 'toggleStatus') return item.isActive ? confirmDeactivate(item) : confirmReactivate(item)
  if (key === 'delete') return message.warning('Não é possível excluir fornecedores com vínculos existentes.')
}

const columns = [
  { title: 'Fornecedor', key: 'name' },
  { title: 'Razão social', key: 'legalName', render: (row: Supplier) => row.legalName || '—' },
  { title: 'Documento', key: 'document', render: (row: Supplier) => formatDocument(row.document) },
  { title: 'E-mail', key: 'email', render: (row: Supplier) => row.email || '—' },
  { title: 'Telefone', key: 'phone', render: (row: Supplier) => row.phone || '—' },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: Supplier) => h(NTag, {
      bordered: false,
      class: ['status-chip', row.isActive ? 'status-active' : 'status-inactive']
    }, { default: () => (row.isActive ? 'Ativo' : 'Inativo') })
  },
  { title: 'Atualizado em', key: 'updatedAt', render: (row: Supplier) => formatDate(row.updatedAt || '') || '—' },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: Supplier) => h('div', { class: 'table-actions' }, [
      h(NButton, {
        size: 'small',
        secondary: true,
        type: 'primary',
        onClick: (e) => {
          e.stopPropagation()
          openEdit(row)
        }
      }, { default: () => 'Ver fornecedor' }),
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

const buildBaseQuery = () => ({
  search: filters.search || undefined,
  isActive: typeof filters.isActive === 'boolean' ? filters.isActive : undefined
})

const fetchSuppliers = async () => {
  loading.value = true
  try {
    const api = useApi()
    const query = {
      ...buildBaseQuery(),
      page: pagination.page,
      limit: pagination.limit,
      sortBy: 'updatedAt',
      sortDirection: 'desc'
    }

    const res = await api<SuppliersResponse>('/api/v1/suppliers', { query })
    suppliers.value = res.data
    pagination.total = Number(res.meta.total || 0)
    await fetchSummary()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao buscar fornecedores')
  } finally {
    loading.value = false
  }
}

const fetchCount = async (isActive?: boolean) => {
  const api = useApi()
  const res = await api<SuppliersResponse>('/api/v1/suppliers', {
    query: {
      search: filters.search || undefined,
      isActive,
      page: 1,
      limit: 1
    }
  })
  return Number(res.meta.total || 0)
}

const fetchWithContactCount = async () => {
  const api = useApi()
  let page = 1
  const limit = 100
  let total = 0
  let count = 0

  do {
    const res = await api<SuppliersResponse>('/api/v1/suppliers', {
      query: {
        ...buildBaseQuery(),
        page,
        limit
      }
    })

    const list = res.data || []
    list.forEach((item) => {
      if (item.email || item.phone) count += 1
    })

    total = Number(res.meta.total || 0)
    page += 1
  } while ((page - 1) * limit < total)

  return count
}

const fetchSummary = async () => {
  try {
    const [total, active, inactive, withContact] = await Promise.all([
      fetchCount(undefined),
      fetchCount(true),
      fetchCount(false),
      fetchWithContactCount()
    ])
    summary.total = total
    summary.active = active
    summary.inactive = inactive
    summary.withContact = withContact
  } catch {
    summary.total = pagination.total
    summary.active = suppliers.value.filter((item) => item.isActive).length
    summary.inactive = suppliers.value.filter((item) => !item.isActive).length
    summary.withContact = suppliers.value.filter((item) => item.email || item.phone).length
  }
}

const handleSubmit = async (payload: Supplier) => {
  if ((payload.id && !canUpdateSuppliers.value) || (!payload.id && !canCreateSuppliers.value)) return
  saving.value = true
  const api = useApi()

  try {
    const { id, ...body } = payload

    if (id) {
      await api(`/api/v1/suppliers/${id}`, {
        method: 'PATCH',
        body
      })
      message.success('Fornecedor atualizado')
    } else {
      await api('/api/v1/suppliers', {
        method: 'POST',
        body
      })
      message.success('Fornecedor criado')
    }

    closeModal()
    await fetchSuppliers()
  } catch (err: any) {
    const apiMessage = Array.isArray(err?.data?.message)
      ? err.data.message.join(', ')
      : err?.data?.message

    message.error(apiMessage || 'Erro ao salvar fornecedor')
  } finally {
    saving.value = false
  }
}

const submitSupplierForm = async () => {
  if (!canSaveSupplier.value) return
  await supplierFormRef.value?.submit()
}

const confirmDeactivate = (supplier: Supplier) => {
  if (!canUpdateSuppliers.value) return
  if (!supplier.id) return

  dialog.warning({
    title: 'Confirmar inativação',
    content: `Deseja inativar o fornecedor ${supplier.name}?`,
    positiveText: 'Inativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/suppliers/${supplier.id}`, {
          method: 'DELETE'
        })
        message.success('Fornecedor inativado')
        await fetchSuppliers()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao inativar fornecedor')
      }
    }
  })
}

const confirmReactivate = (supplier: Supplier) => {
  if (!canUpdateSuppliers.value) return
  if (!supplier.id) return

  dialog.success({
    title: 'Confirmar reativação',
    content: `Deseja ativar o fornecedor ${supplier.name}?`,
    positiveText: 'Ativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/suppliers/${supplier.id}`, {
          method: 'PATCH',
          body: {
            isActive: true
          }
        })
        message.success('Fornecedor ativado')
        await fetchSuppliers()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao ativar fornecedor')
      }
    }
  })
}

const openCreate = () => {
  if (!canCreateSuppliers.value) return
  editingSupplier.value = null
  showModal.value = true
}

const openEdit = (supplier: Supplier) => {
  editingSupplier.value = supplier
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const onSupplierFormValidityChange = (valid: boolean) => {
  canSubmitSupplierForm.value = valid
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchSuppliers()
}

const onPageSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchSuppliers()
}

const handleFilter = () => {
  pagination.page = 1
  fetchSuppliers()
}

const handleClearFilters = () => {
  filters.search = ''
  filters.isActive = null
  pagination.page = 1
  fetchSuppliers()
}

const applyMobileFilters = () => {
  pagination.page = 1
  showMobileFilters.value = false
  fetchSuppliers()
}

const rowProps = (row: Supplier) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  fetchSuppliers()
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
:deep(.status-chip.status-active.n-tag) { background: #edf7ef !important; color: #28663b !important; border-color: #d5eadb !important; }
:deep(.status-chip.status-inactive.n-tag) { background: #f3f4f6 !important; color: #374151 !important; border-color: #e5e7eb !important; }

.mobile-filters-card { padding: 8px; }
.mobile-filter-top { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.mobile-filter-trigger { white-space: nowrap; }
:deep(.mobile-filter-trigger.n-button) { border: 1px solid #334155; color: #1e293b; background: #ffffff; }
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
:root .n-modal-container:has(.supplier-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.supplier-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.supplier-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.supplier-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.supplier-modal.n-card {
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

.supplier-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.supplier-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.supplier-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .supplier-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .supplier-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .supplier-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .supplier-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }
}
</style>
