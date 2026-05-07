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
        <h4 class="section-title">Informações do tipo</h4>
        <div class="status-inline">
          <span class="status-label">Ativo</span>
          <n-switch v-model:value="model.isActive" />
        </div>
      </div>
      <div class="grid">
        <n-form-item label="Nome *" path="name" required class="full-row">
          <n-input v-model:value="model.name" placeholder="Ex: Consulta clínica, Vacinação..." />
        </n-form-item>

        <n-form-item label="Descrição" path="description" class="full-row">
          <n-input
            v-model:value="model.description"
            type="textarea"
            :rows="2"
            placeholder="Opcional. Ex: Avaliação geral do pet..."
          />
        </n-form-item>

        <n-form-item label="Duração padrão *" path="defaultDurationMinutes">
          <div class="duration-field">
            <n-input-number
              v-model:value="model.defaultDurationMinutes"
              :min="5"
              :step="5"
              placeholder="Ex: 30"
              style="width: 100%"
            />
            <span class="duration-suffix">min</span>
          </div>
        </n-form-item>
      </div>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface AppointmentType {
  id?: number
  name: string
  description?: string | null
  defaultDurationMinutes: number
  isActive: boolean
}

const props = defineProps<{
  value?: AppointmentType | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: AppointmentType): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<AppointmentType>({
  id: undefined,
  name: '',
  description: '',
  defaultDurationMinutes: 30,
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
  },
  defaultDurationMinutes: {
    type: 'number',
    required: true,
    trigger: ['blur', 'change'],
    validator: (_rule, value: number) => {
      if (value === null || value === undefined) return new Error('Duração padrão é obrigatória')
      if (!Number.isFinite(Number(value))) return new Error('Informe uma duração válida')
      if (Number(value) <= 0) return new Error('Duração deve ser maior que zero')
      if (Number(value) < 5) return new Error('Duração mínima é 5 min')
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
      defaultDurationMinutes: val?.defaultDurationMinutes ?? 30,
      isActive: val?.isActive ?? true
    })
  },
  { immediate: true }
)

const submit = async () => {
  await formRef.value?.validate()
  emit('submit', {
    ...model,
    name: model.name.trim(),
    defaultDurationMinutes: Number(model.defaultDurationMinutes)
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
}

.full-row {
  grid-column: 1 / -1;
}

.duration-field {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
}

.duration-suffix {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
