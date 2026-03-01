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
      <!-- Readonly Information from Appointment if applicable -->
      <n-form-item label="Atendimento Relacionado" path="appointmentId" class="full-row" v-if="appointmentsOptions.length > 0">
        <n-select
          v-model:value="model.appointmentId"
          :options="appointmentsOptions"
          placeholder="Selecione o agendamento prévio (opcional)"
          clearable
          @update:value="handleAppointmentChange"
        />
      </n-form-item>

      <n-form-item label="Cliente" path="clientId" required>
        <n-select
          v-model:value="model.clientId"
          :options="clientOptions"
          placeholder="Selecione"
          filterable
          @update:value="handleClientChange"
        />
      </n-form-item>

      <n-form-item label="Paciente" path="petId" required>
        <n-select
          v-model:value="model.petId"
          :options="petOptions"
          placeholder="Selecione"
          :disabled="!model.clientId"
          filterable
        />
      </n-form-item>

      <n-form-item label="Veterinário Responsável" path="veterinarianId" required>
        <n-select
          v-model:value="model.veterinarianId"
          :options="veterinarianOptions"
          placeholder="Selecione"
          filterable
        />
      </n-form-item>

      <n-form-item label="Data e Hora" path="visitDate" required>
        <n-date-picker
          v-model:value="model.visitDate"
          type="datetime"
          format="dd/MM/yyyy HH:mm"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="Peso (kg)" path="weightKg">
        <n-input-number v-model:value="model.weightKg" :min="0" :precision="2" placeholder="Ex: 5.5" style="width: 100%" />
      </n-form-item>

      <n-form-item label="Temperatura (°C)" path="temperatureC">
        <n-input-number v-model:value="model.temperatureC" :min="0" :precision="1" placeholder="Ex: 38.5" style="width: 100%" />
      </n-form-item>

      <n-form-item label="Queixa Principal" path="mainComplaint" class="full-row">
        <n-input v-model:value="model.mainComplaint" type="textarea" :rows="2" placeholder="Relato do tutor" />
      </n-form-item>

      <n-form-item label="Achados Clínicos" path="clinicalFindings" class="full-row">
        <n-input v-model:value="model.clinicalFindings" type="textarea" :rows="3" placeholder="Exame físico, sintomas avaliados, etc." />
      </n-form-item>

      <n-form-item label="Diagnóstico (Presuntivo / Definitivo)" path="diagnosis" class="full-row">
        <n-input v-model:value="model.diagnosis" type="textarea" :rows="2" placeholder="Diagnóstico" />
      </n-form-item>

      <n-form-item label="Plano de Tratamento / Prescrição" path="treatmentPlan" class="full-row">
        <n-input v-model:value="model.treatmentPlan" type="textarea" :rows="3" placeholder="Medicamentos, orientações..." />
      </n-form-item>

      <n-form-item label="Anotações Privadas" path="notes" class="full-row">
        <n-input v-model:value="model.notes" type="textarea" :rows="2" placeholder="Observações não visíveis na via do tutor" />
      </n-form-item>
    </div>

    <!-- Procedimentos Realizados (Sub-formulário, se fôssemos implementar completo aqui). Mantendo simples no momento e gerenciando na página mãe. -->

    <div class="actions">
      <n-button tertiary @click="$emit('cancel')" :disabled="loading">Cancelar</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        {{ submitLabel }}
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { format } from 'date-fns'

export interface ConsultationPayload {
  id?: number
  appointmentId?: number | null
  petId: number | null
  clientId: number | null
  veterinarianId: number | null
  visitDate: number | null
  weightKg?: number | null
  temperatureC?: number | null
  mainComplaint?: string
  clinicalFindings?: string
  diagnosis?: string
  treatmentPlan?: string
  notes?: string
}

const props = defineProps<{
  value?: ConsultationPayload | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: ConsultationPayload): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInst | null>(null)
const message = useMessage()

const clientOptions = ref<{label: string, value: number}[]>([])
const petOptions = ref<{label: string, value: number}[]>([])
const allPets = ref<any[]>([])
const veterinarianOptions = ref<{label: string, value: number}[]>([])
const appointmentsOptions = ref<{label: string, value: number, data: any}[]>([])

