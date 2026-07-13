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
          <h4 class="section-title">{{ sectionTitle }}</h4>
          <p class="section-copy">{{ sectionCopy }}</p>
        </div>

        <div class="section-grid">
          <n-form-item label="Produto" path="productId" required class="full-row">
            <n-select
              v-model:value="model.productId"
              :options="productOptions"
              placeholder="Selecione o produto"
              filterable
              clearable
            />
          </n-form-item>

          <n-form-item label="Local de estoque" path="stockLocationId" required>
            <n-select
              v-model:value="model.stockLocationId"
              :options="locationOptions"
              placeholder="Selecione o local"
              filterable
              clearable
            />
          </n-form-item>

          <n-form-item v-if="showBatchField" label="Lote" path="stockBatchId" required>
            <n-select
              v-model:value="model.stockBatchId"
              :options="batchOptions"
              placeholder="Selecione o lote"
              filterable
              clearable
            />
          </n-form-item>

          <n-form-item v-if="mode === 'IN'" label="Código do lote" path="lotCode">
            <n-input v-model:value="model.lotCode" placeholder="Ex.: LOTE-2026-001" />
          </n-form-item>

          <n-form-item v-if="mode === 'IN'" label="Validade" path="expirationDate">
            <n-date-picker
              v-model:value="expirationDateValue"
              type="date"
              clearable
              style="width: 100%"
            />
          </n-form-item>

          <n-form-item v-if="mode !== 'ADJUST'" label="Quantidade" path="quantity" required>
            <n-input-number
              v-model:value="model.quantity"
              :min="0.001"
              :step="0.001"
              :precision="3"
              placeholder="0,000"
              style="width: 100%"
            />
          </n-form-item>

          <n-form-item v-else label="Saldo contado" path="countedStock" required>
            <n-input-number
              v-model:value="model.countedStock"
              :min="0"
              :step="0.001"
              :precision="3"
              placeholder="0,000"
              style="width: 100%"
            />
          </n-form-item>

          <n-form-item v-if="mode === 'IN'" label="Custo unitário" path="unitCost">
            <n-input-number
              v-model:value="model.unitCost"
              :min="0"
              :step="0.01"
              :precision="2"
              placeholder="0,00"
              style="width: 100%"
            />
          </n-form-item>

          <n-form-item v-if="mode !== 'IN'" label="Motivo" path="reason" required>
            <n-select
              v-model:value="model.reason"
              :options="reasonOptions"
              placeholder="Selecione o motivo"
              clearable
              :tag="mode === 'ADJUST'"
            />
          </n-form-item>

          <n-form-item label="Data e hora" path="occurredAt" required>
            <n-date-picker
              v-model:value="occurredAtValue"
              type="datetime"
              clearable
              style="width: 100%"
            />
          </n-form-item>

          <n-form-item label="Observação" path="notes" class="full-row">
            <n-input
              v-model:value="model.notes"
              type="textarea"
              :rows="3"
              placeholder="Detalhes adicionais da movimentação"
            />
          </n-form-item>
        </div>
      </section>

      <section v-if="stockSnapshot" class="snapshot-section">
        <div class="snapshot-grid">
          <div class="snapshot-card">
            <span class="snapshot-label">Saldo atual</span>
            <strong class="snapshot-value">{{ formatQuantity(stockSnapshot.currentStock) }}</strong>
          </div>
          <div class="snapshot-card">
            <span class="snapshot-label">Estoque mínimo</span>
            <strong class="snapshot-value">{{ formatQuantity(stockSnapshot.minimumStock) }}</strong>
          </div>
          <div class="snapshot-card">
            <span class="snapshot-label">Status</span>
            <strong class="snapshot-value">{{ stockStatusLabel }}</strong>
          </div>
          <div v-if="tracksExpiration" class="snapshot-card">
            <span class="snapshot-label">Próxima validade</span>
            <strong class="snapshot-value">{{ stockSnapshot?.nextExpirationDate ? formatDate(stockSnapshot.nextExpirationDate) : '—' }}</strong>
          </div>
        </div>
      </section>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'

type FormMode = 'IN' | 'OUT' | 'ADJUST'

interface ProductOptionResponse {
  data: Array<{ id: number; name: string; trackStock: boolean; isService: boolean }>
}

interface LocationOptionResponse {
  data?: Array<{ id: number; name: string; isDefault: boolean }>
}

interface ReasonOption {
  label: string
  value: string
}

interface StockSnapshot {
  currentStock: number
  minimumStock: number
  tracksExpiration?: boolean
  nextExpirationDate?: string | null
  nextLotCode?: string | null
}

