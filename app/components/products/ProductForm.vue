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
      <n-form-item label="Ativo" path="isActive">
        <n-switch v-model:value="model.isActive" />
      </n-form-item>

      <n-form-item label="Tipo" path="isService">
        <n-radio-group v-model:value="model.isService" name="isServiceGroup">
          <n-radio-button :value="false">Produto (Estoque)</n-radio-button>
          <n-radio-button :value="true">Serviço</n-radio-button>
        </n-radio-group>
      </n-form-item>

      <n-form-item label="Nome do Item" path="name" required class="full-row">
        <n-input v-model:value="model.name" placeholder="Ex: Vacina V10, Ração 15kg..." />
      </n-form-item>

      <n-form-item label="Categoria" path="productCategoryId">
        <n-select
          v-model:value="model.productCategoryId"
          :options="categoryOptions"
          placeholder="Selecione"
          clearable
        />
      </n-form-item>

      <n-form-item label="SKU / Código" path="sku">
        <n-input v-model:value="model.sku" placeholder="Opcional" />
      </n-form-item>

      <n-form-item label="Unid. Medida" path="unit">
        <n-input v-model:value="model.unit" placeholder="Ex: un, ml, kg, frasco" />
      </n-form-item>

      <n-form-item label="Preço de Venda (R$)" path="salePrice" required>
        <n-input-number
          v-model:value="model.salePrice"
          :min="0"
          :step="10"
          :precision="2"
          placeholder="0.00"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="Preço de Custo (R$)" path="costPrice">
        <n-input-number
          v-model:value="model.costPrice"
          :min="0"
          :precision="2"
          placeholder="0.00"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="Controlar Estoque" path="trackStock" v-if="!model.isService">
        <n-switch v-model:value="model.trackStock" />
      </n-form-item>

      <n-form-item label="É Vacina?" path="isVaccine">
        <n-switch v-model:value="model.isVaccine" />
      </n-form-item>

      <n-form-item label="Anotações / Instruções" path="notes" class="full-row">
        <n-input
          v-model:value="model.notes"
          type="textarea"
          :rows="2"
          placeholder="Opcional. Conservação, lote p/ default, etc."
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'

export interface Product {
  id?: number
  name: string
  productCategoryId?: number | null
  sku?: string | null
  isService: boolean
  unit?: string | null
  salePrice: number
  costPrice?: number | null
  trackStock: boolean
  isVaccine: boolean
  notes?: string | null
  isActive: boolean
  productCategory?: any
}

const props = defineProps<{
  value?: Product | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: Product): void
  (e: 'cancel'): void
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
  unit: '',
  salePrice: 0,
  costPrice: null,
  trackStock: true,
  isVaccine: false,
  notes: '',
  isActive: true
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  salePrice: { type: 'number', required: true, message: 'Preço de Venda é obrigatório', trigger: ['blur', 'change'] }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      productCategoryId: val?.productCategoryId ? Number(val.productCategoryId) : null,
      sku: val?.sku ?? '',
      isService: val?.isService ?? false,
      unit: val?.unit ?? '',
      salePrice: val?.salePrice !== undefined && val?.salePrice !== null ? Number(val.salePrice) : 0,
      costPrice: val?.costPrice !== undefined && val?.costPrice !== null ? Number(val.costPrice) : null,
      trackStock: val?.trackStock ?? true,
      isVaccine: val?.isVaccine ?? false,
      notes: val?.notes ?? '',
      isActive: val?.isActive ?? true
    })
  },
  { immediate: true }
)

const loadCategories = async () => {
  const api = useApi()
  try {
    const res = await api<any>('/api/v1/product-categories?limit=100')
    categoryOptions.value = (res.data || []).map((c: any) => ({
      label: c.name,
      value: Number(c.id)
    }))
  } catch (err) {
    message.error('Erro ao carregar categorias')
  }
}

onMounted(() => {
  loadCategories()
})

const submitLabel = computed(() => (model.id ? 'Salvar alterações' : 'Criar produto/serviço'))

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    // Auto-disable stock tracking if isService is true
    const payload = { ...model }
    if (payload.isService) {
      payload.trackStock = false
    }

    emit('submit', payload)
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
