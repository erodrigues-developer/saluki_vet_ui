<template>
  <n-form
    :model="model"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
      <template #header>
        Receita do paciente
      </template>
      <strong>{{ petLabel }}</strong>
      <span v-if="consultationLabel"> • {{ consultationLabel }}</span>
    </n-alert>

    <n-form-item label="Conteúdo da prescrição">
      <n-input
        v-model:value="model.content"
        type="textarea"
        :rows="8"
        placeholder="Ex: Dipirona 1 gota/kg VO a cada 8h por 5 dias..."
      />
    </n-form-item>

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

    <div class="actions">
      <n-button tertiary @click="$emit('cancel')" :disabled="loading">Cancelar</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        Emitir Prescrição
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  loading?: boolean
  petId: number | null
  consultationId?: number | null
  petLabel: string
  consultationLabel?: string
}>()

const emit = defineEmits<{
  (e: 'submit', payload: any): void
  (e: 'cancel'): void
}>()

const message = useMessage()

const model = reactive({
  content: '',
  prescribedAt: Date.now(),
  expirationDate: null as number | null,
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
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
