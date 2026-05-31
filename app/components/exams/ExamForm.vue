<template>
  <n-form ref="formRef" :model="model" :rules="rules" label-placement="top" :show-require-mark="false" :disabled="loading">
    <div class="form-stack">
      <n-card size="small" :bordered="false" class="form-card">
        <template #header>Informações do exame</template>
        <div class="grid">
          <n-form-item label="Ativo" path="isActive" class="full-row">
            <n-switch v-model:value="model.isActive" />
          </n-form-item>

          <n-form-item label="Nome" path="name" required class="full-row">
            <n-input v-model:value="model.name" placeholder="Ex: Hemograma completo, Radiografia..." />
          </n-form-item>

          <n-form-item label="Categoria" path="examCategoryId">
            <n-select
              v-model:value="model.examCategoryId"
              :options="categoryOptions"
              placeholder="Selecione uma categoria"
              clearable
              filterable
            />
          </n-form-item>

          <n-form-item label="Preço padrão" path="defaultPrice">
            <n-input-number v-model:value="model.defaultPrice" :min="0" :step="1" :precision="2" placeholder="0,00" style="width: 100%" />
          </n-form-item>

          <n-form-item label="Descrição" path="description" class="full-row">
            <n-input v-model:value="model.description" type="textarea" :rows="3" placeholder="Opcional" />
          </n-form-item>
        </div>
      </n-card>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'

export interface ExamType {
  id?: number
  name: string
  description?: string | null
  defaultPrice?: number | null
  examCategoryId?: number | null
  examCategory?: { id: number; name: string } | null
  isActive: boolean
  updatedAt?: string
}

const props = defineProps<{ value?: ExamType | null; loading?: boolean }>()
const emit = defineEmits<{ (e: 'submit', payload: ExamType): void }>()

const formRef = ref<FormInst | null>(null)
const message = useMessage()
const categoryOptions = ref<{ label: string, value: number }[]>([])

const model = reactive<ExamType>({
  id: undefined,
  name: '',
  description: '',
  defaultPrice: null,
  examCategoryId: null,
  isActive: true
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  defaultPrice: {
    validator: (_rule, value) => {
      if (value === null || value === undefined) return true
      return Number(value) >= 0
    },
    message: 'Preço padrão deve ser maior ou igual a zero',
    trigger: ['blur', 'change']
  }
}

watch(() => props.value, (val) => {
  Object.assign(model, {
    id: val?.id,
    name: val?.name ?? '',
    description: val?.description ?? '',
    defaultPrice: val?.defaultPrice !== undefined && val?.defaultPrice !== null ? Number(val.defaultPrice) : null,
    examCategoryId: val?.examCategoryId ? Number(val.examCategoryId) : null,
    isActive: val?.isActive ?? true
  })
}, { immediate: true })

const loadCategories = async () => {
  try {
    const api = useApi()
    const res = await api<any>('/api/v1/exam-categories?limit=100')
    const rows = Array.isArray(res?.data) ? res.data : []
    categoryOptions.value = rows.map((item: any) => ({
      label: item.name,
      value: Number(item.id)
    }))
  } catch {
    message.error('Erro ao carregar categorias de exame')
  }
}

onMounted(() => { loadCategories() })

const submit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...model })
}

defineExpose({ submit })
</script>

<style scoped>
.form-stack { display: flex; flex-direction: column; gap: 12px; }
.form-card { border: 1px solid #e5e7eb; border-radius: 12px; }
.grid { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
.full-row { grid-column: 1 / -1; }

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
