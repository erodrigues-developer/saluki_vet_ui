<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CADASTROS</p>
        <h1>Clientes</h1>
        <p class="subhead">Gerencie tutores, contatos, documentos e vínculos com pacientes.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="openCreate">
        Novo cliente
      </n-button>
    </div>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Clientes cadastrados</p>
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
        <p class="summary-label">Com contato</p>
        <strong class="summary-value">{{ summary.withContact }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Clientes cadastrados</p>
        <strong class="summary-value-mobile">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Ativos</p>
        <strong class="summary-value-mobile">{{ summary.active }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Inativos</p>
        <strong class="summary-value-mobile">{{ summary.inactive }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Com contato</p>
        <strong class="summary-value-mobile">{{ summary.withContact }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-clients">
        <n-input v-model:value="filters.name" placeholder="Buscar por nome" clearable />
        <n-input v-model:value="filters.document" placeholder="Buscar por documento" clearable />
        <n-input v-model:value="filters.email" placeholder="Buscar por e-mail" clearable />
        <n-select v-model:value="filters.isActive" :options="statusOptions" placeholder="Status" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="fetchClients">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="mobileSearch" placeholder="Buscar cliente, documento ou e-mail" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">🔎 Filtros</n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="client in clients"
        :key="client.id"
        class="entity-card"
        @click="openEdit(client)"
      >
        <div class="card-head">
          <div class="card-copy">
            <p class="card-title" :title="client.name">{{ client.name }}</p>
          </div>
          <n-tag :bordered="false" :class="['status-chip', client.isActive ? 'status-active' : 'status-inactive']">
            {{ client.isActive ? 'Ativo' : 'Inativo' }}
          </n-tag>
        </div>

        <div class="card-meta">
          <p class="card-line"><span class="card-line-label">Documento:</span> <span class="card-line-value">{{ formatDocument(client.document) }}</span></p>
          <p class="card-line"><span class="card-line-label">Contato:</span> <span class="card-line-value">{{ displayContact(client) }}</span></p>
          <p class="card-line"><span class="card-line-label">E-mail:</span> <span class="card-line-value">{{ displayValue(client.email) }}</span></p>
          <p class="card-line"><span class="card-line-label">Cidade/UF:</span> <span class="card-line-value">{{ formatCityState(client) }}</span></p>
          <p class="card-line"><span class="card-line-label">Atualizado:</span> <span class="card-line-value">{{ formatDate(client.updatedAt || '') || '—' }}</span></p>
        </div>

        <div class="card-actions" @click.stop>
          <n-button size="small" secondary type="primary" @click="openEdit(client)">Ver ficha</n-button>
          <n-dropdown trigger="click" :options="actionOptions" @select="(key: string) => handleActionSelect(key, client)">
            <n-button size="small" quaternary class="menu-button">•••</n-button>
          </n-dropdown>
        </div>
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="clients"
      :pagination="tablePagination"
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
        :page-size="pagination.limit"
        :item-count="pagination.total"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </div>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="52%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-input v-model:value="filters.document" placeholder="Documento" clearable />
          <n-input v-model:value="filters.email" placeholder="E-mail" clearable />
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
      class="client-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingClient ? 'Editar cliente' : 'Novo cliente' }}</h3>
          <p class="modal-subtitle">
            {{ editingClient ? 'Atualize os dados cadastrais, contatos e endereço do tutor.' : 'Cadastre os dados do tutor, contatos e endereço.' }}
          </p>
        </div>
      </template>
      <ClientForm
        ref="clientFormRef"
        :value="editingClient"
        :loading="saving"
        @submit="handleSubmit"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitClientForm">
            {{ editingClient ? 'Salvar alterações' : 'Criar cliente' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NTag, useDialog, useMessage } from 'naive-ui'
import ClientForm, { type Client } from '~/components/clients/ClientForm.vue'

interface ClientsResponse {
  data: Client[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

const message = useMessage()
const dialog = useDialog()

const filters = reactive({
  name: '',
  document: '',
  email: '',
  isActive: null as null | boolean
})

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Ativos', value: true },
  { label: 'Inativos', value: false }
]

const clients = ref<Client[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingClient = ref<Client | null>(null)
const clientFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const mobileSearch = ref('')
const activeRequestId = ref(0)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const sorter = ref<{ columnKey: string; order: 'ascend' | 'descend' | false }>({
  columnKey: 'updatedAt',
  order: 'descend'
})

const summary = computed(() => {
  const total = pagination.total
  const active = clients.value.filter((client) => client.isActive).length
  const inactive = clients.value.filter((client) => !client.isActive).length
  const withContact = clients.value.filter((client) => {
    return Boolean((client.phone || '').trim() || (client.mobilePhone || '').trim() || (client.email || '').trim())
  }).length
  return { total, active, inactive, withContact }
})

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))

const actionOptions = [
  { label: 'Editar', key: 'edit' },
  { label: 'Ver pets vinculados', key: 'pets' },
  { label: 'Ver histórico', key: 'history' },
  { type: 'divider', key: 'divider' },
  { label: 'Excluir', key: 'delete' }
]

const columns = [
  {
    title: 'Cliente',
    key: 'name',
    sorter: true,
    render: (row: Client) =>
      h('div', { class: 'client-cell' }, [
        h('p', { class: 'client-name ellipsis', title: row.name }, row.name)
      ])
  },
  { title: 'Documento', key: 'document', sorter: true, render: (row: Client) => formatDocument(row.document) },
  {
    title: 'Contato',
    key: 'contact',
    render: (row: Client) =>
      h('div', { class: 'contact-cell' }, [
        h('p', { class: 'contact-value' }, [
          h('span', { class: 'contact-label' }, 'Cel: '),
          h('span', { class: valueClass(row.mobilePhone) }, displayValue(row.mobilePhone))
        ]),
        h('p', { class: 'contact-value' }, [
          h('span', { class: 'contact-label' }, 'Tel: '),
          h('span', { class: valueClass(row.phone) }, displayValue(row.phone))
        ]),
        h('p', { class: 'contact-value' }, [
          h('span', { class: 'contact-label' }, 'E-mail: '),
          h('span', { class: valueClass(row.email) }, displayValue(row.email))
        ])
      ])
  },
  {
    title: 'Cidade/UF',
    key: 'city',
    sorter: true,
    render: (row: Client) => formatCityState(row)
  },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: Client) =>
      h(
        NTag,
        {
          bordered: false,
          class: ['status-chip', row.isActive ? 'status-active' : 'status-inactive']
        },
        { default: () => (row.isActive ? 'Ativo' : 'Inativo') }
      )
  },
  {
    title: 'Atualizado em',
    key: 'updatedAt',
    sorter: true,
    render: (row: Client) => formatDate(row.updatedAt || '')
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: Client) =>
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
            }
          },
          { default: () => 'Ver ficha' }
        ),
        h(
          NDropdown,
          {
            trigger: 'click',
            options: actionOptions,
            onSelect: (key: string) => handleActionSelect(key, row)
          },
          {
            default: () =>
              h(
                NButton,
                {
                  size: 'small',
                  quaternary: true,
                  class: 'menu-button',
                  onClick: (e) => e.stopPropagation()
                },
                { default: () => '•••' }
              )
          }
        )
      ])
  }
]

