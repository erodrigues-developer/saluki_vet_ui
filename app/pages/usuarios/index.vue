<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CONFIGURAÇÕES</p>
        <h1>Usuários e permissões</h1>
        <p class="subhead">Gerencie usuários, papéis de acesso e permissões da clínica.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="openCreate">
        Novo usuário
      </n-button>
    </div>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Usuários cadastrados</p>
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
        <p class="summary-label">Administradores</p>
        <strong class="summary-value">{{ summary.admins }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Usuários cadastrados</p>
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
        <p class="summary-label">Administradores</p>
        <strong class="summary-value-mobile">{{ summary.admins }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-users">
        <n-input
          v-model:value="filters.search"
          placeholder="Buscar usuário por nome ou e-mail"
          clearable
        />
        <n-select
          v-model:value="filters.roleCode"
          :options="roleFilterOptions"
          placeholder="Papel"
          clearable
        />
        <n-select
          v-model:value="filters.isActive"
          :options="statusOptions"
          placeholder="Status"
        />
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
          placeholder="Buscar usuário por nome ou e-mail"
          clearable
        />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="item in filteredUsers"
        :key="item.id"
        class="entity-card"
        @click="openEdit(item)"
      >
        <div class="card-head">
          <div class="card-copy">
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle">{{ item.email }}</p>
          </div>
          <n-tag :bordered="false" :class="['status-chip', item.isActive ? 'status-active' : 'status-inactive']">
            {{ item.isActive ? 'Ativo' : 'Inativo' }}
          </n-tag>
        </div>

        <div class="card-meta">
          <p class="card-line card-line-roles">
            <span class="card-line-label">Papéis:</span>
            <span class="card-role-tags">
              <n-tag
                v-for="role in sortedRoles(item)"
                :key="`${item.id}-${role.id}`"
                size="small"
                :bordered="false"
                :class="roleClass(role)"
              >
                {{ role.name }}
              </n-tag>
            </span>
          </p>
          <p class="card-line">
            <span class="card-line-label">Atualizado em:</span>
            <span class="card-line-value">{{ formatDate(item.updatedAt || '') || '—' }}</span>
          </p>
        </div>

        <div class="card-actions" @click.stop>
          <n-button size="small" secondary type="primary" @click="openEdit(item)">Ver usuário</n-button>
          <n-dropdown trigger="click" :options="buildActionOptions(item)" @select="(key: string) => handleActionSelect(key, item)">
            <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
          </n-dropdown>
        </div>
      </div>

      <div class="pagination">
        <n-pagination
          :page="pagination.page"
          :page-size="pagination.limit"
          :item-count="filteredUsers.length || pagination.total"
          show-size-picker
          :page-sizes="[10, 20, 50]"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="filteredUsers"
      :pagination="tablePagination"
      :bordered="false"
      :sorter="sorter"
      :row-props="rowProps"
      @update:sorter="onSorterChange"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
      remote
    />

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="50%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select
            v-model:value="filters.roleCode"
            :options="roleFilterOptions"
            placeholder="Papel"
            clearable
          />
          <n-select
            v-model:value="filters.isActive"
            :options="statusOptions"
            placeholder="Status"
          />
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
      class="user-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingUser ? 'Editar usuário' : 'Novo usuário' }}</h3>
          <p class="modal-subtitle">
            {{ editingUser ? 'Atualize dados, papéis de acesso e status do usuário.' : 'Cadastre o usuário e defina papéis de acesso.' }}
          </p>
        </div>
      </template>
      <UserForm
        ref="userFormRef"
        :value="editingUser"
        :loading="saving"
        @submit="handleSubmit"
        @validity-change="onUserFormValidityChange"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button
            type="primary"
            :loading="saving"
            :disabled="isMobile && !canSubmitUserForm"
            @click="submitUserForm"
          >
            {{ editingUser ? 'Salvar alterações' : 'Criar usuário' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NTag, useMessage, useDialog } from 'naive-ui'
import UserForm, { type User, type Role } from '~/components/users/UserForm.vue'
import { useAuthStore } from '~/stores/auth'

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
const authStore = useAuthStore()

const filters = reactive({
  search: '',
  roleCode: null as string | null,
  isActive: null as null | boolean
})

const users = ref<User[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingUser = ref<User | null>(null)
const userFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const canSubmitUserForm = ref(false)
const isMobile = ref(false)
const roleFilterOptions = ref<{ label: string; value: string }[]>([])
const availableRoles = ref<Role[]>([])
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const sorter = ref<{ columnKey: string; order: 'ascend' | 'descend' | false }>({
  columnKey: 'updated_at',
  order: 'descend'
})

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Ativos', value: true },
  { label: 'Inativos', value: false }
]

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: filteredUsers.value.length || pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))

const summary = computed(() => {
  const source = filteredUsers.value
  const total = source.length
  const active = source.filter((user) => user.isActive).length
  const inactive = source.filter((user) => !user.isActive).length
  const admins = source.filter((user) => hasRole(user, 'ADMIN')).length
  return { total, active, inactive, admins }
})

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const searchTerm = filters.search.trim().toLowerCase()
    const matchesSearch = !searchTerm || user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm)
    const matchesRole = !filters.roleCode || hasRole(user, filters.roleCode)
    const matchesStatus = filters.isActive === null || user.isActive === filters.isActive
    return matchesSearch && matchesRole && matchesStatus
  })
})

