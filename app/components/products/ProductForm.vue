<template>
  <n-form ref="formRef" :model="model" :rules="rules" label-placement="top" :show-require-mark="false" :disabled="loading">
    <div class="sections">
      <section class="form-section">
        <div class="section-head">
          <h4 class="section-title">Informações do item</h4>
          <div class="active-wrap">
            <span class="active-label">Ativo</span>
            <n-switch v-model:value="model.isActive" />
          </div>
        </div>
        <div class="section-grid">

          <n-form-item label="Tipo" path="isService" required>
            <n-radio-group v-model:value="model.isService" name="isServiceGroup">
              <n-radio-button :value="false">Produto</n-radio-button>
              <n-radio-button :value="true">Serviço</n-radio-button>
            </n-radio-group>
          </n-form-item>

          <n-form-item label="Nome" path="name" required class="full-row">
            <n-input v-model:value="model.name" placeholder="Ex: Vacina V10, Consulta veterinária..." />
          </n-form-item>

          <n-form-item v-if="!model.isService" label="SKU" path="sku">
            <n-input v-model:value="model.sku" placeholder="Opcional" />
          </n-form-item>

          <n-form-item label="Categoria" path="productCategoryId">
            <n-select v-model:value="model.productCategoryId" :options="categoryOptions" placeholder="Selecione" clearable />
          </n-form-item>

          <n-form-item v-if="model.isService" label="Duração (minutos)" path="durationMinutes" required>
            <n-input-number v-model:value="model.durationMinutes" :min="1" :step="5" :precision="0" placeholder="Ex: 45" style="width: 100%" />
          </n-form-item>

          <n-form-item label="Descrição" path="notes" class="full-row">
            <n-input v-model:value="model.notes" type="textarea" :rows="2" placeholder="Descrição curta do item" />
          </n-form-item>
        </div>
      </section>

      <section class="form-section">
        <div class="section-head">
          <h4 class="section-title">Preço</h4>
        </div>
        <div class="section-grid">
          <n-form-item label="Preço de venda (R$)" path="salePrice" required>
            <n-input-number v-model:value="model.salePrice" :min="0" :step="1" :precision="2" placeholder="0,00" style="width: 100%" />
          </n-form-item>

          <n-form-item label="Custo (R$)" path="costPrice">
            <n-input-number v-model:value="model.costPrice" :min="0" :step="1" :precision="2" placeholder="0,00" style="width: 100%" />
          </n-form-item>

          <n-form-item label="Margem" class="full-row">
            <n-input :value="marginLabel" disabled />
          </n-form-item>
        </div>
      </section>

      <section class="form-section">
        <div class="section-head">
          <h4 class="section-title">Estoque</h4>
        </div>
        <template v-if="!model.isService">
          <div class="section-grid">
            <n-form-item label="Controlar estoque" path="trackStock">
              <n-switch v-model:value="model.trackStock" />
            </n-form-item>

            <n-form-item label="É vacina?" path="isVaccine">
              <n-switch v-model:value="model.isVaccine" />
            </n-form-item>

            <template v-if="model.trackStock">
              <n-form-item label="Estoque atual" path="currentStock" required>
                <n-input-number v-model:value="model.currentStock" :min="0" :step="1" :precision="0" placeholder="0" style="width: 100%" />
              </n-form-item>

              <n-form-item label="Estoque mínimo" path="minimumStock">
                <n-input-number v-model:value="model.minimumStock" :min="0" :step="1" :precision="0" placeholder="0" style="width: 100%" />
              </n-form-item>

              <n-form-item label="Unidade" path="unit" required>
                <n-input v-model:value="model.unit" placeholder="Ex: un, ml, kg" />
              </n-form-item>

              <n-form-item label="Fornecedor" path="supplierName">
                <n-input v-model:value="model.supplierName" placeholder="Opcional" />
              </n-form-item>
            </template>
          </div>
        </template>
        <p v-else class="service-stock-note">Serviços não possuem controle de estoque.</p>
      </section>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'

export interface Product {
  id?: number
  name: string
  productCategoryId?: number | null
  sku?: string | null
  isService: boolean
  durationMinutes?: number | null
  unit?: string | null
  salePrice: number
  costPrice?: number | null
  trackStock: boolean
  isVaccine: boolean
  notes?: string | null
  isActive: boolean
  currentStock?: number | null
  minimumStock?: number | null
  supplierName?: string | null
  productCategory?: any
  updatedAt?: string
}

const props = defineProps<{
  value?: Product | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Product): void
}>()

const formRef = ref<FormInst | null>(null)
const message = useMessage()
const categoryOptions = ref<{label: string, value: number}[]>([])

const model = reactive<Product>({
  id: undefined,
  name: '',
  productCategoryId: null,
  sku: '',
  isService: false,
  durationMinutes: null,
  unit: 'un',
  salePrice: 0,
  costPrice: null,
  trackStock: true,
  isVaccine: false,
  notes: '',
  isActive: true,
  currentStock: 0,
  minimumStock: 0,
  supplierName: ''
})

