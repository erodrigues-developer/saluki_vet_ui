<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Configurações</p>
        <h1>Usuários e Permissões</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Novo Usuário
      </n-button>
    </div>

    <div class="filters">
      <n-input v-model:value="filters.name" placeholder="Buscar por nome..." clearable />
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
        <n-button type="primary" @click="fetchUsers">Filtrar</n-button>
      </div>
    </div>

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="users"
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
    >
      <template #header>
        <p class="eyebrow">{{ editingUser ? 'Editar Usuário' : 'Novo Usuário' }}</p>
      </template>
      <UserForm
        :value="editingUser"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import { NButton, NTag, useMessage, useDialog } from 'naive-ui'
import UserForm, { type User } from '~/components/users/UserForm.vue'

interface UsersResponse {
  data: User[]
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
  email: '',
  isActive: null as null | boolean
})

const users = ref<User[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingUser = ref<User | null>(null)

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const sorter = ref<{ columnKey: string; order: 'ascend' | 'descend' | false }>({
  columnKey: 'createdAt',
  order: 'descend'
})

const columns = [
  { title: 'Nome', key: 'name', sorter: true },
  { title: 'E-mail', key: 'email', sorter: true },
  {
    title: 'Papéis',
    key: 'roles',
    render: (row: User) =>
      h('div', { style: 'display: flex; gap: 4px; flex-wrap: wrap;' },
        row.roles?.map(r => h(NTag, { size: 'small', bordered: false }, { default: () => r.name }))
      )
  },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: User) =>
      h(NTag, { type: row.isActive ? 'success' : 'error', bordered: false }, { default: () => (row.isActive ? 'Ativo' : 'Inativo') })
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: User) =>
      h('div', { class: 'actions' }, [
        h(NButton, {
          size: 'small',
          tertiary: true,
          type: 'error',
          onClick: (e) => {
            e.stopPropagation()
            confirmDelete(row)
          }
        }, { default: () => 'Excluir' })
      ])
  }
]

const fetchUsers = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sorter.value.columnKey,
      sortDirection: sorter.value.order === 'ascend' ? 'asc' : 'desc'
    }
    if (filters.name) params.name = filters.name
    if (filters.email) params.email = filters.email
    if (filters.isActive !== null) params.isActive = filters.isActive

    const api = useApi()
    const res = await api<UsersResponse>('/api/v1/users', { query: params })
    users.value = res.data
    pagination.total = res.meta.total
  } catch (err) {
    message.error('Erro ao buscar usuários')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: User) => {
  saving.value = true
  const api = useApi()
  try {
    if (payload.id) {
      await api(`/api/v1/users/${payload.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Usuário atualizado')
    } else {
      await api('/api/v1/users', {
        method: 'POST',
        body: payload
      })
      message.success('Usuário criado')
    }
    closeModal()
    fetchUsers()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar usuário')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (user: User) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o usuário ${user.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/users/${user.id}`, { method: 'DELETE' })
        message.success('Usuário excluído')
        fetchUsers()
      } catch (err) {
        message.error('Erro ao excluir usuário')
      }
    }
  })
}

const openCreate = () => {
  editingUser.value = null
  showModal.value = true
}

const openEdit = (user: User) => {
  editingUser.value = user
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const onPageChange = (p: number) => {
  pagination.page = p
  fetchUsers()
}

const onPageSizeChange = (s: number) => {
  pagination.limit = s
  pagination.page = 1
  fetchUsers()
}

const onSorterChange = (s: any) => {
  sorter.value = { columnKey: s.columnKey, order: s.order }
  fetchUsers()
}

const setStatusFilter = (v: boolean | null) => {
  filters.isActive = v
  fetchUsers()
}

const handleClearFilters = () => {
  filters.name = ''
  filters.email = ''
  filters.isActive = null
  fetchUsers()
}

const rowProps = (row: User) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: center; }
.eyebrow { font-size: 12px; color: #6b7280; text-transform: uppercase; margin: 0; }
h1 { margin: 4px 0 0; font-size: 24px; }
.filters { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.status-chips { display: flex; align-items: center; gap: 8px; }
.chip-label { font-size: 12px; color: #6b7280; }
.filter-actions { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.actions { display: flex; gap: 8px; }
</style>
