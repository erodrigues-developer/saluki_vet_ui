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
      <n-form-item label="Nome da raça" path="name" required>
        <n-input v-model:value="model.name" placeholder="Nome da raça" />
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

export interface Breed {
  id?: number
  name: string
  speciesId: number | null
  species?: {
    id: number
    name: string
    createdAt?: string
    updatedAt?: string
  }
  createdAt?: string
  updatedAt?: string
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
  (e: 'cancel'): void
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const model = reactive<Breed>({
  id: undefined,
  name: '',
  speciesId: null
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
      speciesId: val?.speciesId != null ? Number(val.speciesId) : null
    })
    ensureSelectedSpeciesOption(val?.speciesId ?? null, val?.species?.name)
  },
  { immediate: true }
)

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  speciesId: {
    required: true,
    trigger: ['change', 'blur'],
    validator: (_rule, value: number | null) =>
      value === null ? new Error('Selecione uma espécie') : true
  }
}

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar raça'))

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...model, speciesId: model.speciesId != null ? Number(model.speciesId) : null })
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
    speciesOptions.value = data.map((item) => ({ label: item.name, value: item.id }))
    ensureSelectedSpeciesOption(model.speciesId, props.value?.species?.name)
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar espécies')
  } finally {
    speciesLoading.value = false
  }
}

const onSpeciesSearch = (val: string) => {
  fetchSpeciesOptions(val || undefined)
}

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
.grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-top: 6px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