const parseMobileSearch = () => {
  const term = mobileSearch.value.trim()
  if (!term) {
    filters.name = ''
    return
  }

  if (term.includes('@')) {
    filters.name = ''
    filters.email = term
    return
  }

  const digits = term.replace(/\D/g, '')
  if (digits.length >= 6) {
    filters.name = ''
    filters.document = term
    return
  }

  filters.name = term
}

const buildQuery = () => {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.limit
  }

  if (isMobile.value) {
    parseMobileSearch()
  }

  if (filters.name) params.name = filters.name
  if (filters.document) params.document = filters.document
  if (filters.email) params.email = filters.email
  if (filters.isActive !== null) params.isActive = filters.isActive
  if (sorter.value.columnKey) params.sortBy = sorter.value.columnKey
  if (sorter.value.order) params.sortDirection = sorter.value.order === 'ascend' ? 'asc' : 'desc'
  return params
}

const fetchClients = async () => {
  const requestId = ++activeRequestId.value
  loading.value = true
  try {
    const api = useApi()
    const { data, meta } = await api<ClientsResponse>('/api/v1/clients', {
      query: buildQuery()
    })
    if (requestId !== activeRequestId.value) return
    clients.value = data
    pagination.total = meta.total
    pagination.page = meta.page
    pagination.limit = meta.limit
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar clientes')
  } finally {
    if (requestId === activeRequestId.value) {
      loading.value = false
    }
  }
}

