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
        <h4 class="section-title">Informações da categoria</h4>
        <div class="status-inline">
          <span class="status-label">Ativo</span>
          <n-switch v-model:value="model.isActive" />
        </div>
      </div>
      <div class="grid">
        <n-form-item label="Nome *" path="name" required class="full-row">
          <n-input v-model:value="model.name" placeholder="Ex.: Medicamentos" />
        </n-form-item>

        <n-form-item label="Descrição" path="description" class="full-row">
          <n-input
            v-model:value="model.description"
            type="textarea"
            :rows="2"
            placeholder="Opcional. Breve descrição sobre a categoria."
          />
        </n-form-item>
      </div>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface ProductCategory {
  id?: number
  name: string
  description?: string | null
  isActive: boolean
  updatedAt?: string
  productsLinked?: number
}

const props = defineProps<{
  value?: ProductCategory | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: ProductCategory): void
  (e: 'validity-change', valid: boolean): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<ProductCategory>({
  id: undefined,
  name: '',
  description: '',
  isActive: true
})

const rules: FormRules = {
  name: {
    required: true,
    message: 'Nome é obrigatório',
    trigger: 'blur',
    validator: (_rule, value: string) => {
      if (!value || !value.trim()) return new Error('Nome é obrigatório')
      return true
    }
  }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      description: val?.description ?? '',
      isActive: val?.isActive ?? true
    })
  },
  { immediate: true }
)

watch(
  () => model.name,
  (value) => {
    emit('validity-change', Boolean(value?.trim()))
  },
  { immediate: true }
)

const submit = async () => {
  await formRef.value?.validate()
  emit('submit', {
    ...model,
    name: model.name.trim()
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
  margin-top: 6px;
}

.full-row {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
