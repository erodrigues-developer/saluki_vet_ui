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
      <n-form-item label="Nome da Categoria" path="name" required class="full-row">
        <n-input v-model:value="model.name" placeholder="Ex: Medicamentos, Rações, Acessórios..." />
      </n-form-item>

      <n-form-item label="Descrição" path="description" class="full-row">
        <n-input
          v-model:value="model.description"
          type="textarea"
          :rows="3"
          placeholder="Opcional. Breve descrição sobre a categoria."
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
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface ProductCategory {
  id?: number
  name: string
  description?: string | null
}

const props = defineProps<{
  value?: ProductCategory | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: ProductCategory): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<ProductCategory>({
  id: undefined,
  name: '',
  description: ''
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      description: val?.description ?? ''
    })
  },
  { immediate: true }
)

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar categoria'))

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    emit('submit', { ...model })
  } catch (err) {
    // Validation failed
  }
}
</script>

<style scoped>
.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
  margin-top: 6px;
}

.full-row {
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