const handleSubmit = async (payload: Client) => {
  saving.value = true
  const api = useApi()
  try {
    const { id, ...body } = payload
    if (payload.id) {
      await api(`/api/v1/clients/${payload.id}`, {
        method: 'PATCH',
        body
      })
      message.success('Cliente atualizado')
    } else {
      await api('/api/v1/clients', {
        method: 'POST',
        body
      })
      message.success('Cliente criado')
    }
    closeModal()
    await fetchClients()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar cliente')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (client: Client) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir ${client.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/clients/${client.id}`, {
          method: 'DELETE'
        })
        message.success('Cliente excluído')
        await fetchClients()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir cliente')
      }
    }
  })
}

const handleActionSelect = (key: string, client: Client) => {
  if (key === 'edit') {
    openEdit(client)
    return
  }

  if (key === 'pets') {
    message.info('Visualização de pets vinculados será disponibilizada em breve.')
    return
  }

  if (key === 'history') {
    message.info('Visualização de histórico será disponibilizada em breve.')
    return
  }

  if (key === 'delete') {
    confirmDelete(client)
  }
}

const openCreate = () => {
  editingClient.value = null
  showModal.value = true
}

const openEdit = (client: Client) => {
  editingClient.value = client
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitClientForm = async () => {
  await clientFormRef.value?.submit()
}

const handleClearFilters = () => {
  filters.name = ''
  filters.document = ''
  filters.email = ''
  filters.isActive = null
  mobileSearch.value = ''
  sorter.value = { columnKey: 'updatedAt', order: 'descend' }
  pagination.page = 1
  fetchClients()
}

const applyMobileFilters = () => {
  showMobileFilters.value = false
  pagination.page = 1
  fetchClients()
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchClients()
}

const onPageSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchClients()
}

const onSorterChange = (state: { columnKey?: string | number; order?: 'ascend' | 'descend' | false }) => {
  sorter.value = {
    columnKey: (state.columnKey as string) || 'updatedAt',
    order: state.order || 'descend'
  }
  pagination.page = 1
  fetchClients()
}

const rowProps = (row: Client) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  fetchClients()
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
    timeStyle: 'short'
  }).format(new Date(iso))
}

const formatCityState = (client: Client) => {
  const value = `${client.city ?? ''}${client.state ? ` / ${client.state}` : ''}`.trim()
  return value || '—'
}

const displayValue = (value?: string | null) => {
  const text = (value ?? '').trim()
  return text ? text : '—'
}

const formatDocument = (value?: string | null) => {
  const text = (value ?? '').trim()
  if (!text) return '—'
  const digits = text.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return text
}

const displayContact = (client: Client) => {
  const phone = (client.mobilePhone ?? '').trim()
  if (phone) return phone
  const landline = (client.phone ?? '').trim()
  if (landline) return landline
  const email = (client.email ?? '').trim()
  if (email) return email
  return '—'
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
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  font-weight: 500;
}

.summary-grid-mobile .summary-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-value {
  display: block;
  margin-top: 10px;
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.filters-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
}

.filters-grid {
  display: grid;
  gap: 10px;
  align-items: stretch;
}

