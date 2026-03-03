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
      <n-form-item label="Nome" path="name" required>
        <n-input v-model:value="model.name" placeholder="Ex: Zoetis" />
      </n-form-item>

      <n-form-item label="Razão Social" path="legalName">
        <n-input
          v-model:value="model.legalName"
          placeholder="Ex: Zoetis Industria de Produtos Veterinarios Ltda"
        />
      </n-form-item>

      <n-form-item label="Documento (CPF/CNPJ)" path="document">
        <n-input v-model:value="model.document" placeholder="Somente numeros" />
      </n-form-item>

      <n-form-item label="E-mail" path="email">
        <n-input v-model:value="model.email" placeholder="contato@fornecedor.com" />
      </n-form-item>

      <n-form-item label="Telefone" path="phone">
        <n-input v-model:value="model.phone" placeholder="+55 11 99999-9999" />
      </n-form-item>

      <n-form-item label="Ativo" path="isActive">
        <n-switch v-model:value="model.isActive" />
      </n-form-item>

      <n-form-item label="Observações" path="notes" class="full-row">
        <n-input
          v-model:value="model.notes"
          type="textarea"
          :rows="2"
          placeholder="Opcional"
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
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface Supplier {
  id?: number
  name: string
  legalName?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  isActive: boolean
  notes?: string | null
}

const props = defineProps<{
  value?: Supplier | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Supplier): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<Supplier>({
  id: undefined,
  name: '',
  legalName: '',
  document: '',
  email: '',
  phone: '',
  isActive: true,
  notes: ''
})

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      legalName: val?.legalName ?? '',
      document: val?.document ?? '',
      email: val?.email ?? '',
      phone: val?.phone ?? '',
      isActive: val?.isActive ?? true,
      notes: val?.notes ?? ''
    })
  },
  { immediate: true }
)

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  legalName: { required: false, trigger: 'blur' },
  document: {
    required: false,
    trigger: 'blur',
    validator: (_rule, value: string) => {
      if (!value) return true
      const digits = value.replace(/\D/g, '')
      if (digits.length > 14) {
        return new Error('Documento deve ter no máximo 14 dígitos')
      }
      return true
    }
  },
  email: {
    required: false,
    trigger: 'blur',
    validator: (_rule, value: string) => {
      if (!value) return true
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      return isValid ? true : new Error('E-mail inválido')
    }
  }
}

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar fornecedor'))

const normalizeEmpty = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const handleSubmit = async () => {
  await formRef.value?.validate()

  emit('submit', {
    id: model.id,
    name: model.name.trim(),
    legalName: normalizeEmpty(model.legalName),
    document: normalizeEmpty(model.document),
    email: normalizeEmpty(model.email),
    phone: normalizeEmpty(model.phone),
    isActive: model.isActive,
    notes: normalizeEmpty(model.notes)
  })
}
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
  margin-top: 16px;
}
</style>
