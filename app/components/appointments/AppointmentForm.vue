<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <div class="section">
      <h4 class="section-title">Paciente</h4>
      <div class="grid">
        <n-form-item path="clientId" required>
          <template #label>
            <div class="field-label-row">
              <span>Cliente *</span>
              <button v-if="allowQuickCreate" type="button" class="inline-action" @click="$emit('quick-create')">+ Novo cliente</button>
            </div>
          </template>
          <n-select
            v-model:value="model.clientId"
            :options="clientOptions"
            placeholder="Selecione o cliente"
            filterable
            clearable
            @update:value="handleClientChange"
          />
        </n-form-item>

        <n-form-item path="petId" required>
          <template #label>
            <div class="field-label-row">
              <span>Paciente/Pet *</span>
              <button v-if="allowQuickCreate" type="button" class="inline-action" @click="$emit('quick-create')">+ Novo pet</button>
            </div>
          </template>
          <n-select
            v-model:value="model.petId"
            :options="petOptions"
            placeholder="Selecione o pet"
            :disabled="!model.clientId"
            filterable
            clearable
          />
        </n-form-item>
      </div>
    </div>

    <div class="section">
      <h4 class="section-title">Agendamento</h4>
      <div class="grid">
        <n-form-item label="Tipo de agendamento *" path="appointmentTypeId" required>
          <n-select
            v-model:value="model.appointmentTypeId"
            :options="appointmentTypeOptions"
            placeholder="Ex: Consulta, Vacinação..."
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

        <n-form-item
          label="Data e hora inicial *"
          path="startsAt"
          required
          :validation-status="startsAtExternalError ? 'error' : undefined"
          :feedback="startsAtExternalError || undefined"
        >
          <n-date-picker
            v-model:value="model.startsAt"
            type="datetime"
            clearable
            format="dd/MM/yyyy HH:mm"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="Duração">
          <n-select
            v-model:value="durationMinutes"
            :options="durationOptions"
            placeholder="Opcional"
            clearable
          />
        </n-form-item>

        <n-form-item label="Término previsto">
          <div class="field-stack">
            <n-input :value="predictedEndAt" disabled />
            <p class="field-help">Calculado automaticamente pela duração.</p>
          </div>
        </n-form-item>

        <n-form-item label="Status atual">
          <div class="field-stack">
            <n-input :value="currentStatusLabel" disabled />
            <p class="field-help">O status muda pelas ações da agenda.</p>
          </div>
        </n-form-item>
      </div>
    </div>

    <div class="section">
      <h4 class="section-title">Detalhes</h4>
      <div class="grid">
        <n-form-item label="Motivo / Queixa" path="reason" class="full-row">
          <n-input
            v-model:value="model.reason"
            placeholder="Motivo da visita"
          />
        </n-form-item>

        <n-form-item label="Anotações adicionais" path="notes" class="full-row">
          <n-input
            v-model:value="model.notes"
            type="textarea"
            :rows="2"
            placeholder="Opcional. Observações internas."
          />
        </n-form-item>
      </div>
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
  isFitIn?: boolean
  reason?: string
  notes?: string
}

const props = defineProps<{
  value?: AppointmentPayload | null
  loading?: boolean
  allowQuickCreate?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: AppointmentPayload): void
  (e: 'quick-create'): void
}>()

const formRef = ref<FormInst | null>(null)
const message = useMessage()

// Select Options
const clientOptions = ref<{label: string, value: number}[]>([])
const petOptions = ref<{label: string, value: number}[]>([])
const allPets = ref<any[]>([])
const appointmentTypeOptions = ref<Array<{label: string, value: number, durationMinutes?: number | null}>>([])
const statusOptions = ref<{label: string, value: number}[]>([])
const veterinarianOptions = ref<{label: string, value: number}[]>([])
const durationMinutes = ref<number | null>(30)
const startsAtExternalError = ref('')
const durationOptions = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 }
]
const toArray = <T = any>(response: any): T[] => {
  if (Array.isArray(response?.data)) return response.data as T[]
  if (Array.isArray(response?.items)) return response.items as T[]
  if (Array.isArray(response)) return response as T[]
  return []
}

const model = reactive<AppointmentPayload>({
  id: undefined,
  petId: null,
  clientId: null,
  veterinarianId: null,
  appointmentTypeId: null,
  statusId: null,
  startsAt: null,
  endsAt: null,
  isFitIn: false,
  reason: '',
  notes: ''
})