const props = defineProps<{
  mode: FormMode
  loading?: boolean
  preset?: {
    productId?: number | null
    stockLocationId?: number | null
  } | null
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Record<string, any>): void
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const productOptions = ref<{ label: string; value: number }[]>([])
const locationOptions = ref<{ label: string; value: number }[]>([])
const batchOptions = ref<{ label: string; value: number }[]>([])
const reasonOptions = ref<ReasonOption[]>([
  { label: 'Uso em atendimento', value: 'Uso em atendimento' },
  { label: 'Perda', value: 'Perda' },
  { label: 'Vencimento', value: 'Vencimento' },
  { label: 'Ajuste negativo', value: 'Ajuste negativo' },
  { label: 'Outro', value: 'Outro' }
])
const stockSnapshot = ref<StockSnapshot | null>(null)
const loadingSnapshot = ref(false)

const model = reactive({
  productId: null as number | null,
  stockLocationId: null as number | null,
  quantity: 1,
  countedStock: 0,
  unitCost: null as number | null,
  stockBatchId: null as number | null,
  lotCode: '',
  expirationDate: '',
  reason: null as string | null,
  notes: '',
  occurredAt: new Date().toISOString()
})

const tracksExpiration = computed(() => Boolean(stockSnapshot.value?.tracksExpiration))
const showBatchField = computed(() => tracksExpiration.value && props.mode !== 'IN')

const sectionTitle = computed(() => {
  if (props.mode === 'IN') return 'Entrada de estoque'
  if (props.mode === 'OUT') return 'Saída manual'
  return 'Ajuste de saldo'
})

const sectionCopy = computed(() => {
  if (props.mode === 'IN') return 'Registre a entrada informando produto, local e custo.'
  if (props.mode === 'OUT') return 'Registre uma baixa manual sem permitir saldo negativo.'
  return 'Informe o saldo contado e o sistema gerará a diferença automaticamente.'
})

const rules: FormRules = {
  productId: {
    required: true,
    validator: (_rule, value) => value ? true : new Error('Selecione o produto'),
    trigger: ['change', 'blur']
  },
  stockLocationId: {
    required: true,
    validator: (_rule, value) => value ? true : new Error('Selecione o local'),
    trigger: ['change', 'blur']
  },
  stockBatchId: {
    validator: () => {
      if (!showBatchField.value) return true
      return Number(model.stockBatchId || 0) > 0 || new Error('Selecione o lote')
    },
    trigger: ['change', 'blur']
  },
  lotCode: {
    validator: () => {
      if (props.mode !== 'IN') return true
      const hasAny = String(model.lotCode || '').trim().length > 0 || String(model.expirationDate || '').trim().length > 0
      if (!hasAny) return true
      return String(model.lotCode || '').trim().length > 0 || new Error('Informe o código do lote')
    },
    trigger: ['change', 'blur']
  },
  expirationDate: {
    validator: () => {
      if (props.mode !== 'IN') return true
      const hasAny = String(model.lotCode || '').trim().length > 0 || String(model.expirationDate || '').trim().length > 0
      if (!hasAny) return true
      return String(model.expirationDate || '').trim().length > 0 || new Error('Informe a validade')
    },
    trigger: ['change', 'blur']
  },
  quantity: {
    validator: () => {
      if (props.mode === 'ADJUST') return true
      return Number(model.quantity || 0) > 0 || new Error('Informe uma quantidade maior que zero')
    },
    trigger: ['change', 'blur']
  },
  countedStock: {
    validator: () => {
      if (props.mode !== 'ADJUST') return true
      return Number(model.countedStock ?? -1) >= 0 || new Error('Saldo contado deve ser maior ou igual a zero')
    },
    trigger: ['change', 'blur']
  },
  reason: {
    validator: () => {
      if (props.mode === 'IN') return true
      return String(model.reason || '').trim().length > 0 || new Error('Motivo é obrigatório')
    },
    trigger: ['change', 'blur']
  }
}

const occurredAtValue = computed({
  get: () => {
    const date = model.occurredAt ? new Date(model.occurredAt) : null
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : null
  },
  set: (value) => {
    if (!value) {
      model.occurredAt = new Date().toISOString()
      return
    }
    model.occurredAt = new Date(value).toISOString()
  }
})

const expirationDateValue = computed({
  get: () => {
    const date = model.expirationDate ? new Date(model.expirationDate) : null
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : null
  },
  set: (value) => {
    if (!value) {
      model.expirationDate = ''
      return
    }
    model.expirationDate = new Date(value).toISOString().slice(0, 10)
  }
})

const stockStatusLabel = computed(() => {
  if (!stockSnapshot.value) return '—'
  if (stockSnapshot.value.currentStock <= 0) return 'Zerado'
  if (stockSnapshot.value.currentStock <= stockSnapshot.value.minimumStock) return 'Baixo'
  return 'Normal'
})

watch(
  () => props.preset,
  (preset) => {
    model.productId = preset?.productId ?? null
    model.stockLocationId = preset?.stockLocationId ?? null
  },
  { immediate: true }
)

watch(
  () => props.mode,
  (mode) => {
    model.quantity = 1
    model.countedStock = 0
    model.unitCost = null
    model.stockBatchId = null
    model.lotCode = ''
    model.expirationDate = ''
    model.reason = mode === 'ADJUST' ? 'Ajuste negativo' : null
    model.notes = ''
    model.occurredAt = new Date().toISOString()
  },
  { immediate: true }
)

