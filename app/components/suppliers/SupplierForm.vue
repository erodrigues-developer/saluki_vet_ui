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
        <h4 class="section-title">Informações do fornecedor</h4>
        <div class="status-inline">
          <span class="status-label">Ativo</span>
          <n-switch v-model:value="model.isActive" />
        </div>
      </div>
      <div class="grid info-grid">
        <n-form-item label="Nome *" path="name" required>
          <n-input v-model:value="model.name" placeholder="Ex.: Zoetis" />
        </n-form-item>

        <n-form-item label="CPF/CNPJ *" path="document" required>
          <n-input
            v-model:value="model.document"
            placeholder="Somente números"
            @update:value="onDocumentInput"
          />
        </n-form-item>

        <n-form-item label="Razão social" path="legalName" class="full-row">
          <n-input
            v-model:value="model.legalName"
            placeholder="Ex.: Zoetis Indústria de Produtos Veterinários Ltda."
          />
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
    </section>

    <section class="form-section">
      <div class="section-head">
        <h4 class="section-title">Contato</h4>
      </div>
      <div class="grid">
        <n-form-item label="E-mail" path="email">
          <n-input v-model:value="model.email" placeholder="contato@fornecedor.com" />
        </n-form-item>

        <n-form-item label="Telefone" path="phone">
          <n-input
            v-model:value="model.phone"
            placeholder="(11) 99999-9999"
            :input-props="{ maxlength: 15 }"
            @update:value="onPhoneInput"
          />
        </n-form-item>
      </div>
    </section>

  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { formatBrazilPhone } from '~/composables/useBrazilPhone'

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
  (e: 'validity-change', valid: boolean): void
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
      document: formatDocumentMask(val?.document ?? ''),
      email: val?.email ?? '',
      phone: formatBrazilPhone(val?.phone ?? ''),
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
    required: true,
    trigger: ['blur', 'input'],
    validator: (_rule, value: string) => {
      if (!value || !value.trim()) return new Error('CPF/CNPJ é obrigatório.')
      const digits = value.replace(/\D/g, '')
      if (digits.length !== 11 && digits.length !== 14) {
        return new Error('Informe um CPF/CNPJ válido.')
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
      return isValid ? true : new Error('Informe um e-mail válido.')
    }
  },
  phone: {
    required: false,
    trigger: ['blur', 'input'],
    validator: (_rule, value: string) => {
      if (!value) return true
      const digits = value.replace(/\D/g, '')
      if (digits.length !== 10 && digits.length !== 11) {
        return new Error('Informe um telefone válido.')
      }
      return true
    }
  }
}

function formatDocumentMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

const onPhoneInput = (value: string) => {
  model.phone = formatBrazilPhone(value)
}

const onDocumentInput = (value: string) => {
  model.document = formatDocumentMask(value || '')
}

const normalizeEmpty = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const isValidLocal = () => {
  const nameOk = Boolean(model.name?.trim())
  const documentDigits = String(model.document || '').replace(/\D/g, '')
  const documentOk = documentDigits.length === 11 || documentDigits.length === 14
  const emailOk = !model.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(model.email)
  const phoneDigits = String(model.phone || '').replace(/\D/g, '')
  const phoneOk = !model.phone || phoneDigits.length === 10 || phoneDigits.length === 11
  return nameOk && documentOk && emailOk && phoneOk
}

watch(
  () => [model.name, model.document, model.email, model.phone],
  () => {
    emit('validity-change', isValidLocal())
  },
  { immediate: true }
)

const submit = async () => {
  await formRef.value?.validate()

  emit('submit', {
    id: model.id,
    name: model.name.trim(),
    legalName: normalizeEmpty(model.legalName),
    document: normalizeEmpty(String(model.document || '').replace(/\D/g, '')),
    email: normalizeEmpty(model.email),
    phone: normalizeEmpty(model.phone),
    isActive: model.isActive,
    notes: normalizeEmpty(model.notes)
  })
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

.form-section + .form-section {
  margin-top: 12px;
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

.status-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
}

.info-grid {
  grid-template-columns: 2fr 1fr;
}

.full-row {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
