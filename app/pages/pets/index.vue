<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Pets</p>
        <h1>Pets</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Novo pet
      </n-button>
    </div>

    <div class="filters">
      <n-input v-model:value="filters.name" placeholder="Buscar por nome..." clearable />
      <n-select
        v-model:value="filters.clientId"
        :options="clientOptions"
        placeholder="Filtrar por tutor"
        filterable
        remote
        clearable
        :loading="clientLoading"
        @search="onClientSearch"
        @focus="ensureClientsLoaded"
      />
      <n-input v-model:value="filters.microchipCode" placeholder="Buscar por microchip..." clearable />
      <div class="filter-actions">
        <n-button secondary @click="handleClearFilters">Limpar</n-button>
        <n-button type="primary" @click="fetchPets">Filtrar</n-button>
      </div>
    </div>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="pet in pets"
        :key="pet.id"
        class="entity-card"
        @click="openEdit(pet)"
      >
        <div class="card-head">
          <div>
            <p class="card-title">{{ pet.name }}</p>
            <p class="card-subtitle">{{ displayValue(pet.client?.name) }}</p>
          </div>
          <n-tag :type="pet.isActive ? 'success' : 'error'" :bordered="false">
            {{ pet.isActive ? 'Ativo' : 'Inativo' }}
          </n-tag>
        </div>
        <div class="card-grid">
          <div class="card-item">
            <span class="card-label">Espécie/Raça</span>
            <span class="card-value">{{ formatSpeciesBreed(pet) }}</span>
          </div>
          <div class="card-item">
            <span class="card-label">Microchip</span>
            <span class="card-value">{{ displayValue(pet.microchipCode) }}</span>
          </div>
          <div class="card-item">
            <span class="card-label">Atualizado</span>
            <span class="card-value">{{ formatDate(pet.updatedAt || '') || '-' }}</span>
          </div>
        </div>
        <div class="card-actions">
          <n-button size="small" tertiary type="error" @click.stop="confirmDelete(pet)">
            Excluir
          </n-button>
        </div>
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="pets"
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
      style="width: 760px"
      :content-style="{ padding: '12px 16px 16px 16px' }"
      :header-style="{ padding: '12px 16px 8px 16px' }"
    >
      <template #header>
        <div class="modal-header">
          <p class="eyebrow">{{ editingPet ? 'Editar pet' : 'Novo pet' }}</p>
        </div>
      </template>
      <PetForm
        :value="editingPet"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, useDialog, useMessage, type SelectOption } from 'naive-ui'
import PetForm, { type Pet } from '~/components/pets/PetForm.vue'

interface PetsResponse {
  data: Pet[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

interface ClientsResponse {
  data: { id: number; name: string }[]
}

const message = useMessage()
const dialog = useDialog()

const filters = reactive({
  name: '',
  clientId: null as number | null,
  microchipCode: ''
})

const pets = ref<Pet[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingPet = ref<Pet | null>(null)
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

const clientOptions = ref<SelectOption[]>([])
const clientLoading = ref(false)

const columns = [
  { title: 'Nome', key: 'name', sorter: true },
  {
    title: 'Tutor',
    key: 'clientId',
    sorter: true,
    render: (row: Pet) => row.client?.name || ''
  },
  {
    title: 'Espécie',
    key: 'speciesId',
    render: (row: Pet) => row.species?.name || ''
  },
  {
    title: 'Raça',
    key: 'breedId',
    render: (row: Pet) => row.breed?.name || ''
  },
  { title: 'Microchip', key: 'microchipCode', sorter: true },
  {
    title: 'Atualizado em',
    key: 'updatedAt',
    sorter: true,
    render: (row: Pet) => formatDate(row.updatedAt || '')
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: Pet) =>
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
  if (filters.clientId !== null) params.clientId = filters.clientId
  if (filters.microchipCode) params.microchipCode = filters.microchipCode
  if (sorter.value.columnKey) params.sortBy = sorter.value.columnKey
  if (sorter.value.order) params.sortDirection = sorter.value.order === 'ascend' ? 'asc' : 'desc'
  return params
}

const fetchPets = async () => {
  const requestId = ++activeRequestId.value
  loading.value = true
  try {
    const api = useApi()
    const { data, meta } = await api<PetsResponse>('/api/v1/pets', {
      query: buildQuery()
    })
    if (requestId !== activeRequestId.value) return
    pets.value = data
    pagination.total = meta.total
    pagination.page = meta.page
    pagination.limit = meta.limit
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar pets')
  } finally {
    if (requestId === activeRequestId.value) {
      loading.value = false
    }
  }
}

const handleSubmit = async (payload: Pet) => {
  saving.value = true
  const api = useApi()
  try {
    const { id, client, species, breed, createdAt, updatedAt, deletedAt, ...body } = payload
    if (payload.id) {
      await api(`/api/v1/pets/${payload.id}`, {
        method: 'PATCH',
        body
      })
      message.success('Pet atualizado')
    } else {
      await api('/api/v1/pets', {
        method: 'POST',
        body
      })
      message.success('Pet criado')
    }
    closeModal()
    await fetchPets()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar pet')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (pet: Pet) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir ${pet.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/pets/${pet.id}`, {
          method: 'DELETE'
        })
        message.success('Pet excluído')
        await fetchPets()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir pet')
      }
    }
  })
}

const openCreate = () => {
  editingPet.value = null
  showModal.value = true
}

const openEdit = (pet: Pet) => {
  editingPet.value = pet
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleClearFilters = () => {
  filters.name = ''
  filters.clientId = null
  filters.microchipCode = ''
  sorter.value = { columnKey: 'updatedAt', order: 'descend' }
  pagination.page = 1
  fetchPets()
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchPets()
}

const onPageSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchPets()
}

const onSorterChange = (state: { columnKey?: string | number; order?: 'ascend' | 'descend' | false }) => {
  sorter.value = {
    columnKey: (state.columnKey as string) || 'updatedAt',
    order: state.order || 'descend'
  }
  pagination.page = 1
  fetchPets()
}

const rowProps = (row: Pet) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

const fetchClientOptions = async (search?: string) => {
  clientLoading.value = true
  const api = useApi()
  try {
    const { data } = await api<ClientsResponse>('/api/v1/clients', {
      query: {
        limit: 20,
        ...(search ? { name: search } : {})
      }
    })
    clientOptions.value = data.map((item) => ({ label: item.name, value: item.id }))
    if (filters.clientId !== null) {
      const exists = clientOptions.value.some((opt) => opt.value === filters.clientId)
      if (!exists) {
        clientOptions.value = [
          { label: `ID ${filters.clientId}`, value: filters.clientId },
          ...clientOptions.value
        ]
      }
    }
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar clientes')
  } finally {
    clientLoading.value = false
  }
}

const onClientSearch = (val: string) => {
  fetchClientOptions(val || undefined)
}

const ensureClientsLoaded = () => {
  if (!clientOptions.value.length && !clientLoading.value) {
    fetchClientOptions()
  }
}

onMounted(() => {
  fetchPets()
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

const displayValue = (value?: string | null) => {
  const text = (value ?? '').trim()
  return text ? text : '-'
}

const formatSpeciesBreed = (pet: Pet) => {
  const species = pet.species?.name || (pet.speciesId ? `ID ${pet.speciesId}` : '')
  const breed = pet.breed?.name || (pet.breedId ? `ID ${pet.breedId}` : '')
  if (!species && !breed) return '-'
  return [species, breed].filter(Boolean).join(' / ')
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  align-items: end;
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

.modal-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entity-card {
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
