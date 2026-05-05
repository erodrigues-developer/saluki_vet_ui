<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <div class="sections">
      <section class="form-section">
        <div class="form-switch-row">
          <h4 class="section-title">Identificação</h4>
          <div class="active-wrap">
            <span class="active-label">Ativo</span>
            <n-switch v-model:value="model.isActive" />
          </div>
        </div>
        <div class="form-grid form-grid-identification">
          <n-form-item label="Nome *" path="name" required class="field-span-name">
            <n-input v-model:value="model.name" placeholder="Nome completo" class="form-control" />
          </n-form-item>
          <n-form-item label="Documento *" path="document" required>
            <n-input
              v-model:value="model.document"
              placeholder="CPF ou CNPJ"
              class="form-control"
              @update:value="onDocumentInput"
            />
          </n-form-item>
        </div>
      </section>

      <section class="form-section">
        <h4 class="section-title">Contato</h4>
        <div class="form-grid">
          <n-form-item label="Celular" path="mobilePhone">
            <n-input
              v-model:value="model.mobilePhone"
              placeholder="(11) 99999-9999"
              class="form-control"
              :input-props="{ maxlength: 15 }"
              @update:value="onMobileInput"
            />
          </n-form-item>
          <n-form-item label="Telefone" path="phone">
            <n-input
              v-model:value="model.phone"
              placeholder="(11) 4002-8922"
              class="form-control"
              :input-props="{ maxlength: 15 }"
              @update:value="onPhoneInput"
            />
          </n-form-item>
          <n-form-item label="E-mail" path="email" class="field-span-2">
            <n-input v-model:value="model.email" placeholder="email@exemplo.com" class="form-control" />
          </n-form-item>
        </div>
      </section>

      <section class="form-section">
        <h4 class="section-title">Endereço</h4>
        <div class="form-grid form-grid-address">
          <n-form-item label="CEP" path="zipCode">
            <n-input
              v-model:value="model.zipCode"
              placeholder="00000-000"
              class="form-control"
              :input-props="{ maxlength: 9 }"
              @update:value="onZipInput"
            />
          </n-form-item>
          <n-form-item label="Rua" path="street" class="field-span-2">
            <n-input v-model:value="model.street" placeholder="Rua / Avenida" class="form-control" />
          </n-form-item>
          <n-form-item label="Número" path="number">
            <n-input v-model:value="model.number" placeholder="Número" class="form-control" />
          </n-form-item>
          <n-form-item label="Complemento" path="complement">
            <n-input v-model:value="model.complement" placeholder="Apto, sala, casa..." class="form-control" />
          </n-form-item>
          <n-form-item label="Bairro" path="district">
            <n-input v-model:value="model.district" placeholder="Bairro" class="form-control" />
          </n-form-item>
          <n-form-item label="Cidade" path="city">
            <n-input v-model:value="model.city" placeholder="Cidade" class="form-control" />
          </n-form-item>
          <n-form-item label="UF" path="state">
            <n-select
              v-model:value="model.state"
              :options="stateOptions"
              placeholder="UF"
              class="form-control"
              filterable
              clearable
            />
          </n-form-item>
        </div>
      </section>

      <section class="form-section">
        <h4 class="section-title">Observações</h4>
        <div class="form-grid">
          <n-form-item label="Observações" path="notes" class="field-span-2">
            <n-input
              v-model:value="model.notes"
              type="textarea"
              :rows="3"
              placeholder="Preferências, recados ou informações importantes"
              class="form-textarea"
            />
          </n-form-item>
        </div>
      </section>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import cepPromise from 'cep-promise'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules, SelectOption } from 'naive-ui'
import { formatBrazilPhone, normalizeBrazilPhoneDigits } from '~/composables/useBrazilPhone'

export interface Client {
  id?: number
  name: string
  document?: string | null
  phone?: string | null
  mobilePhone?: string | null
  email: string
  street?: string | null
  number?: string | null
  complement?: string | null
  district?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  notes?: string | null
  isActive: boolean
}

const props = defineProps<{
  value?: Client | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Client): void
}>()

const message = useMessage()
const zipLoading = ref(false)

const formRef = ref<FormInst | null>(null)
const stateOptions: SelectOption[] = [
  { label: 'AC', value: 'AC' }, { label: 'AL', value: 'AL' }, { label: 'AP', value: 'AP' }, { label: 'AM', value: 'AM' },
  { label: 'BA', value: 'BA' }, { label: 'CE', value: 'CE' }, { label: 'DF', value: 'DF' }, { label: 'ES', value: 'ES' },
  { label: 'GO', value: 'GO' }, { label: 'MA', value: 'MA' }, { label: 'MT', value: 'MT' }, { label: 'MS', value: 'MS' },
  { label: 'MG', value: 'MG' }, { label: 'PA', value: 'PA' }, { label: 'PB', value: 'PB' }, { label: 'PR', value: 'PR' },
  { label: 'PE', value: 'PE' }, { label: 'PI', value: 'PI' }, { label: 'RJ', value: 'RJ' }, { label: 'RN', value: 'RN' },
  { label: 'RS', value: 'RS' }, { label: 'RO', value: 'RO' }, { label: 'RR', value: 'RR' }, { label: 'SC', value: 'SC' },
  { label: 'SP', value: 'SP' }, { label: 'SE', value: 'SE' }, { label: 'TO', value: 'TO' }
]
const model = reactive<Client>({
  id: undefined,
  name: '',
  document: '',
  phone: '',
  mobilePhone: '',
  email: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  zipCode: '',
  notes: '',
  isActive: true
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  email: {
    validator: (_, value) => validateEmail(value),
    trigger: ['blur', 'input']
  },
  document: {
    validator: (_, value) => validateDocument(value),
    trigger: ['blur', 'input']
  },
  phone: {
    validator: (_, value) => validatePhone(value, false),
    trigger: ['blur', 'input']
  },
  mobilePhone: {
    validator: (_, value) => validatePhone(value, true),
    trigger: ['blur', 'input']
  }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      document: val?.document ?? '',
      phone: formatBrazilPhone(val?.phone ?? ''),
      mobilePhone: formatBrazilPhone(val?.mobilePhone ?? ''),
      email: val?.email ?? '',
      street: val?.street ?? '',
      number: val?.number ?? '',
      complement: val?.complement ?? '',
      district: val?.district ?? '',
      city: val?.city ?? '',
      state: val?.state ?? '',
      zipCode: val?.zipCode ?? '',
      notes: val?.notes ?? '',
      isActive: val?.isActive ?? true
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...model })
}
defineExpose({ submit: handleSubmit })

