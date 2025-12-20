<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Tabelas</p>
        <h1>Raças</h1>
      </div>
      <n-button type="primary" @click="openCreate">Nova raça</n-button>
    </div>

    <div class="filters">
      <n-input v-model:value="filters.name" placeholder="Buscar por nome..." clearable />
      <n-select
        v-model:value="filters.speciesId"
        :options="speciesOptions"
        placeholder="Filtrar por espécie"
        clearable
        filterable
      />
      <div class="filter-actions">
        <n-button secondary @click="handleClearFilters">Limpar</n-button>
        <n-button type="primary" @click="fetchBreeds">Filtrar</n-button>
      </div>
    </div>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="item in breeds"
        :key="item.id"
        class="entity-card"
        @click="openEdit(item)"
      >
        <div class="card-head">
          <div>
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle">{{ getSpeciesLabel(item) }}</p>
          </div>
        </div>
        <div class="card-grid">
          <div class="card-item">
            <span class="card-label">Atualizado</span>
            <span class="card-value">{{ formatDate(item.updatedAt || '') || '-' }}</span>
          </div>
        </div>
        <div class="card-actions">
          <n-button size="small" tertiary type="error" @click.stop="confirmDelete(item)">
            Excluir
          </n-button>
        </div>
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="breeds"
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
      style="width: 620px"
      :content-style="{ padding: '12px 16px 16px 16px' }"
      :header-style="{ padding: '12px 16px 8px 16px' }"
    >
      <template #header>
        <div class="modal-header">
          <p class="eyebrow">{{ editingItem ? 'Editar raça' : 'Nova raça' }}</p>
        </div>
      </template>
      <BreedForm
        :value="editingItem"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, useDialog, useMessage } from 'naive-ui'
import BreedForm, { type Breed } from '~/components/breeds/BreedForm.vue'

interface BreedsResponse {
  data: Breed[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

interface SpeciesOption {
  label: string
  value: number
}

interface SpeciesResponse {
  data: { id: number; name: string }[]
}

const message = useMessage()
const dialog = useDialog()

const filters = reactive({
  name: '',
  speciesId: null as number | null
})

const breeds = ref<Breed[]>([])
const speciesOptions = ref<SpeciesOption[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingItem = ref<Breed | null>(null)
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

const speciesNameMap = computed(() => {
  const map = new Map<number, string>()
  speciesOptions.value.forEach((opt) => {
    if (typeof opt.value === 'number') {
      map.set(opt.value, String(opt.label))
    }
  })
  return map
})

const columns = [
  { title: 'Nome', key: 'name', sorter: true },
  {
    title: 'Espécie',
    key: 'speciesId',
    sorter: true,
    render: (row: Breed) =>
      row.species?.name ||
      speciesNameMap.value.get(row.speciesId ?? -1) ||
      `ID ${row.speciesId ?? '-'}`
  },
  {
    title: 'Atualizado em',
    key: 'updatedAt',
    sorter: true,
    render: (row: Breed) => formatDate(row.updatedAt || '')
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: Breed) =>
      h('div', { class: 'actions' }, [
        h(
          NButton,
          {
            size: 'small',
            tertiary: true,
            quaternary: true,
            circle: true,
            type: 'error',
            title: 'Excluir',
            onClick: (e) => {
              e.stopPropagation()
              confirmDelete(row)
            }
          },
          { default: () => '🗑️' }
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
  if (filters.speciesId !== null) params.speciesId = filters.speciesId
  if (sorter.value.columnKey) params.sortBy = sorter.value.columnKey
  if (sorter.value.order) params.sortDirection = sorter.value.order === 'ascend' ? 'asc' : 'desc'
  return params
}

const fetchBreeds = async () => {
  const requestId = ++activeRequestId.value
  loading.value = true
  try {
    const { data, meta } = await $fetch<BreedsResponse>('http://localhost:3000/api/v1/breeds', {
      query: buildQuery()
    })
    if (requestId !== activeRequestId.value) return
    breeds.value = data
    pagination.total = meta.total
    pagination.page = meta.page
    pagination.limit = meta.limit
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar raças')
  } finally {
    if (requestId === activeRequestId.value) loading.value = false
  }
}

const fetchSpeciesOptions = async () => {
  try {
    const { data } = await $fetch<SpeciesResponse>('http://localhost:3000/api/v1/species', {
      query: { limit: 100 }
    })
    speciesOptions.value = data.map((item) => ({ label: item.name, value: item.id }))
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar espécies')
  }
}

const handleSubmit = async (payload: Breed) => {
  saving.value = true
  try {
    const { id, species, ...body } = payload
    if (id) {
      await $fetch(`http://localhost:3000/api/v1/breeds/${id}`, {
        method: 'PATCH',
        body
      })
      message.success('Raça atualizada')
    } else {
      await $fetch('http://localhost:3000/api/v1/breeds', {
        method: 'POST',
        body
      })
      message.success('Raça criada')
    }
    closeModal()
    await fetchBreeds()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar raça')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: Breed) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir ${item.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      try {
        await $fetch(`http://localhost:3000/api/v1/breeds/${item.id}`, {
          method: 'DELETE'
        })
        message.success('Raça excluída')
        await fetchBreeds()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir raça')
      }
    }
  })
}

const openCreate = () => {
  editingItem.value = null
  showModal.value = true
}

const openEdit = (item: Breed) => {
  editingItem.value = item
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleClearFilters = () => {
  filters.name = ''
  filters.speciesId = null
  sorter.value = { columnKey: 'updatedAt', order: 'descend' }
  pagination.page = 1
  fetchBreeds()
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchBreeds()
}

const onPageSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchBreeds()
}

const onSorterChange = (state: { columnKey?: string | number; order?: 'ascend' | 'descend' | false }) => {
  sorter.value = {
    columnKey: (state.columnKey as string) || 'updatedAt',
    order: state.order || 'descend'
  }
  pagination.page = 1
  fetchBreeds()
}

const rowProps = (row: Breed) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  fetchSpeciesOptions()
  fetchBreeds()
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

const getSpeciesLabel = (item: Breed) =>
  item.species?.name || speciesNameMap.value.get(item.speciesId ?? -1) || 'Espécie não informada'
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
