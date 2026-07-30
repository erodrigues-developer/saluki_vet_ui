<template>
  <n-form ref="formRef" :model="model" :rules="rules" label-placement="top" :show-require-mark="false" :disabled="loading">
    <section class="form-section">
      <div class="section-head">
        <h4 class="section-title">Informações da impressora</h4>
        <div class="active-wrap">
          <span class="active-label">Ativo</span>
          <n-switch v-model:value="model.isActive" />
        </div>
      </div>

      <div class="grid">
        <n-form-item label="Nome *" path="name" required>
          <n-input v-model:value="model.name" placeholder="Ex.: Impressora Recepção" />
        </n-form-item>
        <n-form-item label="Código *" path="code" required>
          <n-input v-model:value="model.code" placeholder="Ex.: RECEPCAO_80MM" @update:value="onCodeInput" />
        </n-form-item>
        <n-form-item label="Tipo de conexão *" path="connectionType" required>
          <n-select v-model:value="model.connectionType" :options="connectionOptions" />
        </n-form-item>
        <n-form-item label="Destino *" path="target" required>
          <n-input v-model:value="model.target" placeholder="browser" />
        </n-form-item>
        <n-form-item label="Bobina" path="paperWidthMm">
          <n-select v-model:value="model.paperWidthMm" :options="paperOptions" />
        </n-form-item>
        <n-form-item label="Colunas" path="columns">
          <n-input-number v-model:value="model.columns" :min="32" :max="64" style="width: 100%" />
        </n-form-item>
      </div>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface ThermalPrinter {
  id?: number
  name: string
  code: string
  connectionType: string
  target: string
  paperWidthMm: number
  columns: number
  supportsQrCode: boolean
  isActive: boolean
}

const props = defineProps<{ value?: ThermalPrinter | null; loading?: boolean }>()
const emit = defineEmits<{ (e: 'submit', payload: ThermalPrinter): void; (e: 'validity-change', valid: boolean): void }>()
const formRef = ref<FormInst | null>(null)

const model = reactive<ThermalPrinter>({
  name: '',
  code: '',
  connectionType: 'BROWSER_PRINT',
  target: 'browser',
  paperWidthMm: 80,
  columns: 48,
  supportsQrCode: true,
  isActive: true
})

const connectionOptions = [
  { label: 'Navegador', value: 'BROWSER_PRINT' },
  { label: 'Rede ESC/POS', value: 'NETWORK_ESC_POS' },
  { label: 'Agente local', value: 'LOCAL_AGENT' },
  { label: 'Download PDF', value: 'PDF_DOWNLOAD' }
]
const paperOptions = [
  { label: '80 mm', value: 80 },
  { label: '58 mm', value: 58 }
]

const normalizeCode = (value: string) =>
  String(value || '').toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')

const onCodeInput = (value: string) => { model.code = normalizeCode(value) }

watch(() => model.paperWidthMm, (value) => {
  model.columns = value === 58 ? 32 : 48
})

watch(
  () => props.value,
  (value) => {
    Object.assign(model, {
      id: value?.id,
      name: value?.name || '',
      code: value?.code || '',
      connectionType: value?.connectionType || 'BROWSER_PRINT',
      target: value?.target || 'browser',
      paperWidthMm: value?.paperWidthMm || 80,
      columns: value?.columns || 48,
      supportsQrCode: value?.supportsQrCode ?? true,
      isActive: value?.isActive ?? true
    })
  },
  { immediate: true }
)

const rules: FormRules = {
  name: { required: true, trigger: ['input', 'blur'], validator: (_rule, value: string) => value?.trim() ? true : new Error('Nome é obrigatório.') },
  code: { required: true, trigger: ['input', 'blur'], validator: (_rule, value: string) => /^[A-Z0-9_]+$/.test(value || '') ? true : new Error('Código inválido.') },
  target: { required: true, trigger: ['input', 'blur'], validator: (_rule, value: string) => value?.trim() ? true : new Error('Destino é obrigatório.') }
}

const isValid = computed(() => Boolean(model.name.trim()) && /^[A-Z0-9_]+$/.test(model.code) && Boolean(model.target.trim()))
watch(isValid, (valid) => emit('validity-change', valid), { immediate: true })

const submit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...model, name: model.name.trim(), code: normalizeCode(model.code), target: model.target.trim() })
}

defineExpose({ submit })
</script>

<style scoped>
.form-section { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; padding: 14px 16px; }
.section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
.section-title { margin: 0; font-size: 15px; font-weight: 700; color: #111827; }
.active-wrap { display: inline-flex; align-items: center; gap: 8px; }
.active-label { font-size: 14px; color: #334155; font-weight: 600; }
.grid { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
</style>