.filters-grid-clients {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.filters-card :deep(.n-card__content) {
  padding: 14px 16px !important;
}

.filters-grid :deep(.n-input),
.filters-grid :deep(.n-base-selection) {
  min-height: 40px;
}

.filters-grid :deep(.n-input .n-input-wrapper),
.filters-grid :deep(.n-base-selection .n-base-selection-label) {
  min-height: 40px;
  height: 40px;
}

.mobile-filters-card {
  padding: 10px;
}

.mobile-filter-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-filter-trigger {
  height: 44px;
}

:deep(.mobile-filter-trigger.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
  background: #ffffff;
}

:deep(.mobile-filter-trigger.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}

.filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.btn-clear {
  color: #6b7280;
  font-weight: 500;
}

.btn-filter {
  width: 112px;
}

:deep(.btn-filter.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
}

:deep(.btn-filter.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}

.client-cell {
  min-width: 0;
}

.client-name {
  margin: 0;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.1;
  color: #111827;
}

.contact-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.contact-value {
  margin: 0;
  font-size: 11px;
  line-height: 1.05;
}

.contact-label {
  color: #64748b;
  font-weight: 500;
}

.ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.actions :deep(.n-button) {
  min-height: 30px;
}

.action-primary {
  --n-height: 30px !important;
  --n-padding: 0 10px !important;
  --n-border-radius: 8px !important;
  font-weight: 600;
}

.menu-button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  border-radius: 8px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

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

.status-active {
  background: #edf7ef !important;
  color: #28663b !important;
  border-color: #d5eadb !important;
}

.status-inactive {
  background: #fef2f2 !important;
  color: #9f1239 !important;
  border-color: #fdd3de !important;
}

:deep(.status-chip.n-tag) {
  border-width: 1px !important;
}

:deep(.status-chip.status-active.n-tag) {
  background: #edf7ef !important;
  color: #28663b !important;
  border-color: #d5eadb !important;
}

:deep(.status-chip.status-inactive.n-tag) {
  background: #fef2f2 !important;
  color: #9f1239 !important;
  border-color: #fdd3de !important;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

:deep(.n-data-table) {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.n-data-table-th) {
  font-weight: 600;
  color: #374151;
  background: #f8fafc;
}

:deep(.n-data-table-tr:hover td) {
  background: #f8fafc;
}

:deep(.n-data-table-td) {
  background: #ffffff;
  padding-top: 5px !important;
  padding-bottom: 5px !important;
  line-height: 1.15;
}

:deep(.n-data-table-th),
:deep(.n-data-table-td) {
  white-space: nowrap;
  word-break: normal;
}

:deep(.n-data-table .n-data-table__pagination),
:deep(.n-data-table .n-data-table-pagination) {
  min-height: 40px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entity-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.card-copy {
  min-width: 0;
}

.card-title {
  font-weight: 700;
  font-size: 15px;
  margin: 0 0 2px;
  color: #0f172a;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-line {
  margin: 0;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-line-label {
  color: #64748b;
  font-weight: 500;
}

.card-line-value {
  color: #0f172a;
  font-weight: 600;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  gap: 8px;
}

.mobile-filters-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-filter-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.value-strong {
  color: #1f2937;
}

.value-empty {
  color: #64748b;
}

@media (max-width: 1200px) {
  .filters-grid-clients {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: span 3;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .page {
    gap: 12px;
  }

  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .head-copy {
    gap: 2px;
  }

  h1 {
    font-size: 26px;
    line-height: 1.1;
  }

  .subhead {
    font-size: 13px;
  }

  .head-cta {
    width: 100%;
  }

  .mobile-filters-card {
    padding: 8px;
  }

  .mobile-filter-top {
    gap: 8px;
  }

  .mobile-filter-top :deep(.n-input) {
    width: 100%;
  }

  .card-actions {
    margin-top: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
  }

  .card-actions :deep(.n-button) {
    min-height: 36px;
  }

  .menu-button {
    min-width: 40px;
    width: 40px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>

<style>
:root .n-modal-container:has(.client-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.client-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.client-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.client-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.client-modal.n-card {
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

.client-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.client-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.client-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.client-modal .modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-modal .modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.client-modal .modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.client-modal .modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .client-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .client-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .client-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .client-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .client-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .client-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
