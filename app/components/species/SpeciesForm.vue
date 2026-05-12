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
        <h4 class="section-title">Informações da espécie</h4>
        <div class="active-wrap">
          <span class="active-label">Ativo</span>
          <n-switch v-model:value="model.isActive" />
        </div>
      </div>

      <n-form-item label="Nome *" path="name" required>
        <n-input v-model:value="model.name" placeholder="Ex.: Cachorro" />
      </n-form-item>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface Species {
  id?: number
  name: string
  isActive: boolean
  breedsCount?: number
  updatedAt?: string
  createdAt?: string
}

const props = defineProps<{
  value?: Species | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Species): void
  (e: 'validity-change', valid: boolean): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<Species>({
  id: undefined,
  name: '',
  isActive: true
})

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      isActive: val?.isActive ?? true
    })
  },
  { immediate: true }
)

const rules: FormRules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    validator: (_rule, value: string) => value?.trim() ? true : new Error('Nome é obrigatório.')
  }
}

const isValidLocal = computed(() => Boolean(model.name?.trim()))
watch(isValidLocal, (valid) => emit('validity-change', valid), { immediate: true })

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

@media (max-width: 768px) {
  .form-section {
    padding: 12px;
  }
}
</style>
