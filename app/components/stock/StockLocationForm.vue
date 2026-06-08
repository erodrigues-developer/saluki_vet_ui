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
          <n-form-item label="Nome" path="name" required class="full-row">
            <n-input v-model:value="model.name" placeholder="Ex.: Estoque Principal" />
          </n-form-item>

          <n-form-item label="Local padrão" path="isDefault" class="full-row">
            <div class="toggle-card">
              <div>
                <p class="toggle-title">Usar como local padrão de venda</p>
                <p class="toggle-copy">Vendas e baixas automáticas usarão este local.</p>
              </div>
              <n-switch v-model:value="model.isDefault" :disabled="!model.isActive" />
            </div>
          </n-form-item>
        </div>
      </section>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface StockLocation {
  id?: number
  name: string
  isDefault: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const props = defineProps<{
  value?: StockLocation | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: StockLocation): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<StockLocation>({
  id: undefined,
  name: '',
  isDefault: false,
  isActive: true
})

const rules: FormRules = {
  name: {
    required: true,
    message: 'Nome é obrigatório',
    trigger: 'blur'
  }
}

watch(
  () => props.value,
  (value) => {
    model.id = value?.id
    model.name = value?.name || ''
    model.isDefault = Boolean(value?.isDefault)
    model.isActive = value?.isActive !== false
  },
  { immediate: true }
)

watch(
  () => model.isActive,
  (isActive) => {
    if (!isActive) {
      model.isDefault = false
    }
  }
)

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', {
    id: model.id,
    name: model.name.trim(),
    isDefault: Boolean(model.isDefault),
    isActive: Boolean(model.isActive)
  })
}

defineExpose({ submit: handleSubmit })
</script>

<style scoped>
.sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 18px;
  background: #fff;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.3;
  color: #0f172a;
  font-weight: 700;
}

.active-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.active-label {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.full-row {
  grid-column: 1 / -1;
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
}

.toggle-title {
  margin: 0 0 4px;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 700;
  color: #0f172a;
}

.toggle-copy {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #64748b;
}

@media (max-width: 768px) {
  .form-section {
    padding: 14px;
    border-radius: 16px;
  }

  .section-head {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 14px;
  }

  .section-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .toggle-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
