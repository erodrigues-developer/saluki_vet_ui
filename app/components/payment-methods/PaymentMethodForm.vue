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
        <h4 class="section-title">Informações da forma</h4>
        <div class="active-wrap">
          <span class="active-label">Ativo</span>
          <n-switch v-model:value="model.isActive" />
        </div>
      </div>

      <div class="grid">
        <n-form-item label="Nome *" path="name" required>
          <n-input v-model:value="model.name" placeholder="Ex.: Cartão de crédito" />
        </n-form-item>

        <n-form-item label="Código interno *" path="code" required>
          <n-input
            v-model:value="model.code"
            placeholder="Ex.: CREDIT_CARD"
            @update:value="onCodeInput"
          />
        </n-form-item>

        <n-form-item label="Código fiscal NFC-e" path="fiscalPaymentTypeCode">
          <n-select
            v-model:value="model.fiscalPaymentTypeCode"
            :options="fiscalPaymentTypeOptions"
            :loading="loadingFiscalPaymentTypes"
            placeholder="Selecione o código tPag"
            filterable
            clearable
          />
        </n-form-item>

        <n-form-item label="Integração TEF" path="integrationType">
          <n-select
            v-model:value="model.integrationType"
            :options="integrationTypeOptions"
            placeholder="Selecione"
            clearable
          />
        </n-form-item>
      </div>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface PaymentMethod {
  id?: number
  name: string
  code: string
  fiscalPaymentTypeCode?: string | null
  integrationType?: string | null
  isActive: boolean
  updatedAt?: string
  createdAt?: string
  usagesCount?: number
}

interface FiscalPaymentType {
  code: string
  label: string
}

const props = defineProps<{
  value?: PaymentMethod | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: PaymentMethod): void
  (e: 'validity-change', valid: boolean): void
}>()

const formRef = ref<FormInst | null>(null)
const loadingFiscalPaymentTypes = ref(false)
const fiscalPaymentTypes = ref<FiscalPaymentType[]>([])
const model = reactive<PaymentMethod>({
  id: undefined,
  name: '',
  code: '',
  fiscalPaymentTypeCode: '',
  integrationType: null,
  isActive: true
})

const integrationTypeOptions = [
  { label: 'Não integrado', value: 'NOT_INTEGRATED' },
  { label: 'Integrado/TEF', value: 'INTEGRATED' }
]

const fallbackFiscalPaymentTypes: FiscalPaymentType[] = [
  { code: '01', label: 'Dinheiro' },
  { code: '02', label: 'Cheque' },
  { code: '03', label: 'Cartão de crédito' },
  { code: '04', label: 'Cartão de débito' },
  { code: '05', label: 'Cartão da loja / crediário' },
  { code: '10', label: 'Vale alimentação' },
  { code: '11', label: 'Vale refeição' },
  { code: '12', label: 'Vale presente' },
  { code: '13', label: 'Vale combustível' },
  { code: '15', label: 'Boleto bancário' },
  { code: '16', label: 'Depósito bancário' },
  { code: '17', label: 'PIX dinâmico' },
  { code: '18', label: 'Transferência bancária / TED' },
  { code: '19', label: 'Programa de fidelidade / cashback / crédito virtual' },
  { code: '20', label: 'PIX estático' },
  { code: '21', label: 'Crédito em loja' },
  { code: '22', label: 'Pagamento eletrônico não informado' },
  { code: '23', label: 'PIX automático' },
  { code: '24', label: 'TEF / Book Transfer' },
  { code: '90', label: 'Sem pagamento' },
  { code: '91', label: 'Pagamento posterior' },
  { code: '99', label: 'Outros' }
]

const fiscalPaymentTypeOptions = computed(() =>
  (fiscalPaymentTypes.value.length ? fiscalPaymentTypes.value : fallbackFiscalPaymentTypes)
    .map((item) => ({
      label: `${item.code} - ${item.label}`,
      value: item.code
    }))
)

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      code: val?.code ?? '',
      fiscalPaymentTypeCode: val?.fiscalPaymentTypeCode ?? '',
      integrationType: val?.integrationType ?? null,
      isActive: val?.isActive ?? true
    })
  },
  { immediate: true }
)

const normalizeCode = (value: string) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

const onCodeInput = (value: string) => {
  model.code = normalizeCode(value)
}

const fetchFiscalPaymentTypes = async () => {
  loadingFiscalPaymentTypes.value = true
  try {
    const api = useApi()
    const data = await api<FiscalPaymentType[]>('/api/v1/fiscal/payment-types')
    fiscalPaymentTypes.value = Array.isArray(data) ? data : []
  } catch {
    fiscalPaymentTypes.value = fallbackFiscalPaymentTypes
  } finally {
    loadingFiscalPaymentTypes.value = false
  }
}

const rules: FormRules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    validator: (_rule, value: string) => value?.trim() ? true : new Error('Nome é obrigatório.')
  },
  code: {
    required: true,
    trigger: ['blur', 'input'],
    validator: (_rule, value: string) => {
      if (!value?.trim()) return new Error('Código interno é obrigatório.')
      if (!/^[A-Z0-9_]+$/.test(value.trim())) {
        return new Error('Use apenas letras maiúsculas, números e underscore.')
      }
      return true
    }
  }
}

const isValidLocal = computed(() => {
  return Boolean(model.name?.trim()) && Boolean(model.code?.trim()) && /^[A-Z0-9_]+$/.test(model.code.trim())
})

watch(isValidLocal, (valid) => emit('validity-change', valid), { immediate: true })

onMounted(() => {
  fetchFiscalPaymentTypes()
})

const submit = async () => {
  await formRef.value?.validate()
  emit('submit', {
    ...model,
    name: model.name.trim(),
    code: normalizeCode(model.code),
    fiscalPaymentTypeCode: String(model.fiscalPaymentTypeCode || '').trim() || null,
    integrationType: String(model.integrationType || '').trim() || null
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
  .form-section {
    padding: 12px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
