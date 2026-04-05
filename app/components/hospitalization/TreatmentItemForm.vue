<template>
  <n-form
    :model="model"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <div class="grid">
      <n-form-item label="Medicamento">
        <n-select
          v-model:value="model.medicamentId"
          :options="productOptions"
          placeholder="Opcional"
          filterable
          clearable
        />
      </n-form-item>

      <n-form-item label="Procedimento">
        <n-select
          v-model:value="model.procedureId"
          :options="procedureOptions"
          placeholder="Opcional"
          filterable
          clearable
        />
      </n-form-item>

      <n-form-item label="Horário previsto">
        <n-date-picker
          v-model:value="model.scheduledAt"
          type="datetime"
          format="dd/MM/yyyy HH:mm"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="Dose / orientação" class="full-row">
        <n-input
          v-model:value="model.dose"
          placeholder="Ex: 1 comprimido VO, 2 ml IV, curativo simples..."
        />
      </n-form-item>

      <n-form-item label="Observações" class="full-row">
        <n-input
          v-model:value="model.notes"
          type="textarea"
          :rows="3"
          placeholder="Ex: administrar lentamente, confirmar jejum, uso de colar."
        />
      </n-form-item>
    </div>

    <div class="actions">
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        Adicionar ao Mapa
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useMessage } from 'naive-ui'

type OptionItem = {
  label: string
  value: number
}

const props = defineProps<{
  loading?: boolean
  productOptions: OptionItem[]
  procedureOptions: OptionItem[]
}>()

const emit = defineEmits<{
  (e: 'submit', payload: any): void
}>()

const message = useMessage()

const model = reactive({
  medicamentId: null as number | null,
  procedureId: null as number | null,
  scheduledAt: Date.now() + 60 * 60 * 1000,
  dose: '',
  notes: '',
})

const handleSubmit = () => {
  if (!model.medicamentId && !model.procedureId) {
    message.warning('Selecione ao menos um medicamento ou procedimento.')
    return
  }

  emit('submit', {
    medicamentId: model.medicamentId ?? undefined,
    procedureId: model.procedureId ?? undefined,
    scheduledAt: new Date(model.scheduledAt).toISOString(),
    dose: model.dose || undefined,
    notes: model.notes || undefined,
  })

  model.medicamentId = null
  model.procedureId = null
  model.scheduledAt = Date.now() + 60 * 60 * 1000
  model.dose = ''
  model.notes = ''
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.full-row {
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
