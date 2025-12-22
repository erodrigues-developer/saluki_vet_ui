<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Cadastros</p>
        <h1>Clientes</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Novo Cliente
      </n-button>
    </div>

    <div class="filters">
      <n-input v-model:value="filters.name" placeholder="Buscar por nome..." clearable />
      <n-input v-model:value="filters.document" placeholder="Buscar por documento..." clearable />
      <n-input v-model:value="filters.email" placeholder="Buscar por e-mail..." clearable />
      <div class="status-chips">
        <span class="chip-label">Status:</span>
        <n-button
          quaternary
          :type="filters.isActive === null ? 'primary' : 'default'"
          size="small"
          @click="setStatusFilter(null)"
        >
          Todos
        </n-button>
        <n-button
          quaternary
          :type="filters.isActive === true ? 'primary' : 'default'"
          size="small"
          @click="setStatusFilter(true)"
        >
          Ativos
        </n-button>
        <n-button
          quaternary
          :type="filters.isActive === false ? 'primary' : 'default'"
          size="small"
          @click="setStatusFilter(false)"
        >
          Inativos
        </n-button>
      </div>
      <div class="filter-actions">
        <n-button secondary @click="handleClearFilters">Limpar</n-button>
        <n-button type="primary" @click="fetchClients">Filtrar</n-button>
      </div>
    </div>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="client in clients"
        :key="client.id"
        class="client-card"
        @click="openEdit(client)"
      >
        <div class="card-head">
          <div>
            <p class="card-title">{{ client.name }}</p>
            <p class="card-subtitle">{{ displayValue(client.document) }}</p>
          </div>
          <n-tag :type="client.isActive ? 'success' : 'error'" :bordered="false">
            {{ client.isActive ? 'Ativo' : 'Inativo' }}
          </n-tag>
        </div>
        <div class="card-grid">
          <div class="card-item">
            <span class="card-label">E-mail</span>
            <span class="card-value">{{ displayValue(client.email) }}</span>
          </div>
          <div class="card-item">
            <span class="card-label">Telefone</span>
            <span class="card-value">{{ displayValue(client.phone) }}</span>
          </div>
          <div class="card-item">
            <span class="card-label">Celular</span>
            <span class="card-value">{{ displayValue(client.mobilePhone) }}</span>
          </div>
          <div class="card-item">
            <span class="card-label">Cidade/UF</span>
            <span class="card-value">{{ formatCityState(client) }}</span>
          </div>
          <div class="card-item">
            <span class="card-label">Atualizado</span>
            <span class="card-value">{{ formatDate(client.updatedAt || '') || '-' }}</span>
          </div>
        </div>
        <div class="card-actions">
          <n-button
            size="small"
            tertiary
            type="error"
            @click.stop="confirmDelete(client)"
          >
            Excluir
          </n-button>
        </div>
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="clients"
      :pagination="false"
      :bordered="false"
      :sorter="sorter"
      :row-props="rowProps"
      @update:sorter="onSorterChange"
    />

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

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      style="width: 720px"
      :content-style="{ padding: '12px 16px 16px 16px' }"
      :header-style="{ padding: '12px 16px 8px 16px' }"
    >
      <template #header>
        <div class="modal-header">
          <div>
            <p class="eyebrow">{{ editingClient ? 'Editar cliente' : 'Novo cliente' }}</p>
          </div>
        </div>
      </template>
      <ClientForm
        :value="editingClient"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NTag, useMessage, useDialog } from 'naive-ui'
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

const clients = ref<Client[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingClient = ref<Client | null>(null)
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

const columns = [
  { title: 'Nome', key: 'name', sorter: true },
  { title: 'Documento', key: 'document', sorter: true },
  { title: 'Telefone', key: 'phone' },
  { title: 'Celular', key: 'mobilePhone' },
  { title: 'E-mail', key: 'email', sorter: true },
  {
    title: 'Cidade/UF',
    key: 'city',
    sorter: true,
    render: (row: Client) => `${row.city ?? ''}${row.state ? ` / ${row.state}` : ''}`
  },
  {
    title: 'Ativo',
    key: 'isActive',
    render: (row: Client) =>
      h(
        NTag,
        { type: row.isActive ? 'success' : 'error', bordered: false },
        { default: () => (row.isActive ? 'Sim' : 'Não') }
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
            tertiary: true,
            type: 'error',
            onClick: (e) => {
              e.stopPropagation()
              confirmDelete(row)
            }
          },
          { default: () => 'Excluir' }
        )
      ])
  }
]

const buildQuery = () => {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.limit
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
    const { data, meta } = await $fetch<ClientsResponse>('http://localhost:3000/api/v1/clients', {
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
  try {
    const { id, ...body } = payload
    if (payload.id) {
      await $fetch(`http://localhost:3000/api/v1/clients/${payload.id}`, {
        method: 'PATCH',
        body
      })
      message.success('Cliente atualizado')
    } else {
      await $fetch('http://localhost:3000/api/v1/clients', {
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
      try {
        await $fetch(`http://localhost:3000/api/v1/clients/${client.id}`, {
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

const handleClearFilters = () => {
  filters.name = ''
  filters.document = ''
  filters.email = ''
  filters.isActive = null
  sorter.value = { columnKey: 'updatedAt', order: 'descend' }
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

const setStatusFilter = (val: null | boolean) => {
  filters.isActive = val
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
  const value = `${client.city ?? ''}${client.state ? ` / ${client.state}` : ''}`
  return value || '-'
}

const displayValue = (value?: string | null) => {
  const text = (value ?? '').trim()
  return text ? text : '-'
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #4b5563;
  margin: 0 0 4px;
}

h1 {
  margin: 0;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  align-items: end;
}

.status-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.chip-label {
  font-size: 12px;
  color: #6b7280;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.actions {
  display: flex;
  gap: 6px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.client-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
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

.card-title {
  font-weight: 600;
  margin: 0 0 2px;
  color: #111827;
}

.card-subtitle {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.card-grid {
  display: grid;
  gap: 8px;
}

.card-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
}

.card-value {
  font-size: 13px;
  color: #374151;
  word-break: break-word;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}
</style>