const digitsOnly = (val: string) => (val || '').replace(/\D+/g, '')

const onPhoneInput = (val: string) => {
  model.phone = formatBrazilPhone(val)
}

const onMobileInput = (val: string) => {
  model.mobilePhone = formatBrazilPhone(val)
}

const formatDocument = (val: string) => {
  const digits = digitsOnly(val).slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

const onDocumentInput = (val: string) => {
  model.document = formatDocument(val)
}

const formatZip = (val: string) => {
  const digits = digitsOnly(val).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

const onZipInput = async (val: string) => {
  model.zipCode = formatZip(val)
  const digits = digitsOnly(model.zipCode)
  if (digits.length === 8) {
    await fetchAddressByZip(digits)
  }
}

const fetchAddressByZip = async (zip: string) => {
  if (zipLoading.value) return
  zipLoading.value = true
  try {
    const data = await cepPromise(zip)
    model.street = data.street || model.street
    model.district = data.neighborhood || model.district
    model.city = data.city || model.city
    model.state = data.state || model.state
  } catch (err: any) {
    message.error(err?.message || 'CEP não encontrado')
  } finally {
    zipLoading.value = false
  }
}

const validateDocument = (value: string) => {
  if (!value) return true
  const digits = digitsOnly(value)
  if (digits.length === 11) {
    return isValidCpf(digits) || new Error('CPF inválido')
  }
  if (digits.length === 14) {
    return isValidCnpj(digits) || new Error('CNPJ inválido')
  }
  return new Error('CPF/CNPJ deve ter 11 ou 14 dígitos')
}

const validatePhone = (value: string, _isMobile: boolean) => {
  if (!value) return true
  const len = normalizeBrazilPhoneDigits(value).length
  return (len === 10 || len === 11) || new Error('Telefone deve ter 10 ou 11 dígitos')
}

const validateEmail = (value: string) => {
  if (!value) return true
  const email = String(value).trim()
  if (!email) return true
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return isValid || new Error('E-mail inválido')
}

const isValidCpf = (cpf: string) => {
  if (!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  const calcCheck = (len: number) => {
    const sum = cpf
      .slice(0, len)
      .split('')
      .reduce((acc, cur, idx) => acc + parseInt(cur, 10) * (len + 1 - idx), 0)
    const res = (sum * 10) % 11
    return res === 10 ? 0 : res
  }
  const d1 = calcCheck(9)
  const d2 = calcCheck(10)
  return d1 === parseInt(cpf[9], 10) && d2 === parseInt(cpf[10], 10)
}

const isValidCnpj = (cnpj: string) => {
  if (!cnpj || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false
  const calcCheck = (len: number) => {
    const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const slice = cnpj.slice(0, len)
    const sum = slice
      .split('')
      .reduce((acc, cur, idx) => acc + parseInt(cur, 10) * weights[weights.length - len + idx], 0)
    const res = sum % 11
    return res < 2 ? 0 : 11 - res
  }
  const d1 = calcCheck(12)
  const d2 = calcCheck(13)
  return d1 === parseInt(cnpj[12], 10) && d2 === parseInt(cnpj[13], 10)
}
</script>

<style scoped>
.sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
}

.section-title {
  margin: 0 0 8px;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 700;
  color: #334155;
}

.form-switch-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.active-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  margin-top: 1px;
}

.active-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid-identification {
  grid-template-columns: 2fr 1fr;
  margin-top: 2px;
}

.field-span-name {
  grid-column: span 1;
}

.field-span-2 {
  grid-column: 1 / -1;
}

.form-grid-address :deep(.n-form-item:nth-child(2)) {
  grid-column: 1 / -1;
}

.form-grid-address :deep(.n-form-item:nth-child(5)) {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .form-section {
    padding: 10px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .field-span-2 {
    grid-column: auto;
  }

  .field-span-name {
    grid-column: auto;
  }

  .form-grid-address :deep(.n-form-item:nth-child(2)) {
    grid-column: auto;
  }

  .form-grid-address :deep(.n-form-item:nth-child(5)) {
    grid-column: auto;
  }

  .section-title {
    font-size: 15px;
  }
}
</style>
