<template>
  <n-form ref="formRef" :model="model" :rules="rules" label-placement="top" :show-require-mark="false" :disabled="loading">
    <div class="form-stack">
      <n-card size="small" :bordered="false" class="form-card">
        <template #header>Informações do procedimento</template>
        <div class="grid">
          <n-form-item label="Ativo" path="isActive" class="full-row">
            <n-switch v-model:value="model.isActive" />
          </n-form-item>

          <n-form-item label="Nome" path="name" required class="full-row">
            <n-input v-model:value="model.name" placeholder="Ex: Consulta especialista, Castração..." />
          </n-form-item>

          <n-form-item label="Descrição" path="description" class="full-row">
            <n-input v-model:value="model.description" type="textarea" :rows="3" placeholder="Opcional" />
          </n-form-item>
        </div>
      </n-card>

      <n-card size="small" :bordered="false" class="form-card">
        <template #header>Valores</template>
        <div class="grid">
          <n-form-item label="Preço padrão" path="defaultPrice" required>
            <n-input-number v-model:value="model.defaultPrice" :min="0" :step="1" :precision="2" placeholder="0,00" style="width: 100%" />
          </n-form-item>

          <n-form-item label="Comissão %" path="commissionPercent">
            <n-input-number v-model:value="model.commissionPercent" :min="0" :max="100" :step="1" :precision="2" placeholder="0,00" style="width: 100%" />
          </n-form-item>

          <n-form-item label="Produto consumido no estoque" path="consumedProductId">
            <n-select v-model:value="model.consumedProductId" :options="productOptions" placeholder="Opcional" clearable filterable />
          </n-form-item>

          <n-form-item label="Qtd. consumida" path="consumptionQuantity">
            <n-input-number v-model:value="model.consumptionQuantity" :min="0" :precision="3" :disabled="!model.consumedProductId" style="width: 100%" />
          </n-form-item>
        </div>
      </n-card>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'

export interface Procedure {
  id?: number
  name: string
  description?: string | null
  defaultPrice: number | null
  commissionPercent: number | null
  consumedProductId?: number | null
  consumptionQuantity?: number | null
  isActive: boolean
  updatedAt?: string
}

const props = defineProps<{ value?: Procedure | null; loading?: boolean }>()
const emit = defineEmits<{ (e: 'submit', payload: Procedure): void }>()

const formRef = ref<FormInst | null>(null)
const message = useMessage()
const productOptions = ref<{ label: string, value: number }[]>([])

const model = reactive<Procedure>({
  id: undefined,
  name: '',
  description: '',
  defaultPrice: null,
  commissionPercent: 0,
  consumedProductId: null,
  consumptionQuantity: null,
  isActive: true
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  defaultPrice: [
    { type: 'number', required: true, message: 'Preço padrão é obrigatório', trigger: ['blur', 'change'] },
    { validator: (_rule, value) => Number(value ?? 0) >= 0, message: 'Preço padrão deve ser maior ou igual a zero', trigger: ['blur', 'change'] }
  ],
  commissionPercent: {
    validator: (_rule, value) => {
      if (value === null || value === undefined) return true
      return Number(value) >= 0 && Number(value) <= 100
    },
    message: 'Comissão deve estar entre 0% e 100%',
    trigger: ['blur', 'change']
  }
}

watch(() => props.value, (val) => {
  Object.assign(model, {
    id: val?.id,
    name: val?.name ?? '',
    description: val?.description ?? '',
    defaultPrice: val?.defaultPrice !== undefined && val?.defaultPrice !== null ? Number(val.defaultPrice) : null,
    commissionPercent: val?.commissionPercent !== undefined && val?.commissionPercent !== null ? Number(val.commissionPercent) : 0,
    consumedProductId: val?.consumedProductId ? Number(val.consumedProductId) : null,
    consumptionQuantity: val?.consumptionQuantity !== undefined && val?.consumptionQuantity !== null ? Number(val.consumptionQuantity) : null,
    isActive: val?.isActive ?? true
  })
}, { immediate: true })

const loadProducts = async () => {
  try {
    const api = useApi()
    const res = await api<any>('/api/v1/products?limit=500&isService=false&isActive=true')
    productOptions.value = (res.data || [])
      .filter((product: any) => product.trackStock)
      .map((product: any) => ({
        label: product.sku ? `${product.name} (${product.sku})` : product.name,
        value: Number(product.id)
      }))
  } catch {
    message.error('Erro ao carregar produtos de estoque')
  }
}

onMounted(() => { loadProducts() })

const submit = async () => {
  await formRef.value?.validate()
  const payload = { ...model }
  if (!payload.consumedProductId) payload.consumptionQuantity = null
  emit('submit', payload)
}

defineExpose({ submit })
</script>

<style scoped>
.form-stack { display: flex; flex-direction: column; gap: 12px; }
.form-card { border: 1px solid #e5e7eb; border-radius: 12px; }
.grid { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
.full-row { grid-column: 1 / -1; }

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
