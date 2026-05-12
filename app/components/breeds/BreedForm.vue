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
        <h4 class="section-title">Informações da raça</h4>
        <div class="active-wrap">
          <span class="active-label">Ativo</span>
          <n-switch v-model:value="model.isActive" />
        </div>
      </div>

      <div class="grid">
        <n-form-item label="Espécie *" path="speciesId" required>
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

        <n-form-item label="Nome *" path="name" required>
          <n-input v-model:value="model.name" placeholder="Ex.: Persa" />
        </n-form-item>
      </div>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useMessage, type FormInst, type FormRules, type SelectOption } from 'naive-ui'

export interface Breed {
  id?: number
  name: string
  speciesId: number | null
  isActive: boolean
  species?: {
    id: number
    name: string
    createdAt?: string
    updatedAt?: string
  }
  petsCount?: number
  updatedAt?: string
  createdAt?: string
}

interface SpeciesResponse {
  data: { id: number; name: string }[]
}

const props = defineProps<{
  value?: Breed | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Breed): void
  (e: 'validity-change', valid: boolean): void
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)

const model = reactive<Breed>({
  id: undefined,
  name: '',
  speciesId: null,
  isActive: true
})

const speciesOptions = ref<SelectOption[]>([])
const speciesLoading = ref(false)

const ensureSelectedSpeciesOption = (speciesId: number | null, speciesName?: string) => {
  if (!speciesId) return
  const exists = speciesOptions.value.some((opt) => opt.value === speciesId)
  if (!exists) {
    speciesOptions.value = [
      { label: speciesName || `ID ${speciesId}`, value: speciesId },
      ...speciesOptions.value
    ]
  }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      speciesId: val?.speciesId != null ? Number(val.speciesId) : null,
      isActive: val?.isActive ?? true
    })
    ensureSelectedSpeciesOption(val?.speciesId ?? null, val?.species?.name)
  },
  { immediate: true }
)

const rules: FormRules = {
  speciesId: {
    required: true,
    trigger: ['change', 'blur'],
    validator: (_rule, value: number | null) => (value === null ? new Error('Espécie é obrigatória.') : true)
  },
  name: {
    required: true,
    trigger: ['blur', 'input'],
    validator: (_rule, value: string) => value?.trim() ? true : new Error('Nome da raça é obrigatório.')
  }
}

const isValidLocal = computed(() => Boolean(model.speciesId) && Boolean(model.name?.trim()))
watch(isValidLocal, (valid) => emit('validity-change', valid), { immediate: true })

const submit = async () => {
  await formRef.value?.validate()
  emit('submit', {
    ...model,
    name: model.name.trim(),
    speciesId: model.speciesId != null ? Number(model.speciesId) : null
  })
}

defineExpose({ submit })

const fetchSpeciesOptions = async (search?: string) => {
  speciesLoading.value = true
  const api = useApi()
  try {
    const { data } = await api<SpeciesResponse>('/api/v1/species', {
      query: {
        limit: 30,
        isActive: true,
        ...(search ? { name: search } : {})
      }
    })
    speciesOptions.value = data.map((item) => ({ label: item.name, value: item.id }))
    ensureSelectedSpeciesOption(model.speciesId, props.value?.species?.name)
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar espécies')
  } finally {
    speciesLoading.value = false
  }
}

const onSpeciesSearch = (val: string) => fetchSpeciesOptions(val || undefined)

const ensureSpeciesLoaded = () => {
  if (!speciesOptions.value.length && !speciesLoading.value) {
    fetchSpeciesOptions()
  }
}

onMounted(() => {
  fetchSpeciesOptions()
})
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