const model = reactive<ConsultationPayload>({
  appointmentId: null,
  petId: null,
  clientId: null,
  veterinarianId: null,
  visitDate: Date.now(),
  weightKg: null,
  temperatureC: null,
  mainComplaint: '',
  clinicalFindings: '',
  diagnosis: '',
  treatmentPlan: '',
  notes: ''
})

const rules: FormRules = {
  clientId: { type: 'number', required: true, message: 'Selecione o cliente', trigger: 'change' },
  petId: { type: 'number', required: true, message: 'Selecione o pet', trigger: 'change' },
  veterinarianId: { type: 'number', required: true, message: 'Selecione o veterinário', trigger: 'change' },
  visitDate: { type: 'number', required: true, message: 'Selecione a data/hora', trigger: 'change' }
}

const loadLookups = async () => {
  const api = useApi()
  try {
    const [clientsRes, petsRes, usersRes, apptsRes] = await Promise.all([
      api<any>('/api/v1/clients?limit=500'),
      api<any>('/api/v1/pets?limit=1000'),
      api<any>('/api/v1/users?limit=100'),
      api<any>('/api/v1/appointments?sortBy=startsAt&sortDirection=desc&limit=50')
    ])

    clientOptions.value = clientsRes.data.map((i: any) => ({ label: i.name, value: Number(i.id) }))
    allPets.value = petsRes.data
    veterinarianOptions.value = usersRes.data.map((i: any) => ({ label: i.name, value: Number(i.id) }))

    appointmentsOptions.value = apptsRes.data.map((a: any) => ({
      label: `Agendamento - ${format(new Date(a.startsAt), 'dd/MM/yyyy HH:mm')} - ${a.reason || 'Sem motivo'}`,
      value: Number(a.id),
      data: a
    }))

    updatePetOptions()
  } catch (err) {
    message.error('Erro ao carregar dados auxiliares')
  }
}

const handleClientChange = () => {
  model.petId = null
  updatePetOptions()
}

const updatePetOptions = () => {
  if (!model.clientId) {
    petOptions.value = []
    return
  }
  const filtered = allPets.value.filter(p => Number(p.clientId) === model.clientId)
  petOptions.value = filtered.map(p => ({ label: p.name, value: Number(p.id) }))
}

const handleAppointmentChange = (val: number | null) => {
  if (val) {
    const appt = appointmentsOptions.value.find(o => o.value === val)?.data
    if (appt) {
      model.clientId = Number(appt.clientId)
      updatePetOptions()
      model.petId = Number(appt.petId)
      if (appt.veterinarianId) model.veterinarianId = Number(appt.veterinarianId)
      model.visitDate = new Date(appt.startsAt).getTime()
      if (appt.reason && !model.mainComplaint) model.mainComplaint = appt.reason
    }
  }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      appointmentId: val?.appointmentId ? Number(val.appointmentId) : null,
      clientId: val?.clientId ? Number(val.clientId) : null,
      petId: val?.petId ? Number(val.petId) : null,
      veterinarianId: val?.veterinarianId ? Number(val.veterinarianId) : null,
      visitDate: val?.visitDate ? new Date(val.visitDate).getTime() : Date.now(),
      weightKg: val?.weightKg ? Number(val.weightKg) : null,
      temperatureC: val?.temperatureC ? Number(val.temperatureC) : null,
      mainComplaint: val?.mainComplaint ?? '',
      clinicalFindings: val?.clinicalFindings ?? '',
      diagnosis: val?.diagnosis ?? '',
      treatmentPlan: val?.treatmentPlan ?? '',
      notes: val?.notes ?? ''
    })
    updatePetOptions()
  },
  { immediate: true }
)

onMounted(() => {
  loadLookups()
})

const submitLabel = computed(() => (model.id ? 'Salvar Registro Clínico' : 'Iniciar Atendimento Clínico'))

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    const payload = {
      ...model,
      visitDate: model.visitDate ? new Date(model.visitDate).toISOString() : null
    }
    emit('submit', payload)
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
