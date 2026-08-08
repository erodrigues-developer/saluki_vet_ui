<template>
  <div class="permissions-form">
    <div v-if="showRoleSelector" class="role-row">
      <n-select
        v-model:value="selectedRoleId"
        :options="roleOptions"
        :loading="loadingRoles"
        placeholder="Selecione um papel"
      />
    </div>

    <div v-if="selectedRoleId" class="permissions-body">
      <n-spin :show="loadingPermissions">
        <n-collapse accordion>
          <n-collapse-item
            v-for="group in groupedPermissions"
            :key="group.module"
            :title="group.module"
            :name="group.module"
          >
            <div class="resource-list">
              <div v-for="resource in group.resources" :key="resource.name" class="resource-block">
                <div class="resource-head">
                  <p class="resource-title">{{ resource.name }}</p>
                  <n-button size="tiny" text @click="toggleResource(resource.permissions)">
                    Alternar grupo
                  </n-button>
                </div>
                <n-checkbox-group v-model:value="selectedPermissionCodes">
                  <div class="permission-grid">
                    <n-checkbox
                      v-for="permission in resource.permissions"
                      :key="permission.code"
                      :value="permission.code"
                    >
                      {{ actionLabel(permission.action) }}
                    </n-checkbox>
                  </div>
                </n-checkbox-group>
              </div>
            </div>
          </n-collapse-item>
        </n-collapse>
      </n-spin>
    </div>

    <n-empty v-else description="Selecione um papel para editar as permissões." />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'

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
  name: string
  code: string
  permissions?: Permission[]
}

const props = withDefaults(defineProps<{
  roleId?: number | null
  showRoleSelector?: boolean
}>(), {
  roleId: null,
  showRoleSelector: true
})

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const message = useMessage()
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const selectedRoleId = ref<number | null>(null)
const selectedPermissionCodes = ref<string[]>([])
const loadingRoles = ref(false)
const loadingPermissions = ref(false)
const saving = ref(false)

const roleOptions = computed(() =>
  roles.value.map((role) => ({
    label: `${role.name} (${role.code})`,
    value: Number(role.id)
  }))
)

const showRoleSelector = computed(() => props.showRoleSelector)

const groupedPermissions = computed(() => {
  const moduleMap = new Map<string, Map<string, Permission[]>>()
  permissions.value.forEach((permission) => {
    const resourceMap = moduleMap.get(permission.module) || new Map<string, Permission[]>()
    const list = resourceMap.get(permission.resource) || []
    list.push(permission)
    resourceMap.set(permission.resource, list)
    moduleMap.set(permission.module, resourceMap)
  })

  return [...moduleMap.entries()].map(([module, resourceMap]) => ({
    module,
    resources: [...resourceMap.entries()].map(([name, list]) => ({
      name,
      permissions: [...list].sort((a, b) => a.action.localeCompare(b.action))
    }))
  }))
})

const actionLabel = (action: string) => {
  const labels: Record<string, string> = {
    view: 'Ver',
    create: 'Criar',
    update: 'Editar',
    delete: 'Excluir',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    checkin: 'Check-in',
    quick_create: 'Cadastro rápido',
    finalize: 'Finalizar',
    finalize_and_bill: 'Finalizar e faturar',
    approve_anamnesis: 'Aprovar anamnese',
    ai: 'IA',
    upload: 'Upload',
    print: 'Imprimir',
    execute: 'Executar',
    pay: 'Pagar',
    receive: 'Receber',
    reverse: 'Estornar',
    download: 'Baixar',
    manage: 'Gerenciar',
    open: 'Abrir',
    close: 'Fechar',
    withdraw: 'Sangria'
  }
  return labels[action] || action
}

const fetchInitialData = async () => {
  loadingRoles.value = true
  loadingPermissions.value = true
  const api = useApi()
  try {
    const [rolesResponse, permissionsResponse] = await Promise.all([
      api<Role[]>('/api/v1/roles'),
      api<Permission[]>('/api/v1/permissions')
    ])
    roles.value = rolesResponse
    permissions.value = permissionsResponse
    selectedRoleId.value = props.roleId ? Number(props.roleId) : (Number(rolesResponse[0]?.id || null) || null)
  } catch (err) {
    message.error('Erro ao carregar permissões')
  } finally {
    loadingRoles.value = false
    loadingPermissions.value = false
  }
}

const fetchRolePermissions = async () => {
  if (!selectedRoleId.value) {
    selectedPermissionCodes.value = []
    return
  }

  loadingPermissions.value = true
  const api = useApi()
  try {
    const response = await api<Permission[]>(`/api/v1/permissions/roles/${selectedRoleId.value}`)
    selectedPermissionCodes.value = response.map((permission) => permission.code)
  } catch (err) {
    message.error('Erro ao carregar permissões do papel')
  } finally {
    loadingPermissions.value = false
  }
}

const toggleResource = (resourcePermissions: Permission[]) => {
  const codes = resourcePermissions.map((permission) => permission.code)
  const allSelected = codes.every((code) => selectedPermissionCodes.value.includes(code))
  if (allSelected) {
    selectedPermissionCodes.value = selectedPermissionCodes.value.filter((code) => !codes.includes(code))
    return
  }

  selectedPermissionCodes.value = [...new Set([...selectedPermissionCodes.value, ...codes])]
}

const save = async () => {
  if (!selectedRoleId.value) return
  saving.value = true
  const api = useApi()
  try {
    await api(`/api/v1/permissions/roles/${selectedRoleId.value}`, {
      method: 'PUT',
      body: { permissionCodes: selectedPermissionCodes.value }
    })
    message.success('Permissões atualizadas')
    emit('saved')
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar permissões')
  } finally {
    saving.value = false
  }
}

watch(selectedRoleId, fetchRolePermissions)
watch(
  () => props.roleId,
  (roleId) => {
    if (roleId) selectedRoleId.value = Number(roleId)
  }
)

onMounted(fetchInitialData)

defineExpose({ save, saving })
</script>

<style scoped>
.permissions-form {
  display: grid;
  gap: 14px;
}

.role-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.permissions-body {
  padding-right: 4px;
}

.resource-list {
  display: grid;
  gap: 12px;
}

.resource-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fff;
}

.resource-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.resource-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px 10px;
}
</style>
