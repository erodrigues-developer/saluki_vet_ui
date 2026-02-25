<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Tabelas</p>
        <h1>Espécies</h1>
      </div>
      <n-button type="primary" @click="openCreate">Nova espécie</n-button>
    </div>

    <div class="filters">
      <n-input v-model:value="filters.name" placeholder="Buscar por nome..." clearable />
      <div class="filter-actions">
        <n-button secondary @click="handleClearFilters">Limpar</n-button>
        <n-button type="primary" @click="fetchSpecies">Filtrar</n-button>
      </div>
    </div>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="item in species"
        :key="item.id"
        class="entity-card"
        @click="openEdit(item)"
      >
        <div class="card-head">
          <div>
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle">Atualizado {{ formatDate(item.updatedAt || '') || '-' }}</p>
          </div>
        </div>
        <div class="card-grid">
          <div class="card-item">
            <span class="card-label">Criado em</span>
            <span class="card-value">{{ formatDate(item.createdAt || '') || '-' }}</span>
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
      :data="species"
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
      style="width: 520px"
      :content-style="{ padding: '12px 16px 16px 16px' }"
      :header-style="{ padding: '12px 16px 8px 16px' }"
    >
      <template #header>
        <div class="modal-header">
          <p class="eyebrow">{{ editingItem ? 'Editar espécie' : 'Nova espécie' }}</p>
        </div>
      </template>
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="top"
        :show-require-mark="false"
        :disabled="saving"
      >
        <n-form-item label="Nome" path="name" required>
          <n-input v-model:value="formModel.name" placeholder="Nome da espécie" />
        </n-form-item>
        <div class="actions">
          <n-button tertiary @click="closeModal" :disabled="saving">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="handleSubmit">
            {{ formModel.id ? 'Salvar alterações' : 'Criar espécie' }}
          </n-button>
        </div>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NTag, useDialog, useMessage, type FormInst, type FormRules } from 'naive-ui'

interface Species {
  id?: number
  name: string
  createdAt?: string
  updatedAt?: string
}

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

const filters = reactive({
  name: ''
})

const species = ref<Species[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingItem = ref<Species | null>(null)
const formRef = ref<FormInst | null>(null)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const formModel = reactive<Species>({
  id: undefined,
  name: ''
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' }
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
  {
    title: 'Atualizado em',
    key: 'updatedAt',
    sorter: true,
    render: (row: Species) => formatDate(row.updatedAt || '')
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: Species) =>
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

const activeRequestId = ref(0)

const buildQuery = () => {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.limit
  }
  if (filters.name) params.name = filters.name
  if (sorter.value.columnKey) params.sortBy = sorter.value.columnKey
  if (sorter.value.order) params.sortDirection = sorter.value.order === 'ascend' ? 'asc' : 'desc'
  return params
}

const fetchSpecies = async () => {
  const requestId = ++activeRequestId.value
  loading.value = true
  try {
    const { data, meta } = await $fetch<SpeciesResponse>('/api/v1/species', {
      query: buildQuery()
    })
    if (requestId !== activeRequestId.value) return
    species.value = data
    pagination.total = meta.total
    pagination.page = meta.page
    pagination.limit = meta.limit
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar espécies')
  } finally {
    if (requestId === activeRequestId.value) loading.value = false
  }
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  saving.value = true
  try {
    const { id, ...body } = formModel
    if (id) {
      await $fetch(`/api/v1/species/${id}`, {
        method: 'PATCH',
        body
      })
      message.success('Espécie atualizada')
    } else {
      await $fetch('/api/v1/species', {
        method: 'POST',
        body
      })
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
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir ${item.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      try {
        await $fetch(`/api/v1/species/${item.id}`, {
          method: 'DELETE'
        })
        message.success('Espécie excluída')
        await fetchSpecies()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir espécie')
      }
    }
  })
}

const openCreate = () => {
  editingItem.value = null
  formModel.id = undefined
  formModel.name = ''
  showModal.value = true
}

const openEdit = (item: Species) => {
  editingItem.value = item
  formModel.id = item.id
  formModel.name = item.name
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleClearFilters = () => {
  filters.name = ''
  sorter.value = { columnKey: 'updatedAt', order: 'descend' }
  pagination.page = 1
  fetchSpecies()
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

const onSorterChange = (state: { columnKey?: string | number; order?: 'ascend' | 'descend' | false }) => {
  sorter.value = {
    columnKey: (state.columnKey as string) || 'updatedAt',
    order: state.order || 'descend'
  }
  pagination.page = 1
  fetchSpecies()
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