const hasRole = (user: User, roleCode: string) => {
  return (user.roles || []).some((role) => role.code === roleCode)
}

const roleOrder = ['ADMIN', 'VET', 'RECEPTIONIST']
const roleRank = (code?: string) => {
  if (!code) return 99
  const index = roleOrder.indexOf(code)
  return index === -1 ? 98 : index
}

const roleClass = (role?: Role) => {
  if (!role?.code) return 'role-tag role-tag-neutral'
  if (role.code === 'ADMIN') return 'role-tag role-tag-admin'
  if (role.code === 'VET') return 'role-tag role-tag-vet'
  return 'role-tag role-tag-neutral'
}

const columns = [
  {
    title: 'Usuário',
    key: 'name',
    sorter: true,
    render: (row: User) =>
      h('div', { class: 'user-cell' }, [
        h('p', { class: 'user-name ellipsis', title: row.name }, row.name)
      ])
  },
  { title: 'E-mail', key: 'email', sorter: true },
  {
    title: 'Papéis',
    key: 'roles',
    render: (row: User) =>
      h(
        'div',
        { class: 'roles-cell' },
        [...(row.roles || [])]
          .sort((a, b) => roleRank(a.code) - roleRank(b.code))
          .map((role) => h(NTag, { size: 'small', bordered: false, class: roleClass(role) }, { default: () => role.name }))
      )
  },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: User) =>
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
    key: 'updated_at',
    sorter: true,
    render: (row: User) => formatDate(row.updatedAt || '') || '—'
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: User) =>
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
          { default: () => 'Ver usuário' }
        ),
        h(
          NDropdown,
          {
            trigger: 'click',
            options: buildActionOptions(row),
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
                { default: () => '⋯' }
              )
          }
        )
      ])
  }
]

const rolesAsText = (user: User) => {
  const roles = sortedRoles(user)
  if (!roles.length) return '—'
  return roles.map((role) => role.name).join(', ')
}

const sortedRoles = (user: User) => {
  return [...(user.roles || [])].sort((a, b) => roleRank(a.code) - roleRank(b.code))
}

const buildActionOptions = (user: User) => {
  const toggleLabel = user.isActive ? 'Inativar' : 'Ativar'
  return [
    { label: 'Editar', key: 'edit' },
    { label: 'Editar permissões', key: 'edit-permissions' },
    { type: 'divider', key: 'divider-1' },
    { label: 'Reenviar convite', key: 'resend-invite' },
    { label: 'Redefinir senha', key: 'reset-password' },
    { type: 'divider', key: 'divider-2' },
    { label: toggleLabel, key: 'toggle-active' },
    { label: 'Excluir', key: 'delete' }
  ]
}

const buildQuery = () => {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.limit,
    sortBy: sorter.value.columnKey,
    sortDirection: sorter.value.order === 'ascend' ? 'asc' : 'desc'
  }

  const search = filters.search.trim()
  if (search) {
    if (search.includes('@')) {
      params.email = search
    } else {
      params.name = search
    }
  }

  return params
}

const fetchRoles = async () => {
  try {
    const api = useApi()
    const roles = await api<Role[]>('/api/v1/roles')
    availableRoles.value = roles
    roleFilterOptions.value = roles
      .sort((a, b) => roleRank(a.code) - roleRank(b.code))
      .map((role) => ({ label: role.name, value: role.code }))
  } catch (err) {
    message.error('Erro ao carregar papéis')
  }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<UsersResponse>('/api/v1/users', { query: buildQuery() })
    users.value = res.data
    pagination.total = res.meta.total
    pagination.page = res.meta.page
    pagination.limit = res.meta.limit
  } catch (err) {
    message.error('Erro ao buscar usuários')
  } finally {
    loading.value = false
  }
}