const rules: FormRules = {
  name: {
    required: true,
    message: 'Nome é obrigatório',
    trigger: 'blur'
  },
  isService: {
    type: 'boolean',
    required: true,
    message: 'Tipo é obrigatório',
    trigger: 'change'
  },
  salePrice: [
    {
      type: 'number',
      required: true,
      message: 'Preço de venda é obrigatório',
      trigger: ['blur', 'change']
    },
    {
      validator: (_rule, value) => Number(value ?? 0) >= 0,
      message: 'Preço de venda deve ser maior ou igual a zero',
      trigger: ['blur', 'change']
    }
  ],
  durationMinutes: {
    validator: () => {
      if (!model.isService) return true
      if (model.durationMinutes === null || model.durationMinutes === undefined) {
        return new Error('Duração é obrigatória para serviços')
      }
      const value = Number(model.durationMinutes)
      return (Number.isInteger(value) && value > 0) || new Error('Duração deve ser um número inteiro maior que zero')
    },
    trigger: ['blur', 'change']
  },
  currentStock: {
    validator: () => {
      if (model.isService || !model.trackStock) return true
      if (model.currentStock === null || model.currentStock === undefined) {
        return new Error('Estoque atual é obrigatório quando controlar estoque')
      }
      return Number(model.currentStock) >= 0 || new Error('Estoque não pode ser negativo')
    },
    trigger: ['blur', 'change']
  },
  minimumStock: {
    validator: () => {
      if (model.isService || !model.trackStock) return true
      return Number(model.minimumStock ?? 0) >= 0 || new Error('Estoque mínimo não pode ser negativo')
    },
    trigger: ['blur', 'change']
  },
  unit: {
    validator: () => {
      if (model.isService || !model.trackStock) return true
      return String(model.unit || '').trim().length > 0 || new Error('Unidade é obrigatória quando controlar estoque')
    },
    trigger: ['blur', 'change']
  }
}

const marginLabel = computed(() => {
  const sale = Number(model.salePrice || 0)
  const cost = Number(model.costPrice || 0)
  if (sale <= 0 || cost <= 0 || cost > sale) return '—'
  const margin = ((sale - cost) / sale) * 100
  return `${margin.toFixed(2)}%`
})

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      productCategoryId: val?.productCategoryId ? Number(val.productCategoryId) : null,
      sku: val?.sku ?? '',
      isService: val?.isService ?? false,
      durationMinutes: val?.durationMinutes !== undefined && val?.durationMinutes !== null ? Number(val.durationMinutes) : null,
      unit: val?.unit ?? 'un',
      salePrice: val?.salePrice !== undefined && val?.salePrice !== null ? Number(val.salePrice) : 0,
      costPrice: val?.costPrice !== undefined && val?.costPrice !== null ? Number(val.costPrice) : null,
      trackStock: val?.trackStock ?? true,
      isVaccine: val?.isVaccine ?? false,
      notes: val?.notes ?? '',
      isActive: val?.isActive ?? true,
      currentStock: val?.currentStock !== undefined && val?.currentStock !== null ? Number(val.currentStock) : 0,
      minimumStock: val?.minimumStock !== undefined && val?.minimumStock !== null ? Number(val.minimumStock) : 0,
      supplierName: val?.supplierName ?? ''
    })
  },
  { immediate: true }
)

watch(
  () => model.isService,
  (isService) => {
    if (isService) {
      model.sku = null
      model.trackStock = false
      model.currentStock = null
      model.minimumStock = null
      model.unit = null
    } else {
      model.durationMinutes = null
      if (!model.unit) {
        model.unit = 'un'
      }
    }
  }
)

const loadCategories = async () => {
  const api = useApi()
  try {
    const res = await api<any>('/api/v1/product-categories?limit=100')
    categoryOptions.value = (res.data || []).map((c: any) => ({
      label: c.name,
      value: Number(c.id)
    }))
  } catch {
    message.error('Erro ao carregar categorias')
  }
}

onMounted(() => {
  loadCategories()
})

const submit = async () => {
  await formRef.value?.validate()

  const payload: Product = {
    ...model,
    sku: model.isService ? null : String(model.sku || '').trim() || null,
    notes: String(model.notes || '').trim() || null,
    supplierName: String(model.supplierName || '').trim() || null,
    durationMinutes: model.isService ? Number(model.durationMinutes ?? 0) : null,
    unit: model.isService || !model.trackStock ? null : String(model.unit || '').trim() || 'un',
    currentStock: model.isService || !model.trackStock ? null : Number(model.currentStock ?? 0),
    minimumStock: model.isService || !model.trackStock ? null : Number(model.minimumStock ?? 0)
  }

  emit('submit', payload)
}

defineExpose({ submit })
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
  grid-template-columns: 1fr 1fr;
}

.full-row {
  grid-column: 1 / -1;
}

.service-stock-note {
  margin: 2px 0 0;
  font-size: 13px;
  color: #64748b;
}

@media (max-width: 768px) {
  .form-section {
    padding: 10px;
  }

  .section-title {
    font-size: 15px;
  }

  .section-grid {
    grid-template-columns: 1fr;
  }
}
</style>