const rules: FormRules = {
  clientId: { type: 'number', required: true, message: 'Selecione o cliente', trigger: ['blur', 'change'] },
  petId: { type: 'number', required: true, message: 'Selecione o pet', trigger: ['blur', 'change'] },
  appointmentTypeId: { type: 'number', required: true, message: 'Selecione o tipo', trigger: ['blur', 'change'] },
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

    const clients = toArray(clientsRes)
    const pets = toArray(petsRes)
    const appointmentTypes = toArray(typesRes)
    const statuses = toArray(statusesRes)
    const users = toArray(usersRes)

    clientOptions.value = clients.map((i: any) => ({ label: i.name, value: Number(i.id) }))
    allPets.value = pets
    appointmentTypeOptions.value = appointmentTypes.map((i: any) => ({
      label: i.name,
      value: Number(i.id),
      durationMinutes: i.defaultDurationMinutes ?? i.durationMinutes ?? null
    }))
    statusOptions.value = statuses.map((i: any) => ({ label: i.name, value: Number(i.id), code: i.code }))
    veterinarianOptions.value = users.map((i: any) => ({ label: i.name, value: Number(i.id) }))

    if (!model.id && !model.statusId) {
      const scheduled = statuses.find((s: any) => s.code === 'SCHEDULED')
      if (scheduled?.id) model.statusId = Number(scheduled.id)
    }

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
      isFitIn: Boolean(val?.isFitIn),
      reason: val?.reason ?? '',
      notes: val?.notes ?? ''
    })
    if (model.startsAt && model.endsAt) {
      const diff = Math.round((model.endsAt - model.startsAt) / 60000)
      durationMinutes.value = diff > 0 ? diff : 30
    } else {
      durationMinutes.value = 30
    }
    updatePetOptions()
  },
  { immediate: true }
)

watch([() => model.startsAt, durationMinutes], ([startsAt, duration]) => {
  if (startsAtExternalError.value) startsAtExternalError.value = ''
  if (!startsAt || !duration) return
  model.endsAt = startsAt + duration * 60 * 1000
})

watch(
  () => model.appointmentTypeId,
  (appointmentTypeId) => {
    if (!appointmentTypeId) return
    const selectedType = appointmentTypeOptions.value.find(
      (option) => Number(option.value) === Number(appointmentTypeId),
    )
    const typeDuration = Number(selectedType?.durationMinutes ?? 0)
    if (typeDuration > 0) {
      durationMinutes.value = typeDuration
    }
  },
)

onMounted(() => {
  loadDependencies()
})

const currentStatusLabel = computed(() => {
  const status = statusOptions.value.find((s: any) => Number(s.value) === Number(model.statusId))
  return status?.label || 'Agendado'
})
const predictedEndAt = computed(() => {
  if (!model.endsAt) return ''
  const d = new Date(model.endsAt)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
})

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    // Format dates before sending
    const payloadToEmit: any = {
      ...model,
      startsAt: model.startsAt ? new Date(model.startsAt).toISOString() : null,
      endsAt: model.endsAt ? new Date(model.endsAt).toISOString() : null,
      isFitIn: Boolean(model.isFitIn),
    }
    emit('submit', payloadToEmit)
  } catch (err) {
    // Validation failed
  }
}

defineExpose({
  submit: handleSubmit,
  setStartsAtConflictError: (msg: string) => {
    startsAtExternalError.value = msg
  },
  clearStartsAtConflictError: () => {
    startsAtExternalError.value = ''
  }
})

</script>

<style scoped>
.grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 8px;
  background: #fff;
}

.section-title {
  margin: 0 0 10px;
  font-size: 14px;
  color: #334155;
}

.inline-action {
  border: 0;
  background: transparent;
  color: #0f766e;
  font-size: 12px;
  padding: 0;
  cursor: pointer;
  white-space: nowrap;
}

.inline-action:hover {
  text-decoration: underline;
}

.full-row {
  grid-column: 1 / -1;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.field-help {
  display: block;
  width: 100%;
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.35;
  white-space: normal;
}

.field-stack {
  width: 100%;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .section {
    padding: 10px;
    margin-top: 8px;
  }

  .field-label-row {
    align-items: flex-start;
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .inline-action {
    margin-left: auto;
    white-space: nowrap;
    font-size: 12px;
  }

  :deep(.n-input),
  :deep(.n-base-selection),
  :deep(.n-date-picker) {
    min-height: 44px;
  }

  .field-help {
    font-size: 11px;
  }
}

</style>
