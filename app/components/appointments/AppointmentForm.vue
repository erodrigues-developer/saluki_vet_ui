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
      <n-form-item label="Cliente" path="clientId" required>
        <n-select
          v-model:value="model.clientId"
          :options="clientOptions"
          placeholder="Selecione o cliente"
          filterable
          clearable
          @update:value="handleClientChange"
        />
      </n-form-item>

      <n-form-item label="Paciente (Pet)" path="petId" required>
        <n-select
          v-model:value="model.petId"
          :options="petOptions"
          placeholder="Selecione o pet"
          :disabled="!model.clientId"
          filterable
          clearable
        />
      </n-form-item>

      <n-form-item label="Tipo de Agendamento" path="appointmentTypeId" required>
        <n-select
          v-model:value="model.appointmentTypeId"
          :options="appointmentTypeOptions"
          placeholder="Ex: Consulta, Vacina..."
        />
      </n-form-item>

      <n-form-item label="Status" path="statusId" required>
        <n-select
          v-model:value="model.statusId"
          :options="statusOptions"
          placeholder="Status"
        />
      </n-form-item>

      <n-form-item label="Veterinário(a)" path="veterinarianId">
        <n-select
          v-model:value="model.veterinarianId"
          :options="veterinarianOptions"
          placeholder="Opcional"
          clearable
        />
      </n-form-item>

      <n-form-item label="Data e Hora Inicial" path="startsAt" required>
        <n-date-picker
          v-model:value="model.startsAt"
          type="datetime"
          clearable
          format="dd/MM/yyyy HH:mm"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="Data e Hora Final" path="endsAt">
        <n-date-picker
          v-model:value="model.endsAt"
          type="datetime"
          clearable
          format="dd/MM/yyyy HH:mm"
          style="width: 100%"
          :is-date-disabled="disablePastStartsAt"
        />
      </n-form-item>

      <n-form-item label="Motivo / Queixa" path="reason" class="full-row">
        <n-input
          v-model:value="model.reason"
          placeholder="Motivo da visita"
        />
      </n-form-item>

      <n-form-item label="Anotações Adicionais" path="notes" class="full-row">
        <n-input
          v-model:value="model.notes"
          type="textarea"
          :rows="2"
          placeholder="Opcional. Observações internas."
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'

export interface AppointmentPayload {
  id?: number
  petId: number | null
  clientId: number | null
  veterinarianId?: number | null
  appointmentTypeId: number | null
  statusId: number | null
  startsAt: number | null // Using timestamp for N-Date-Picker
  endsAt?: number | null
  reason?: string
  notes?: string
}

const props = defineProps<{
  value?: AppointmentPayload | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: AppointmentPayload): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInst | null>(null)
const message = useMessage()

// Select Options
const clientOptions = ref<{label: string, value: number}[]>([])
const petOptions = ref<{label: string, value: number}[]>([])
const allPets = ref<any[]>([])
const appointmentTypeOptions = ref<{label: string, value: number}[]>([])
const statusOptions = ref<{label: string, value: number}[]>([])
const veterinarianOptions = ref<{label: string, value: number}[]>([])

const model = reactive<AppointmentPayload>({
  id: undefined,
  petId: null,
  clientId: null,
  veterinarianId: null,
  appointmentTypeId: null,
  statusId: null,
  startsAt: null,
  endsAt: null,
  reason: '',
  notes: ''
})

const rules: FormRules = {
  clientId: { type: 'number', required: true, message: 'Selecione o cliente', trigger: ['blur', 'change'] },
  petId: { type: 'number', required: true, message: 'Selecione o pet', trigger: ['blur', 'change'] },
  appointmentTypeId: { type: 'number', required: true, message: 'Selecione o tipo', trigger: ['blur', 'change'] },
  statusId: { type: 'number', required: true, message: 'Selecione o status', trigger: ['blur', 'change'] },
  startsAt: { type: 'number', required: true, message: 'Data e hora são obrigatórias', trigger: 'change' },
}

const disablePastStartsAt = (ts: number) => {
  if (!model.startsAt) return false
  return ts < model.startsAt
}

const loadDependencies = async () => {
  const api = useApi()
  try {
    const [clientsRes, petsRes, typesRes, statusesRes, usersRes] = await Promise.all([
      api<any>('/api/v1/clients?limit=500'),
      api<any>('/api/v1/pets?limit=1000'),
      api<any>('/api/v1/appointment-types?limit=100'),
      api<any>('/api/v1/appointment-statuses?limit=100'),
      api<any>('/api/v1/users?limit=100')
    ])

    clientOptions.value = clientsRes.data.map((i: any) => ({ label: i.name, value: Number(i.id) }))
    allPets.value = petsRes.data
    appointmentTypeOptions.value = typesRes.data.map((i: any) => ({ label: i.name, value: Number(i.id) }))
    statusOptions.value = statusesRes.data.map((i: any) => ({ label: i.name, value: Number(i.id) }))
    veterinarianOptions.value = usersRes.data.map((i: any) => ({ label: i.name, value: Number(i.id) }))

    updatePetOptions()
  } catch (err) {
    message.error('Erro ao carregar dados do formulário')
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

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      clientId: val?.clientId ? Number(val.clientId) : null,
      petId: val?.petId ? Number(val.petId) : null,
      veterinarianId: val?.veterinarianId ? Number(val.veterinarianId) : null,
      appointmentTypeId: val?.appointmentTypeId ? Number(val.appointmentTypeId) : null,
      statusId: val?.statusId ? Number(val.statusId) : null,
      startsAt: val?.startsAt ? new Date(val.startsAt).getTime() : null,
      endsAt: val?.endsAt ? new Date(val.endsAt).getTime() : null,
      reason: val?.reason ?? '',
      notes: val?.notes ?? ''
    })
    updatePetOptions()
  },
  { immediate: true }
)

onMounted(() => {
  loadDependencies()
})

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Agendar'))

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    // Format dates before sending
    const payloadToEmit: any = {
      ...model,
      startsAt: model.startsAt ? new Date(model.startsAt).toISOString() : null,
      endsAt: model.endsAt ? new Date(model.endsAt).toISOString() : null,
    }
    emit('submit', payloadToEmit)
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
