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
      <n-form-item label="Ativo" path="isActive" class="full-row">
        <n-switch v-model:value="model.isActive" />
      </n-form-item>

      <n-form-item label="Nome do Procedimento" path="name" required class="full-row">
        <n-input v-model:value="model.name" placeholder="Ex: Consulta Especialista, Castração..." />
      </n-form-item>

      <n-form-item label="Descrição" path="description" class="full-row">
        <n-input
          v-model:value="model.description"
          type="textarea"
          :rows="3"
          placeholder="Opcional."
        />
      </n-form-item>

      <n-form-item label="Preço Padrão (R$)" path="defaultPrice">
        <n-input-number
          v-model:value="model.defaultPrice"
          :min="0"
          :step="10"
          :precision="2"
          placeholder="Ex: 150.00"
          style="width: 100%"
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
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

export interface Procedure {
  id?: number
  name: string
  description?: string | null
  defaultPrice: number | null
  isActive: boolean
}

const props = defineProps<{
  value?: Procedure | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Procedure): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInst | null>(null)
const model = reactive<Procedure>({
  id: undefined,
  name: '',
  description: '',
  defaultPrice: null,
  isActive: true
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      description: val?.description ?? '',
      defaultPrice: val?.defaultPrice !== undefined && val?.defaultPrice !== null ? Number(val.defaultPrice) : null,
      isActive: val?.isActive ?? true
    })
  },
  { immediate: true }
)

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar procedimento'))

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    emit('submit', { ...model })
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
