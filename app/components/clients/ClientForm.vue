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
      <n-input v-model:value="model.name" placeholder="Nome completo" />
    </n-form-item>
    <n-form-item label="E-mail" path="email" required>
      <n-input v-model:value="model.email" placeholder="email@exemplo.com" />
    </n-form-item>
    <n-form-item label="Documento" path="document">
      <n-input v-model:value="model.document" placeholder="CPF/CNPJ" @input="onDocumentInput" />
    </n-form-item>
    <n-form-item label="Telefone" path="phone">
      <n-input v-model:value="model.phone" placeholder="(11) 4002-8922" @input="onPhoneInput('phone')" />
    </n-form-item>
    <n-form-item label="Celular" path="mobilePhone">
      <n-input v-model:value="model.mobilePhone" placeholder="(11) 99999-9999" @input="onPhoneInput('mobilePhone')" />
    </n-form-item>
    <n-form-item label="Rua" path="street">
      <n-input v-model:value="model.street" placeholder="Rua / Avenida" />
    </n-form-item>
    <n-form-item label="Número" path="number">
        <n-input v-model:value="model.number" placeholder="1000" />
      </n-form-item>
      <n-form-item label="Complemento" path="complement">
        <n-input v-model:value="model.complement" placeholder="Apto, sala..." />
      </n-form-item>
      <n-form-item label="Bairro" path="district">
        <n-input v-model:value="model.district" placeholder="Bairro" />
      </n-form-item>
      <n-form-item label="Cidade" path="city">
        <n-input v-model:value="model.city" placeholder="Cidade" />
      </n-form-item>
    <n-form-item label="UF" path="state">
      <n-input v-model:value="model.state" placeholder="SP" />
    </n-form-item>
    <n-form-item label="CEP" path="zipCode">
      <n-input v-model:value="model.zipCode" placeholder="00000-000" @input="onZipInput" />
    </n-form-item>
    <n-form-item label="Observações" path="notes">
      <n-input v-model:value="model.notes" type="textarea" :rows="3" placeholder="Preferências, recados..." />
    </n-form-item>
    <n-form-item label="Ativo" path="isActive">
        <n-switch v-model:value="model.isActive" />
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
import cepPromise from 'cep-promise'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

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
  (e: 'cancel'): void
}>()

const message = useMessage()
const zipLoading = ref(false)

const formRef = ref<FormInst | null>(null)
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
  email: [
    { required: true, message: 'E-mail é obrigatório', trigger: 'blur' },
    { type: 'email', message: 'E-mail inválido', trigger: ['blur', 'input'] }
  ],
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
      phone: val?.phone ?? '',
      mobilePhone: val?.mobilePhone ?? '',
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

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar cliente'))

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...model })
}

const digitsOnly = (val: string) => (val || '').replace(/\D+/g, '')

const formatPhone = (val: string, isMobile: boolean) => {
  const digits = digitsOnly(val).slice(0, isMobile ? 11 : 10)
  if (digits.length <= 2) return digits
  if (digits.length <= (isMobile ? 7 : 6)) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (isMobile) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
}

const onPhoneInput = (field: 'phone' | 'mobilePhone') => (val: string) => {
  model[field] = formatPhone(val, field === 'mobilePhone')
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

const validatePhone = (value: string, isMobile: boolean) => {
  if (!value) return true
  const len = digitsOnly(value).length
  const expected = isMobile ? 11 : 10
  return len === expected || new Error(`Telefone deve ter ${expected} dígitos`)
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
.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
