<template>
  <n-form
    :model="model"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
    class="prescription-form"
  >
    <section class="form-section compact">
      <div class="section-head">
        <h3>Paciente e atendimento</h3>
        <p>Confira o vínculo clínico antes de emitir o receituário.</p>
      </div>

      <div class="patient-card">
        <div class="patient-card-icon" aria-hidden="true">Rx</div>
        <div class="patient-card-content">
          <p class="patient-card-eyebrow">Receita do paciente</p>
          <h4>{{ patientSummary }}</h4>
          <div v-if="tutorLabel || veterinarianLabel" class="patient-card-meta">
            <span v-if="tutorLabel">Tutor: {{ tutorLabel }}</span>
            <span v-if="veterinarianLabel">Veterinário: {{ veterinarianLabel }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="form-section">
      <div class="section-head">
        <h3>Conteúdo da prescrição</h3>
        <p>Descreva posologia, frequência e duração do tratamento.</p>
      </div>

      <n-form-item label="Conteúdo da prescrição">
        <n-input
          v-model:value="model.content"
          type="textarea"
          :rows="10"
          :autosize="{ minRows: 10, maxRows: 16 }"
          placeholder="Ex.: Dipirona 1 gota/kg VO a cada 8h por 5 dias..."
          class="prescription-textarea"
        />
      </n-form-item>
    </section>

    <section class="form-section">
      <div class="section-head">
        <h3>Datas</h3>
        <p>Defina a emissão e, se necessário, a validade do documento.</p>
      </div>

      <div class="grid">
        <n-form-item label="Data de emissão">
          <n-date-picker
            v-model:value="model.prescribedAt"
            type="datetime"
            format="dd/MM/yyyy HH:mm"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="Validade">
          <n-date-picker
            v-model:value="model.expirationDate"
            type="date"
            format="dd/MM/yyyy"
            style="width: 100%"
            clearable
          />
        </n-form-item>
      </div>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  loading?: boolean
  petId: number | null
  consultationId?: number | null
  petLabel: string
  consultationLabel?: string
  tutorLabel?: string
  veterinarianLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', payload: any): void
}>()

const message = useMessage()

const model = reactive({
  content: '',
  prescribedAt: Date.now(),
  expirationDate: null as number | null,
})

const patientSummary = computed(() => {
  if (props.consultationLabel) {
    return `${props.petLabel} · ${props.consultationLabel}`
  }
  return props.petLabel
})

watch(
  () => props.petId,
  () => {
    model.content = ''
    model.prescribedAt = Date.now()
    model.expirationDate = null
  }
)

const handleSubmit = () => {
  if (!props.petId) {
    message.warning('Selecione um paciente antes de emitir a receita.')
    return
  }

  if (!model.content.trim()) {
    message.warning('Preencha o conteúdo da prescrição.')
    return
  }

  emit('submit', {
    petId: props.petId,
    consultationId: props.consultationId ?? undefined,
    content: model.content.trim(),
    prescribedAt: new Date(model.prescribedAt).toISOString(),
    expirationDate: model.expirationDate
      ? new Date(model.expirationDate).toISOString().slice(0, 10)
      : undefined,
  })
}

defineExpose({
  submit: handleSubmit,
})
</script>

<style scoped>
.prescription-form {
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

.form-section.compact {
  gap: 12px;
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

.patient-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #f8fbff;
}

.patient-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  flex: 0 0 auto;
}

.patient-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.patient-card-eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.patient-card-content h4 {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: #0f172a;
  font-weight: 600;
}

.patient-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 12px;
  color: #475569;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.prescription-textarea {
  width: 100%;
}

.prescription-textarea :deep(textarea) {
  min-height: 220px;
  resize: vertical;
}

@media (max-width: 640px) {
  .form-section {
    padding: 14px;
    border-radius: 12px;
  }

  .patient-card {
    padding: 12px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
