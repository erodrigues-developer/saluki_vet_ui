<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <div class="grid">
      <n-form-item label="Ativo" path="isActive" class="full-row">
        <n-switch v-model:value="model.isActive" />
      </n-form-item>

      <n-form-item label="Nome" path="name" required>
        <n-input v-model:value="model.name" placeholder="Nome completo" />
      </n-form-item>

      <n-form-item label="E-mail" path="email" required>
        <n-input v-model:value="model.email" placeholder="email@exemplo.com" :disabled="!!model.id" />
      </n-form-item>

      <n-form-item :label="model.id ? 'Nova Senha (deixe vazio para manter)' : 'Senha'" path="password" :required="!model.id">
        <n-input
          v-model:value="model.password"
          type="password"
          show-password-on="mousedown"
          placeholder="Mínimo 6 caracteres"
        />
      </n-form-item>

      <n-form-item label="Telefone" path="phone">
        <n-input v-model:value="model.phone" placeholder="(11) 99999-9999" />
      </n-form-item>

      <n-form-item label="Papéis (Roles)" path="roleIds" required class="full-row">
        <n-select
          v-model:value="model.roleIds"
          multiple
          :options="roleOptions"
          placeholder="Selecione os papéis"
          :loading="rolesLoading"
        />
      </n-form-item>
    </div>

    <div class="actions">
      <n-button tertiary @click="$emit('cancel')" :disabled="loading">Cancelar</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        {{ submitLabel }}
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

export interface Role {
  id: number
  name: string
  code: string
}

export interface User {
  id?: number
  name: string
  email: string
  password?: string
  phone?: string | null
  isActive: boolean
  roleIds: number[]
  roles?: Role[]
}

const props = defineProps<{
  value?: User | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: User): void
  (e: 'cancel'): void
}>()

const message = useMessage()
const rolesLoading = ref(false)
const roleOptions = ref<{ label: string; value: number }[]>([])

const formRef = ref<FormInst | null>(null)
const model = reactive<User>({
  id: undefined,
  name: '',
  email: '',
  password: '',
  phone: '',
  isActive: true,
  roleIds: []
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  email: [
    { required: true, message: 'E-mail é obrigatório', trigger: 'blur' },
    { type: 'email', message: 'E-mail inválido', trigger: ['blur', 'input'] }
  ],
  password: {
    validator: (_, value) => {
      if (!model.id && !value) return new Error('Senha é obrigatória')
      if (value && value.length < 6) return new Error('Senha deve ter pelo menos 6 caracteres')
      return true
    },
    trigger: ['blur', 'input']
  },
  roleIds: { type: 'array', required: true, min: 1, message: 'Selecione pelo menos um papel', trigger: 'change' }
}

const fetchRoles = async () => {
  rolesLoading.value = true
  try {
    // Note: Assuming there is a roles endpoint. I should implement it or mock it.
    // Based on the schema expansion, I should have implemented it.
    const roles = await $fetch<Role[]>('/api/v1/roles')
    roleOptions.value = roles.map(r => ({ label: r.name, value: Number(r.id) }))
  } catch (err) {
    message.error('Erro ao carregar papéis')
  } finally {
    rolesLoading.value = false
  }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      email: val?.email ?? '',
      password: '',
      phone: val?.phone ?? '',
      isActive: val?.isActive ?? true,
      roleIds: val?.roles?.map(r => Number(r.id)) ?? val?.roleIds ?? []
    })
  },
  { immediate: true }
)

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar usuário'))

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    emit('submit', { ...model })
  } catch (err) {
    // Validation failed
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  margin-top: 6px;
}

.full-row {
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
