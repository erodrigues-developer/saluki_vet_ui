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
      <n-form-item label="Consulta de origem" path="consultationId">
        <n-select
          v-model:value="model.consultationId"
          :options="consultationOptions"
          placeholder="Opcional"
          clearable
          filterable
          @update:value="handleConsultationChange"
        />
      </n-form-item>

      <n-form-item label="Paciente" path="petId" required>
        <n-select
          v-model:value="model.petId"
          :options="petOptions"
          placeholder="Selecione o paciente"
          filterable
        />
      </n-form-item>

      <n-form-item label="Box / Leito" path="boxId" required>
        <n-select
          v-model:value="model.boxId"
          :options="boxOptions"
          placeholder="Selecione um box livre"
          filterable
        />
      </n-form-item>

      <n-form-item label="Data/Hora de admissão" path="admissionAt">
        <n-date-picker
          v-model:value="model.admissionAt"
          type="datetime"
          format="dd/MM/yyyy HH:mm"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="Motivo clínico" path="reason" class="full-row">
        <n-input
          v-model:value="model.reason"
          type="textarea"
          :rows="2"
          placeholder="Ex: pós-operatório, fluidoterapia, observação neurológica..."
        />
      </n-form-item>

      <n-form-item label="Observações" path="notes" class="full-row">
        <n-input
          v-model:value="model.notes"
          type="textarea"
          :rows="3"
          placeholder="Anotações iniciais para a equipe de plantão."
        />
      </n-form-item>
    </div>

    <div class="actions">
      <n-button tertiary @click="$emit('cancel')" :disabled="loading">Cancelar</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        Confirmar Internação
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

type OptionItem = {
  label: string
  value: number
  petId?: number
}

export interface InpatientAdmissionPayload {
  consultationId?: number | null
  petId: number | null
  boxId: number | null
  admissionAt: number | null
  reason?: string
  notes?: string
}

const props = defineProps<{
  loading?: boolean
  petOptions: OptionItem[]
  boxOptions: OptionItem[]
  consultationOptions: OptionItem[]
  initialValue?: Partial<InpatientAdmissionPayload> | null
}>()

const emit = defineEmits<{
  (e: 'submit', payload: any): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<InpatientAdmissionPayload>({
  consultationId: null,
  petId: null,
  boxId: null,
  admissionAt: Date.now(),
  reason: '',
  notes: ''
})

const rules: FormRules = {
  petId: { type: 'number', required: true, message: 'Selecione o paciente', trigger: 'change' },
  boxId: { type: 'number', required: true, message: 'Selecione o box', trigger: 'change' },
}

const handleConsultationChange = (value: number | null) => {
  if (!value) return
  const selected = props.consultationOptions.find((item) => item.value === value)
  if (selected?.petId) {
    model.petId = selected.petId
  }
}

watch(
  () => props.initialValue,
  (value) => {
    Object.assign(model, {
      consultationId: value?.consultationId ?? null,
      petId: value?.petId ?? null,
      boxId: value?.boxId ?? null,
      admissionAt:
        typeof value?.admissionAt === 'number'
          ? value.admissionAt
          : value?.admissionAt
            ? new Date(value.admissionAt as any).getTime()
            : Date.now(),
      reason: value?.reason ?? '',
      notes: value?.notes ?? '',
    })
  },
  { immediate: true }
)

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    emit('submit', {
      consultationId: model.consultationId,
      petId: model.petId,
      boxId: model.boxId,
      admissionAt: model.admissionAt ? new Date(model.admissionAt).toISOString() : undefined,
      reason: model.reason || undefined,
      notes: model.notes || undefined,
    })
  } catch (_error) {
    // validation handled by form
  }
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.full-row {
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