const hasAdminRoleId = (roleIds: number[]) => {
  return roleIds.some((roleId) => {
    const role = availableRoles.value.find((item) => Number(item.id) === Number(roleId))
    return role?.code === 'ADMIN'
  })
}

const isEmailTaken = async (email: string, currentUserId?: number) => {
  const api = useApi()
  const response = await api<UsersResponse>('/api/v1/users', {
    query: { page: 1, limit: 20, email, sortBy: 'updated_at', sortDirection: 'desc' }
  })
  return response.data.some((user) => user.email.toLowerCase() === email.toLowerCase() && user.id !== currentUserId)
}

const handleSubmit = async (payload: User) => {
  saving.value = true
  const api = useApi()
  try {
    const emailInUse = await isEmailTaken(payload.email, payload.id)
    if (emailInUse) {
      message.warning('Já existe um usuário com este e-mail.')
      return
    }

    const currentUserId = authStore.user?.id
    if (payload.id && currentUserId && payload.id === currentUserId) {
      if (!payload.isActive) {
        message.warning('Você não pode inativar o próprio usuário por este formulário.')
        return
      }
      if (!hasAdminRoleId(payload.roleIds)) {
        message.warning('Você não pode remover suas permissões críticas por este formulário.')
        return
      }
    }

    if (payload.id) {
      const currentData = users.value.find((user) => user.id === payload.id)
      const wasActiveAdmin = Boolean(currentData?.isActive && hasRole(currentData, 'ADMIN'))
      const willBeActiveAdmin = Boolean(payload.isActive && hasAdminRoleId(payload.roleIds))
      if (wasActiveAdmin && !willBeActiveAdmin) {
        const activeAdmins = await countActiveAdmins()
        if (activeAdmins <= 1) {
          message.warning('Não é permitido remover o último administrador ativo.')
          return
        }
      }
    }

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

const countActiveAdmins = async () => {
  const api = useApi()
  const firstPage = await api<UsersResponse>('/api/v1/users', {
    query: { page: 1, limit: 200, sortBy: 'updated_at', sortDirection: 'desc' }
  })

  const allUsers: User[] = [...firstPage.data]
  const totalPages = Math.ceil(firstPage.meta.total / firstPage.meta.limit)

  if (totalPages > 1) {
    const requests: Promise<UsersResponse>[] = []
    for (let page = 2; page <= totalPages; page += 1) {
      requests.push(
        api<UsersResponse>('/api/v1/users', {
          query: { page, limit: firstPage.meta.limit, sortBy: 'updated_at', sortDirection: 'desc' }
        })
      )
    }
    const pages = await Promise.all(requests)
    pages.forEach((result) => allUsers.push(...result.data))
  }

  return allUsers.filter((user) => user.isActive && hasRole(user, 'ADMIN')).length
}

const canModifyTarget = async (user: User, action: 'delete' | 'deactivate') => {
  const currentUserId = authStore.user?.id
  if (currentUserId && user.id === currentUserId) {
    message.warning(`Você não pode ${action === 'delete' ? 'excluir' : 'inativar'} o próprio usuário.`)
    return false
  }

  if (user.isActive && hasRole(user, 'ADMIN')) {
    try {
      const activeAdmins = await countActiveAdmins()
      if (activeAdmins <= 1) {
        message.warning('Não é permitido remover o último administrador ativo.')
        return false
      }
    } catch {
      message.error('Não foi possível validar os administradores ativos.')
      return false
    }
  }

  return true
}

const confirmDelete = (user: User) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o usuário ${user.name}? Esta ação não poderá ser desfeita.`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      if (!(await canModifyTarget(user, 'delete'))) return
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

const toggleUserStatus = (user: User) => {
  const willActivate = !user.isActive
  const actionLabel = willActivate ? 'ativar' : 'inativar'

  dialog.warning({
    title: willActivate ? 'Confirmar ativação' : 'Confirmar inativação',
    content: `Deseja ${actionLabel} o usuário ${user.name}?`,
    positiveText: willActivate ? 'Ativar' : 'Inativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      if (!willActivate && !(await canModifyTarget(user, 'deactivate'))) return
      const api = useApi()
      try {
        await api(`/api/v1/users/${user.id}`, {
          method: 'PATCH',
          body: { isActive: willActivate }
        })
        message.success(`Usuário ${willActivate ? 'ativado' : 'inativado'} com sucesso`)
        fetchUsers()
      } catch (err: any) {
        message.error(err?.data?.message || `Erro ao ${actionLabel} usuário`)
      }
    }
  })
}

const handleActionSelect = (key: string, user: User) => {
  if (key === 'edit' || key === 'edit-permissions') {
    openEdit(user)
    return
  }

  if (key === 'resend-invite') {
    message.info('Reenvio de convite será disponibilizado em breve.')
    return
  }

  if (key === 'reset-password') {
    message.info('Redefinição de senha será disponibilizada em breve.')
    return
  }

  if (key === 'toggle-active') {
    toggleUserStatus(user)
    return
  }

  if (key === 'delete') {
    confirmDelete(user)
  }
}

const openCreate = () => {
  editingUser.value = null
  canSubmitUserForm.value = false
  showModal.value = true
}

const openEdit = (user: User) => {
  editingUser.value = user
  canSubmitUserForm.value = false
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitUserForm = async () => {
  await userFormRef.value?.submit()
}

const onUserFormValidityChange = (isValid: boolean) => {
  canSubmitUserForm.value = isValid
}

const handleFilter = () => {
  pagination.page = 1
  fetchUsers()
}

const handleClearFilters = () => {
  filters.search = ''
  filters.roleCode = null
  filters.isActive = null
  sorter.value = { columnKey: 'updated_at', order: 'descend' }
  pagination.page = 1
  fetchUsers()
}

const applyMobileFilters = () => {
  showMobileFilters.value = false
  pagination.page = 1
  fetchUsers()
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
  sorter.value = {
    columnKey: (s.columnKey as string) || 'updated_at',
    order: s.order || 'descend'
  }
  pagination.page = 1
  fetchUsers()
}

const rowProps = (row: User) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(iso))
}

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  await fetchRoles()
  await fetchUsers()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateIsMobile)
})
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

.summary-label {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  display: block;
  margin-top: 10px;
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.summary-value-mobile {
  display: block;
  margin-top: 8px;
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  color: #111827;
}

.filters-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
}

.filters-card :deep(.n-card__content) {
  padding: 14px 16px !important;
}

.filters-grid {
  display: grid;
  gap: 10px;
  align-items: stretch;
}

.filters-grid-users {
  grid-template-columns: 2fr 1fr 1fr auto;
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

.user-cell {
  min-width: 0;
}

.user-name {
  margin: 0;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.1;
  color: #111827;
}

.roles-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-tag {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.role-tag-admin {
  background: #eef2ff !important;
  color: #3730a3 !important;
  border: 1px solid #c7d2fe !important;
}

.role-tag-vet {
  background: #f3f4f6 !important;
  color: #374151 !important;
  border: 1px solid #e5e7eb !important;
}

.role-tag-neutral {
  background: #f3f4f6 !important;
  color: #374151 !important;
  border: 1px solid #e5e7eb !important;
}

:deep(.role-tag.n-tag) {
  border-width: 1px !important;
}

:deep(.role-tag.role-tag-admin.n-tag) {
  background: #eef2ff !important;
  color: #3730a3 !important;
  border-color: #c7d2fe !important;
}

:deep(.role-tag.role-tag-vet.n-tag) {
  background: #f3f4f6 !important;
  color: #374151 !important;
  border-color: #e5e7eb !important;
}

:deep(.role-tag.role-tag-neutral.n-tag) {
  background: #f3f4f6 !important;
  color: #374151 !important;
  border-color: #e5e7eb !important;
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

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
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

.ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  padding-top: 8px !important;
  padding-bottom: 8px !important;
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

.card-subtitle {
  margin: 0;
  font-size: 12px;
  color: #64748b;
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
  margin-left: 4px;
}

.card-line-roles {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-role-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
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

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .filters-grid-users {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .head-cta {
    width: 100%;
  }

  h1 {
    font-size: 19px;
    line-height: 1.1;
  }

  .subhead {
    font-size: 13px;
  }

  .menu-button {
    min-width: 44px;
    width: 44px;
    height: 40px;
  }

  .card-actions :deep(.n-button) {
    min-height: 40px;
  }

}
</style>

<style>
:root .n-modal-container:has(.user-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.user-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.user-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.user-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.user-modal.n-card {
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

.user-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.user-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.user-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.user-modal .modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-modal .modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.user-modal .modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.user-modal .modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .user-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .user-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .user-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .user-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .user-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .user-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
