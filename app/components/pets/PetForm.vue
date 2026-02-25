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
        <n-input v-model:value="model.name" placeholder="Nome do pet" />
      </n-form-item>
      <n-form-item label="Tutor" path="clientId" required>
        <n-select
          v-model:value="model.clientId"
          :options="clientOptions"
          placeholder="Selecione o tutor"
          filterable
          remote
          clearable
          :loading="clientLoading"
          @search="onClientSearch"
          @focus="ensureClientsLoaded"
        />
      </n-form-item>
      <n-form-item label="Espécie" path="speciesId" required>
        <n-select
          v-model:value="model.speciesId"
          :options="speciesOptions"
          placeholder="Selecione a espécie"
          filterable
          remote
          clearable
          :loading="speciesLoading"
          @search="onSpeciesSearch"
          @focus="ensureSpeciesLoaded"
        />
      </n-form-item>
      <n-form-item label="Raça" path="breedId">
        <n-select
          v-model:value="model.breedId"
          :options="breedOptions"
          placeholder="Selecione a raça"
          filterable
          remote
          clearable
          :loading="breedLoading"
          :disabled="!model.speciesId"
          @search="onBreedSearch"
          @focus="ensureBreedsLoaded"
        />
      </n-form-item>
      <n-form-item label="Sexo" path="sex" required>
        <n-select
          v-model:value="model.sex"
          :options="sexOptions"
          placeholder="Selecione o sexo"
          clearable
        />
      </n-form-item>
      <n-form-item label="Data de nascimento" path="dateOfBirth">
        <n-date-picker
          v-model:value="dateOfBirthValue"
          type="date"
          clearable
          class="full-width"
        />
      </n-form-item>
      <n-form-item label="Peso (kg)" path="weightKg">
        <n-input-number
          v-model:value="model.weightKg"
          placeholder="0.0"
          :min="0"
          :step="0.1"
          clearable
        />
      </n-form-item>
      <n-form-item label="Cor" path="color">
        <n-input v-model:value="model.color" placeholder="Cor do pet" />
      </n-form-item>
      <n-form-item label="Microchip" path="microchipCode">
        <n-input v-model:value="model.microchipCode" placeholder="MC-123456" />
      </n-form-item>
      <n-form-item label="Alergias" path="allergies" class="full-row">
        <n-input
          v-model:value="model.allergies"
          type="textarea"
          :rows="2"
          placeholder="Ex.: Poeira"
        />
      </n-form-item>
      <n-form-item label="Doenças crônicas" path="chronicDiseases" class="full-row">
        <n-input
          v-model:value="model.chronicDiseases"
          type="textarea"
          :rows="2"
          placeholder="Ex.: Diabetes"
        />
      </n-form-item>
      <n-form-item label="Observações" path="notes" class="full-row">
        <n-input
          v-model:value="model.notes"
          type="textarea"
          :rows="3"
          placeholder="Comportamento, cuidados especiais..."
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
import { useMessage, type FormInst, type FormRules, type SelectOption } from 'naive-ui'

export interface Pet {
  id?: number
  name: string
  clientId: number | null
  client?: {
    id: number
    name: string
  }
  speciesId: number | null
  species?: {
    id: number
    name: string
  }
  breedId: number | null
  breed?: {
    id: number
    name: string
    speciesId?: number
  }
  sex?: string | null
  dateOfBirth?: string | null
  weightKg?: number | null
  color?: string | null
  microchipCode?: string | null
  allergies?: string | null
  chronicDiseases?: string | null
  notes?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

interface ClientsResponse {
  data: { id: number; name: string }[]
}

interface SpeciesResponse {
  data: { id: number; name: string }[]
}

interface BreedsResponse {
  data: { id: number; name: string; speciesId?: number }[]
}

const props = defineProps<{
  value?: Pet | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Pet): void
  (e: 'cancel'): void
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const model = reactive<Pet>({
  id: undefined,
  name: '',
  clientId: null,
  speciesId: null,
  breedId: null,
  sex: null,
  dateOfBirth: '',
  weightKg: null,
  color: '',
  microchipCode: '',
  allergies: '',
  chronicDiseases: '',
  notes: '',
  isActive: true
})

const sexOptions: SelectOption[] = [
  { label: 'Macho', value: 'M' },
  { label: 'Fêmea', value: 'F' }
]

const clientOptions = ref<SelectOption[]>([])
const clientLoading = ref(false)
const speciesOptions = ref<SelectOption[]>([])
const speciesLoading = ref(false)
const breedOptions = ref<SelectOption[]>([])
const breedLoading = ref(false)

const normalizeId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

const dedupeOptions = (options: SelectOption[]) => {
  const seen = new Set<number>()
  return options.filter((opt) => {
    const normalizedValue = normalizeId(opt.value as string | number)
    if (normalizedValue === null) return true
    if (seen.has(normalizedValue)) return false
    seen.add(normalizedValue)
    return true
  })
}

const upsertOption = (options: SelectOption[], value: number | null, label?: string) => {
  const normalizedValue = normalizeId(value)
  if (normalizedValue === null) return dedupeOptions(options)
  let found = false
  const next = options.map((opt) => {
    const optValue = normalizeId(opt.value as string | number)
    if (optValue === normalizedValue) {
      found = true
      if (label && opt.label !== label) {
        return { ...opt, label }
      }
    }
    return opt
  })
  if (!found) {
    next.unshift({ label: label || `ID ${normalizedValue}`, value: normalizedValue })
  }
  return dedupeOptions(next)
}

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  clientId: {
    required: true,
    trigger: ['change', 'blur'],
    validator: (_rule, value: number | null) =>
      value === null ? new Error('Selecione o tutor') : true
  },
  speciesId: {
    required: true,
    trigger: ['change', 'blur'],
    validator: (_rule, value: number | null) =>
      value === null ? new Error('Selecione a espécie') : true
  },
  sex: {
    required: true,
    trigger: ['change', 'blur'],
    validator: (_rule, value: string | null) =>
      !value ? new Error('Selecione o sexo') : true
  }
}

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar pet'))

