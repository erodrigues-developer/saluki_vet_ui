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

      <n-form-item label="Nome do Tipo" path="name" required class="full-row">
        <n-input v-model:value="model.name" placeholder="Ex: Consulta Clínica, Vacinação..." />
      </n-form-item>

      <n-form-item label="Descrição" path="description" class="full-row">
        <n-input
          v-model:value="model.description"
          type="textarea"
          :rows="3"
          placeholder="Opcional. Ex: Avaliação geral do pet..."
        />
      </n-form-item>

      <n-form-item label="Duração Padrão (minutos)" path="defaultDurationMinutes">
        <n-input-number
          v-model:value="model.defaultDurationMinutes"
          :min="1"
          :step="5"
          placeholder="Ex: 30"
          style="width: 100%"
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
  (e: 'cancel'): void
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
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  defaultDurationMinutes: { type: 'number', required: true, message: 'Duração é obrigatória', trigger: ['blur', 'change'] }
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

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar tipo'))

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
  grid-template-columns: 1fr 1fr;
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
