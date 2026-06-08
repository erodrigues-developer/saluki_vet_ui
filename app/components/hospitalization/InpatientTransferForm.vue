<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
    class="transfer-form"
  >
    <section class="form-section">
      <div class="section-head">
        <h3>Leito de destino</h3>
        <p>Selecione um box vazio para concluir a movimentação do paciente.</p>
      </div>

      <div class="stack">
        <div class="transfer-context">
          <span class="context-label">Box atual</span>
          <strong>{{ currentBoxLabel || 'Não informado' }}</strong>
        </div>

        <n-form-item label="Box/Leito" path="boxId" required>
          <n-select
            v-model:value="model.boxId"
            :options="boxOptions"
            placeholder="Selecione um leito vazio"
            filterable
          />
        </n-form-item>
      </div>
    </section>

    <section class="form-section">
      <div class="section-head">
        <h3>Motivo da transferência</h3>
        <p>Explique por que o paciente precisa ser movido para outro leito.</p>
      </div>

      <n-form-item label="Motivo da transferência" path="reason">
        <n-input
          v-model:value="model.reason"
          type="textarea"
          :rows="4"
          placeholder="Ex.: necessidade de isolamento, box com monitorização, mudança operacional..."
        />
      </n-form-item>
    </section>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

type OptionItem = {
  label: string
  value: number
}

export interface InpatientTransferPayload {
  boxId: number | null
  reason: string
}

const props = defineProps<{
  loading?: boolean
  boxOptions: OptionItem[]
  currentBoxLabel?: string
  initialValue?: Partial<InpatientTransferPayload> | null
}>()

const emit = defineEmits<{
  (e: 'submit', payload: InpatientTransferPayload): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<InpatientTransferPayload>({
  boxId: null,
  reason: '',
})

const rules: FormRules = {
  boxId: { type: 'number', required: true, message: 'Selecione o box de destino', trigger: 'change' },
  reason: {
    required: true,
    trigger: ['input', 'blur'],
    validator: (_rule, value?: string) =>
      String(value || '').trim() ? true : new Error('Informe o motivo da transferência'),
  },
}

watch(
  () => props.initialValue,
  (value) => {
    Object.assign(model, {
      boxId: value?.boxId ?? null,
      reason: value?.reason ?? '',
    })
  },
  { immediate: true },
)

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    emit('submit', {
      boxId: model.boxId,
      reason: String(model.reason || '').trim(),
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
.transfer-form {
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
  color: #64748b;
  font-size: 13px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.transfer-context {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f8fafc;
}

.context-label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.transfer-context strong {
  font-size: 15px;
  color: #0f172a;
}

@media (max-width: 768px) {
  .form-section {
    padding: 14px;
  }
}
</style>