watch(
  () => [model.productId, model.stockLocationId],
  async ([productId, stockLocationId]) => {
    if (!productId || !stockLocationId) {
      stockSnapshot.value = null
      return
    }

    loadingSnapshot.value = true
    const api = useApi()
    try {
      const response = await api<any>('/api/v1/stock-movements/current-stock', {
        query: {
          productId,
          stockLocationId
        }
      })

      stockSnapshot.value = {
        currentStock: Number(response.currentStock || 0),
        minimumStock: Number(response.minimumStock || 0),
        tracksExpiration: Boolean(response.tracksExpiration),
        nextExpirationDate: response.nextExpirationDate || null,
        nextLotCode: response.nextLotCode || null
      }

      if (props.mode === 'ADJUST') {
        model.countedStock = Number(response.currentStock || 0)
      }

      if (response.tracksExpiration) {
        await fetchBatches(productId, stockLocationId)
      } else {
        batchOptions.value = []
        model.stockBatchId = null
      }
    } catch (error: any) {
      stockSnapshot.value = null
      batchOptions.value = []
      message.error(error?.data?.message || 'Erro ao consultar saldo atual.')
    } finally {
      loadingSnapshot.value = false
    }
  },
  { immediate: true }
)

const fetchBatches = async (productId: number, stockLocationId: number) => {
  const api = useApi()
  try {
    const response = await api<any[]>('/api/v1/stock-movements/batches', {
      query: {
        productId,
        stockLocationId
      }
    })

    batchOptions.value = (response || []).map((item: any) => ({
      label: `${item.lotCode} · validade ${formatDate(item.expirationDate)} · saldo ${formatQuantity(item.remainingQuantity)}`,
      value: Number(item.id)
    }))

    if (batchOptions.value.length === 1 && !model.stockBatchId && props.mode !== 'IN') {
      model.stockBatchId = Number(batchOptions.value[0].value)
    }
  } catch (error: any) {
    batchOptions.value = []
    message.error(error?.data?.message || 'Erro ao carregar lotes.')
  }
}

const fetchProducts = async () => {
  const api = useApi()
  try {
    const response = await api<ProductOptionResponse>('/api/v1/products', {
      query: {
        page: 1,
        limit: 200,
        isService: false,
        isActive: true,
        sortBy: 'name',
        sortDirection: 'asc'
      }
    })

    productOptions.value = response.data
      .filter((item) => item.trackStock && !item.isService)
      .map((item) => ({
        label: item.name,
        value: item.id
      }))
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar produtos.')
  }
}

const fetchLocations = async () => {
  const api = useApi()
  try {
    const response = await api<LocationOptionResponse | Array<{ id: number; name: string; isDefault: boolean }>>('/api/v1/stock-locations', {
      query: {
        activeOnly: true
      }
    })

    const data = Array.isArray(response) ? response : (response.data || [])
    locationOptions.value = data.map((item) => ({
      label: item.isDefault ? `${item.name} • padrão` : item.name,
      value: item.id
    }))
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar locais de estoque.')
  }
}

const handleSubmit = async () => {
  await formRef.value?.validate()

  emit('submit', {
    productId: model.productId,
    stockLocationId: model.stockLocationId,
    quantity: props.mode === 'ADJUST' ? undefined : Number(model.quantity),
    countedStock: props.mode === 'ADJUST' ? Number(model.countedStock) : undefined,
    unitCost: props.mode === 'IN' ? (model.unitCost != null ? Number(model.unitCost) : null) : undefined,
    reason: props.mode === 'IN' ? null : String(model.reason || '').trim(),
    stockBatchId: showBatchField.value ? model.stockBatchId : null,
    lotCode: props.mode === 'IN' ? (String(model.lotCode || '').trim() || null) : null,
    expirationDate: props.mode === 'IN' ? (model.expirationDate || null) : null,
    notes: model.notes?.trim() || null,
    occurredAt: model.occurredAt
  })
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

const formatQuantity = (value?: number | null) =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  })

fetchProducts()
fetchLocations()

defineExpose({ submit: handleSubmit })
</script>

<style scoped>
.sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section,
.snapshot-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  color: #334155;
  font-weight: 700;
}

.section-copy {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.section-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.full-row {
  grid-column: 1 / -1;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.snapshot-card {
  border-radius: 12px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.snapshot-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  line-height: 1.4;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.snapshot-value {
  font-size: 18px;
  line-height: 1.1;
  font-weight: 700;
  color: #111827;
}

@media (max-width: 768px) {
  .form-section,
  .snapshot-section {
    padding: 10px;
  }

  .section-grid,
  .snapshot-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .section-head {
    margin-bottom: 6px;
  }

  .section-title {
    font-size: 15px;
  }
}
</style>
