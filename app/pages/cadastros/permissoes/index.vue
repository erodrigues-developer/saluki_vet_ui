<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">SEGURANÇA</p>
        <h1>Permissões</h1>
        <p class="subhead">Gerencie o acesso de cada papel às telas e ações da clínica.</p>
      </div>
    </div>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Papéis cadastrados</p>
        <strong class="summary-value">{{ summary.roles }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Permissões</p>
        <strong class="summary-value">{{ summary.permissions }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Módulos</p>
        <strong class="summary-value">{{ summary.modules }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Papéis com acesso</p>
        <strong class="summary-value">{{ summary.configuredRoles }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Papéis cadastrados</p>
        <strong class="summary-value-mobile">{{ summary.roles }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Permissões</p>
        <strong class="summary-value-mobile">{{ summary.permissions }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Módulos</p>
        <strong class="summary-value-mobile">{{ summary.modules }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Papéis com acesso</p>
        <strong class="summary-value-mobile">{{ summary.configuredRoles }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.search" placeholder="Buscar papel por nome ou código" clearable />
        <n-select v-model:value="filters.module" :options="moduleOptions" placeholder="Módulo" clearable />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="applyFilters">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar papel" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">
          <span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span>
        </n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div v-for="role in paginatedRoles" :key="role.id" class="entity-card" @click="openPermissions(role)">
        <div class="card-head">
          <div class="card-copy">
            <p class="card-title">{{ role.name }}</p>
            <p class="card-subtitle">{{ role.code }}</p>
          </div>
          <n-tag :bordered="false" class="role-chip">{{ role.permissions?.length || 0 }} permissões</n-tag>
        </div>
        <div class="card-meta">
          <p class="card-line">
            <span class="card-line-label">Módulos:</span>
            <span class="card-line-value">{{ roleModules(role).join(', ') || '—' }}</span>
          </p>
          <p class="card-line">
            <span class="card-line-label">Atualizado:</span>
            <span class="card-line-value">{{ formatDate(role.updatedAt || '') || '—' }}</span>
          </p>
        </div>
        <div class="card-actions" @click.stop>
          <n-button v-if="canManagePermissions" size="small" secondary type="primary" @click="openPermissions(role)">Editar permissões</n-button>
          <n-dropdown v-if="actionOptions.length" trigger="click" :options="actionOptions" @select="(key: string) => handleActionSelect(key, role)">
            <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
          </n-dropdown>
        </div>
      </div>

      <div class="pagination">
        <n-pagination
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :item-count="filteredRoles.length"
          show-size-picker
          :page-sizes="pagination.pageSizes"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="paginatedRoles"
      :pagination="tablePagination"
      :bordered="false"
      :row-props="rowProps"
      remote
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="40%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.module" :options="moduleOptions" placeholder="Módulo" clearable />
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
      class="permissions-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ canManagePermissions ? 'Editar permissões' : 'Permissões do papel' }}</h3>
          <p class="modal-subtitle">
            {{ editingRole ? `${editingRole.name} (${editingRole.code})` : 'Defina as permissões do papel.' }}
          </p>
        </div>
      </template>
      <RolePermissionsForm
        v-if="editingRole"
        ref="formRef"
        :role-id="Number(editingRole.id)"
        :show-role-selector="false"
        @saved="handleSaved"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button v-if="canManagePermissions" type="primary" :loading="saving" @click="savePermissions">Salvar permissões</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NTag, useMessage } from 'naive-ui'
import RolePermissionsForm from '~/components/permissions/RolePermissionsForm.vue'
import { PERMISSIONS } from '~/constants/permissions'
import { useAuthStore } from '~/stores/auth'

interface Permission {
  id: number
  code: string
  name: string
  module: string
  resource: string
  action: string
}

interface Role {
  id: number
  code: string
  name: string
  permissions?: Permission[]
  updatedAt?: string
}

const message = useMessage()
const authStore = useAuthStore()

const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingRole = ref<Role | null>(null)
const formRef = ref<{ save: () => Promise<void> } | null>(null)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const filters = reactive({
  search: '',
  module: null as string | null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50]
})

const canManagePermissions = computed(() => authStore.hasPermission(PERMISSIONS.permissionsManage))
const actionOptions = computed(() => canManagePermissions.value ? [{ label: 'Editar permissões', key: 'edit' }] : [])

const moduleOptions = computed(() =>
  [...new Set(permissions.value.map((permission) => permission.module))]
    .sort((a, b) => a.localeCompare(b))
    .map((module) => ({ label: module, value: module }))
)

const summary = computed(() => ({
  roles: roles.value.length,
  permissions: permissions.value.length,
  modules: moduleOptions.value.length,
  configuredRoles: roles.value.filter((role) => (role.permissions || []).length > 0).length
}))

const filteredRoles = computed(() => {
  const search = filters.search.trim().toLowerCase()
  return roles.value.filter((role) => {
    const matchesSearch = !search || `${role.name} ${role.code}`.toLowerCase().includes(search)
    const matchesModule = !filters.module || (role.permissions || []).some((permission) => permission.module === filters.module)
    return matchesSearch && matchesModule
  })
})

const paginatedRoles = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredRoles.value.slice(start, start + pagination.pageSize)
})

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.pageSize,
  itemCount: filteredRoles.value.length,
  showSizePicker: true,
  pageSizes: pagination.pageSizes
}))

const roleModules = (role: Role) => [...new Set((role.permissions || []).map((permission) => permission.module))].sort()

const columns = [
  {
    title: 'Papel',
    key: 'name',
    render: (row: Role) =>
      h('div', { class: 'role-cell' }, [
        h('p', { class: 'role-name ellipsis', title: row.name }, row.name),
        h('p', { class: 'role-code ellipsis', title: row.code }, row.code)
      ])
  },
  {
    title: 'Permissões',
    key: 'permissions',
    render: (row: Role) =>
      h(NTag, { bordered: false, class: 'role-chip' }, { default: () => `${row.permissions?.length || 0} permissões` })
  },
  {
    title: 'Módulos',
    key: 'modules',
    render: (row: Role) => roleModules(row).join(', ') || '—'
  },
  {
    title: 'Atualizado em',
    key: 'updatedAt',
    render: (row: Role) => formatDate(row.updatedAt || '') || '—'
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 190,
    render: (row: Role) =>
      h('div', { class: 'actions' }, [
        canManagePermissions.value ? h(
          NButton,
          {
            size: 'small',
            secondary: true,
            type: 'primary',
            class: 'action-primary',
            onClick: (e) => {
              e.stopPropagation()
              openPermissions(row)
            }
          },
          { default: () => 'Editar permissões' }
        ) : null,
        actionOptions.value.length ? h(
          NDropdown,
          {
            trigger: 'click',
            options: actionOptions.value,
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
        ) : null
      ])
  }
]

const fetchData = async () => {
  loading.value = true
  const api = useApi()
  try {
    const [rolesResponse, permissionsResponse] = await Promise.all([
      api<Role[]>('/api/v1/roles'),
      api<Permission[]>('/api/v1/permissions')
    ])
    roles.value = rolesResponse
    permissions.value = permissionsResponse
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar permissões')
  } finally {
    loading.value = false
  }
}

const openPermissions = (role: Role) => {
  if (!canManagePermissions.value) return
  editingRole.value = role
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingRole.value = null
}

const savePermissions = async () => {
  if (!canManagePermissions.value) return
  saving.value = true
  try {
    await formRef.value?.save()
  } finally {
    saving.value = false
  }
}

const handleSaved = async () => {
  closeModal()
  await fetchData()
}

const handleActionSelect = (key: string, role: Role) => {
  if (!canManagePermissions.value) return
  if (key === 'edit') openPermissions(role)
}

const applyFilters = () => {
  pagination.page = 1
}

const applyMobileFilters = () => {
  showMobileFilters.value = false
  applyFilters()
}

const handleClearFilters = () => {
  filters.search = ''
  filters.module = null
  pagination.page = 1
}

const onPageChange = (page: number) => {
  pagination.page = page
}

const onPageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
}

const rowProps = (row: Role) => ({
  style: { cursor: canManagePermissions.value ? 'pointer' : 'default' },
  onClick: () => {
    if (canManagePermissions.value) openPermissions(row)
  }
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
  await fetchData()
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
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.summary-label {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.summary-value {
  display: block;
  margin-top: 4px;
  font-size: 24px;
  color: #0f172a;
}

.summary-value-mobile {
  display: block;
  margin-top: 2px;
  font-size: 20px;
  color: #0f172a;
}

.filters-card {
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.filters-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr auto;
  gap: 10px;
  align-items: center;
}

.filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.btn-clear {
  color: #64748b;
}

.card-list {
  display: grid;
  gap: 10px;
}

.entity-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.card-head,
.card-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-copy {
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle,
.card-line {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.card-meta {
  display: grid;
  gap: 4px;
  margin-top: 10px;
}

.card-line-label {
  font-weight: 700;
  color: #475569;
}

.card-actions {
  align-items: center;
  margin-top: 10px;
}

.role-cell {
  min-width: 0;
}

.role-name {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.role-code {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 12px;
}

.role-chip {
  background: #e0f2fe;
  color: #075985;
  font-weight: 700;
}

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-button {
  min-width: 32px;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.mobile-filter-top,
.mobile-filter-actions {
  display: flex;
  gap: 8px;
}

.mobile-filter-top {
  align-items: center;
}

.mobile-filter-trigger {
  flex: 0 0 auto;
}

.inline-icon-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mobile-filters-panel {
  display: grid;
  gap: 12px;
}

.mobile-filter-actions {
  justify-content: flex-end;
}

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
  color: #64748b;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  h1 {
    font-size: 19px;
    line-height: 1.1;
  }

  .subhead {
    font-size: 13px;
  }
}
</style>

<style>
:root .n-modal-container:has(.permissions-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.permissions-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.permissions-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.permissions-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.permissions-modal.n-card {
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

.permissions-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.permissions-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.permissions-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .permissions-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .permissions-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .permissions-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .permissions-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .permissions-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .permissions-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
