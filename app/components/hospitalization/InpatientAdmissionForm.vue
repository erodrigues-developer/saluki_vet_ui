<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
    class="admission-form"
  >
    <section class="form-section">
      <div class="section-head">
        <h3>Origem e paciente</h3>
        <p>Associe a internação ao contexto clínico correto.</p>
      </div>

      <div class="grid">
        <n-form-item label="Consulta de origem" path="consultationId">
          <n-select
            v-model:value="model.consultationId"
            :options="consultationOptions"
            placeholder="Selecione uma consulta, se houver"
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
      </div>
    </section>

    <section class="form-section">
      <div class="section-head">
        <h3>Internação</h3>
        <p>Defina o leito e o momento de admissão.</p>
      </div>

      <div class="grid">
        <n-form-item label="Box/Leito" path="boxId" required>
          <n-select
            v-model:value="model.boxId"
            :options="boxOptions"
            placeholder="Selecione um leito disponível"
            filterable
          />
        </n-form-item>

        <n-form-item label="Data/Hora de admissão" path="admissionAt">
          <n-date-picker
            v-model:value="model.admissionAt"
            type="datetime"
            format="dd/MM/yyyy HH:mm"
            style="width: 100%"
            placeholder="Data/hora atual"
          />
        </n-form-item>
      </div>
    </section>

    <section class="form-section">
      <div class="section-head">
        <h3>Informações clínicas</h3>
        <p>Registre o motivo da admissão e orientações iniciais para a equipe.</p>
      </div>

      <div class="stack">
        <n-form-item label="Motivo clínico" path="reason">
          <n-input
            v-model:value="model.reason"
            type="textarea"
            :rows="3"
            placeholder="Ex.: pós-operatório, fluidoterapia, observação neurológica..."
          />
        </n-form-item>

        <n-form-item label="Observações" path="notes">
          <n-input
            v-model:value="model.notes"
            type="textarea"
            :rows="3"
            placeholder="Anotações iniciais para a equipe de plantão."
          />
        </n-form-item>
      </div>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

type OptionItem = {
  label: string
  value: number
  petId?: number
  clientId?: number | null
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
  petId: {
    required: true,
    trigger: 'change',
    validator: (_rule, value: number | null) => {
      if (value === null) return new Error('Selecione o paciente')
      const selected = props.petOptions.find((item) => item.value === value)
      if (!selected?.clientId) {
        return new Error('O paciente precisa estar vinculado a um tutor')
      }
      return true
    },
  },
  boxId: { type: 'number', required: true, message: 'Selecione o box', trigger: 'change' },
  reason: {
    required: true,
    trigger: ['input', 'blur'],
    validator: (_rule, value?: string) =>
      String(value || '').trim() ? true : new Error('Informe o motivo clínico'),
  },
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
      reason: String(model.reason || '').trim(),
      notes: model.notes || undefined,
    })
  } catch (_error) {
    // validation handled by form
  }
}

defineExpose({
  submit: handleSubmit,
})
</script>

<style scoped>
.admission-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-head h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  color: #0f172a;
}

.section-head p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 720px) {
  .form-section {
    padding: 14px;
    border-radius: 12px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
