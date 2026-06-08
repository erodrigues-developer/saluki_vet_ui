<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <div class="sections">
      <section class="form-section">
        <div class="section-head">
          <h4 class="section-title">Identificação</h4>
          <div class="active-wrap">
            <span class="active-label">Ativo</span>
            <n-switch v-model:value="model.isActive" />
          </div>
        </div>
        <div class="section-grid">
          <n-form-item label="Nome *" path="name" required>
            <n-input v-model:value="model.name" placeholder="Ex.: Canil P2" />
          </n-form-item>
          <n-form-item label="Descrição" path="description" class="full-row">
            <n-input
              v-model:value="model.description"
              type="textarea"
              :rows="3"
              placeholder="Detalhes operacionais do box, porte, espécie ou observações de uso"
            />
          </n-form-item>
        </div>
      </section>

      <section v-if="value?.id" class="form-section">
        <div class="section-head">
          <h4 class="section-title">Controle do cadastro</h4>
        </div>
        <div class="section-grid">
          <n-form-item label="Criado em">
            <n-input :value="formatDate(value?.createdAt)" readonly />
          </n-form-item>
          <n-form-item label="Atualizado em">
            <n-input :value="formatDate(value?.updatedAt)" readonly />
          </n-form-item>
        </div>
      </section>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface BoxEntity {
  id?: number
  name: string
  description?: string | null
  isActive: boolean
  occupancyStatus?: 'AVAILABLE' | 'OCCUPIED'
  currentInpatient?: {
    id: number
    pet?: {
      id: number
      name: string
    }
  } | null
  createdAt?: string
  updatedAt?: string
}

const props = defineProps<{
  value?: BoxEntity | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: BoxEntity): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<BoxEntity>({
  id: undefined,
  name: '',
  description: '',
  isActive: true,
})

const rules: FormRules = {
  name: {
    required: true,
    message: 'Nome é obrigatório',
    trigger: 'blur',
  },
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      description: val?.description ?? '',
      isActive: val?.isActive ?? true,
    })
  },
  { immediate: true },
)

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', {
    ...model,
    name: model.name.trim(),
    description: (model.description || '').trim() || null,
  })
}

defineExpose({ submit: handleSubmit })

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}
</script>

<style scoped>
.sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 700;
  color: #334155;
}

.active-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  margin-top: 1px;
}

.active-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.section-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.full-row {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .form-section {
    padding: 10px;
  }

  .section-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .section-title {
    font-size: 15px;
  }
}
</style>
