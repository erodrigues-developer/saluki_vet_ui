<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <section class="form-section">
      <div class="section-head">
        <h4 class="section-title">Informações do terminal</h4>
        <div class="active-wrap">
          <span class="active-label">Ativo</span>
          <n-switch v-model:value="model.isActive" />
        </div>
      </div>

      <div class="grid">
        <n-form-item label="Nome *" path="name" required>
          <n-input v-model:value="model.name" placeholder="Ex.: Caixa Recepção 01" />
        </n-form-item>
        <n-form-item label="Código *" path="code" required>
          <n-input v-model:value="model.code" placeholder="Ex.: RECEPTION_01" @update:value="onCodeInput" />
        </n-form-item>
        <n-form-item label="Impressora padrão" path="defaultPrinterId">
          <n-select v-model:value="model.defaultPrinterId" :options="printerOptions" clearable placeholder="Selecione uma impressora" />
        </n-form-item>
        <n-form-item label="Descrição" path="description">
          <n-input v-model:value="model.description" placeholder="Opcional" />
        </n-form-item>
      </div>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface CashRegisterTerminal {
  id?: number
  name: string
  code: string
  description?: string | null
  defaultPrinterId?: number | null
  isActive: boolean
}

const props = defineProps<{
  value?: CashRegisterTerminal | null
  loading?: boolean
  printerOptions: Array<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  (e: 'submit', payload: CashRegisterTerminal): void
  (e: 'validity-change', valid: boolean): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<CashRegisterTerminal>({
  name: '',
  code: '',
  description: '',
  defaultPrinterId: null,
  isActive: true
})

const normalizeCode = (value: string) =>
  String(value || '').toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')

const onCodeInput = (value: string) => {
  model.code = normalizeCode(value)
}

watch(
  () => props.value,
  (value) => {
    Object.assign(model, {
      id: value?.id,
      name: value?.name || '',
      code: value?.code || '',
      description: value?.description || '',
      defaultPrinterId: value?.defaultPrinterId || null,
      isActive: value?.isActive ?? true
    })
  },
  { immediate: true }
)

const rules: FormRules = {
  name: {
    required: true,
    trigger: ['input', 'blur'],
    validator: (_rule, value: string) => value?.trim() ? true : new Error('Nome é obrigatório.')
  },
  code: {
    required: true,
    trigger: ['input', 'blur'],
    validator: (_rule, value: string) => /^[A-Z0-9_]+$/.test(value || '') ? true : new Error('Código inválido.')
  }
}

const isValid = computed(() => Boolean(model.name.trim()) && /^[A-Z0-9_]+$/.test(model.code))
watch(isValid, (valid) => emit('validity-change', valid), { immediate: true })

const submit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...model, name: model.name.trim(), code: normalizeCode(model.code), description: model.description?.trim() || null })
}

defineExpose({ submit })
</script>

<style scoped>
.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 14px 16px;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}
.active-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.active-label {
  font-size: 14px;
  color: #334155;
  font-weight: 600;
}
.grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
