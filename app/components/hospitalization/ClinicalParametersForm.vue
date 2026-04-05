<template>
  <n-form
    ref="formRef"
    :model="model"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <div class="grid">
      <n-form-item label="Horário da aferição">
        <n-date-picker
          v-model:value="model.measuredAt"
          type="datetime"
          format="dd/MM/yyyy HH:mm"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="Temperatura (°C)">
        <n-input-number v-model:value="model.temperatureC" :precision="1" style="width: 100%" />
      </n-form-item>

      <n-form-item label="FC (bpm)">
        <n-input-number v-model:value="model.heartRateBpm" :precision="0" style="width: 100%" />
      </n-form-item>

      <n-form-item label="FR (mpm)">
        <n-input-number v-model:value="model.respiratoryRateMpm" :precision="0" style="width: 100%" />
      </n-form-item>

      <n-form-item label="PA">
        <n-input v-model:value="model.bloodPressure" placeholder="Ex: 120/80" />
      </n-form-item>

      <n-form-item label="Peso (kg)">
        <n-input-number v-model:value="model.weightKg" :precision="2" style="width: 100%" />
      </n-form-item>

      <n-form-item label="Observações" class="full-row">
        <n-input
          v-model:value="model.notes"
          type="textarea"
          :rows="3"
          placeholder="Ex: aceitou alimentação pastosa, sem vômito."
        />
      </n-form-item>
    </div>

    <div class="actions">
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        Registrar Aferição
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInst } from 'naive-ui'
import { useMessage } from 'naive-ui'

const emit = defineEmits<{
  (e: 'submit', payload: any): void
}>()

defineProps<{
  loading?: boolean
}>()

const formRef = ref<FormInst | null>(null)
const message = useMessage()

const model = reactive({
  measuredAt: Date.now(),
  temperatureC: null as number | null,
  heartRateBpm: null as number | null,
  respiratoryRateMpm: null as number | null,
  bloodPressure: '',
  weightKg: null as number | null,
  notes: '',
})

const handleSubmit = async () => {
  const hasAnyValue = [
    model.temperatureC,
    model.heartRateBpm,
    model.respiratoryRateMpm,
    model.bloodPressure,
    model.weightKg,
    model.notes,
  ].some((value) => value !== null && value !== undefined && value !== '')

  if (!hasAnyValue) {
    message.warning('Informe ao menos um parâmetro clínico.')
    return
  }

  await formRef.value?.restoreValidation?.()

  emit('submit', {
    measuredAt: new Date(model.measuredAt).toISOString(),
    temperatureC: model.temperatureC ?? undefined,
    heartRateBpm: model.heartRateBpm ?? undefined,
    respiratoryRateMpm: model.respiratoryRateMpm ?? undefined,
    bloodPressure: model.bloodPressure || undefined,
    weightKg: model.weightKg ?? undefined,
    notes: model.notes || undefined,
  })

  model.measuredAt = Date.now()
  model.temperatureC = null
  model.heartRateBpm = null
  model.respiratoryRateMpm = null
  model.bloodPressure = ''
  model.weightKg = null
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
  margin-top: 4px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