const dateOfBirthValue = computed({
  get: () => {
    if (!model.dateOfBirth) return null
    const [year, month, day] = model.dateOfBirth.split('-').map((part) => Number(part))
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day).getTime()
  },
  set: (value) => {
    if (!value) {
      model.dateOfBirth = ''
      return
    }
    const date = new Date(value)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    model.dateOfBirth = `${yyyy}-${mm}-${dd}`
  }
})

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', {
    ...model,
    clientId: model.clientId != null ? Number(model.clientId) : null,
    speciesId: model.speciesId != null ? Number(model.speciesId) : null,
    breedId: model.breedId != null ? Number(model.breedId) : null,
    weightKg: model.weightKg != null ? Number(model.weightKg) : null
  })
}

const fetchClientOptions = async (search?: string) => {
  clientLoading.value = true
  try {
    const { data } = await $fetch<ClientsResponse>('/api/v1/clients', {
      query: {
        limit: 20,
        ...(search ? { name: search } : {})
      }
    })
    clientOptions.value = data.map((item) => ({ label: item.name, value: Number(item.id) }))
    clientOptions.value = upsertOption(clientOptions.value, model.clientId, props.value?.client?.name)
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar clientes')
  } finally {
    clientLoading.value = false
  }
}

const fetchSpeciesOptions = async (search?: string) => {
  speciesLoading.value = true
  try {
    const { data } = await $fetch<SpeciesResponse>('/api/v1/species', {
      query: {
        limit: 20,
        ...(search ? { name: search } : {})
      }
    })
    speciesOptions.value = data.map((item) => ({ label: item.name, value: Number(item.id) }))
    speciesOptions.value = upsertOption(speciesOptions.value, model.speciesId, props.value?.species?.name)
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar espécies')
  } finally {
    speciesLoading.value = false
  }
}

const fetchBreedOptions = async (search?: string) => {
  if (!model.speciesId) return
  breedLoading.value = true
  try {
    const { data } = await $fetch<BreedsResponse>('/api/v1/breeds', {
      query: {
        limit: 50,
        speciesId: model.speciesId,
        ...(search ? { name: search } : {})
      }
    })
    breedOptions.value = data.map((item) => ({ label: item.name, value: Number(item.id) }))
    breedOptions.value = upsertOption(breedOptions.value, model.breedId, props.value?.breed?.name)
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar raças')
  } finally {
    breedLoading.value = false
  }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      clientId: val?.clientId != null ? Number(val.clientId) : null,
      speciesId: val?.speciesId != null ? Number(val.speciesId) : null,
      breedId: val?.breedId != null ? Number(val.breedId) : null,
      sex: val?.sex ?? null,
      dateOfBirth: val?.dateOfBirth ? val.dateOfBirth.slice(0, 10) : '',
      weightKg: val?.weightKg ?? null,
      color: val?.color ?? '',
      microchipCode: val?.microchipCode ?? '',
      allergies: val?.allergies ?? '',
      chronicDiseases: val?.chronicDiseases ?? '',
      notes: val?.notes ?? '',
      isActive: val?.isActive ?? true
    })
    clientOptions.value = upsertOption(clientOptions.value, model.clientId, val?.client?.name)
    speciesOptions.value = upsertOption(speciesOptions.value, model.speciesId, val?.species?.name)
    breedOptions.value = upsertOption(breedOptions.value, model.breedId, val?.breed?.name)
    if (model.speciesId) {
      fetchBreedOptions()
    } else {
      breedOptions.value = []
    }
  },
  { immediate: true }
)

watch(
  () => model.speciesId,
  (val, prev) => {
    if (!val) {
      breedOptions.value = []
      model.breedId = null
      return
    }
    if (prev != null && val !== prev) {
      model.breedId = null
    }
    fetchBreedOptions()
  }
)

const onClientSearch = (val: string) => {
  fetchClientOptions(val || undefined)
}

const onSpeciesSearch = (val: string) => {
  fetchSpeciesOptions(val || undefined)
}

const onBreedSearch = (val: string) => {
  fetchBreedOptions(val || undefined)
}

const ensureClientsLoaded = () => {
  if (!clientOptions.value.length && !clientLoading.value) {
    fetchClientOptions()
  }
}

const ensureSpeciesLoaded = () => {
  if (!speciesOptions.value.length && !speciesLoading.value) {
    fetchSpeciesOptions()
  }
}

const ensureBreedsLoaded = () => {
  if (!breedOptions.value.length && !breedLoading.value) {
    fetchBreedOptions()
  }
}

onMounted(() => {
  fetchClientOptions()
  fetchSpeciesOptions()
  if (model.speciesId) {
    fetchBreedOptions()
  }
})
</script>

<style scoped>
.grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-top: 6px;
}

.full-row {
  grid-column: 1 / -1;
}

.full-width {
  width: 100%;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
