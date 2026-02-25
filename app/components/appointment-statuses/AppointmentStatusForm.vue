<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading || model.isSystem"
  >
    <div class="grid">
      <n-form-item label="Nome" path="name" required class="full-row">
        <n-input v-model:value="model.name" placeholder="Ex: Aguardando Resultados, Em Cirurgia..." />
      </n-form-item>

      <n-form-item label="Código (Único)" path="code" required class="full-row">
        <n-input
          v-model:value="model.code"
          placeholder="Ex: WAITING_RESULTS"
          style="text-transform: uppercase;"
          :disabled="!!model.id"
          @input="onCodeInput"
        />
      </n-form-item>

      <n-form-item v-if="model.isSystem" class="full-row">
        <n-alert type="warning" :show-icon="false">
          Este é um status do sistema e não pode ser editado nem removido.
        </n-alert>
      </n-form-item>
    </div>

    <div class="actions">
      <n-button tertiary @click="$emit('cancel')" :disabled="loading">Cancelar</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit" :disabled="model.isSystem">
        Criar Status
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface AppointmentStatus {
  id?: number
  name: string
  code: string
  isSystem: boolean
}

const props = defineProps<{
  value?: AppointmentStatus | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: AppointmentStatus): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<AppointmentStatus>({
  id: undefined,
  name: '',
  code: '',
  isSystem: false
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  code: {
    required: true,
    message: 'Código é obrigatório',
    trigger: ['blur', 'input']
  }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      code: val?.code ?? '',
      isSystem: val?.isSystem ?? false
    })
  },
  { immediate: true }
)

const onCodeInput = (val: string) => {
  model.code = (val || '').toUpperCase().replace(/[^A-Z0-9_]/g, '')
}

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
