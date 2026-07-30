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
          <h4 class="section-title">Informações do item</h4>
          <div class="active-wrap">
            <span class="active-label">Ativo</span>
            <n-switch v-model:value="model.isActive" />
          </div>
        </div>
        <div class="section-grid">
          <n-form-item label="Tipo" path="isService" required>
            <n-radio-group
              v-model:value="model.isService"
              name="isServiceGroup"
            >
              <n-radio-button :value="false">Produto</n-radio-button>
              <n-radio-button :value="true">Serviço</n-radio-button>
            </n-radio-group>
          </n-form-item>

          <n-form-item label="Nome" path="name" required class="full-row">
            <n-input
              v-model:value="model.name"
              placeholder="Ex: Vacina V10, Consulta veterinária..."
            />
          </n-form-item>

          <n-form-item v-if="!model.isService" label="SKU" path="sku">
            <n-input v-model:value="model.sku" placeholder="Opcional" />
          </n-form-item>

          <n-form-item
            v-if="!model.isService"
            label="Código de barras"
            path="barcode"
          >
            <n-input v-model:value="model.barcode" placeholder="Opcional" />
          </n-form-item>

          <n-form-item
            v-if="!model.isService"
            label="Imagem do produto"
            path="imgUrl"
            class="full-row"
          >
            <div class="image-upload-wrap">
              <div v-if="model.imgUrl" class="image-preview-card">
                <img
                  :src="model.imgUrl"
                  alt="Prévia do produto"
                  class="image-preview"
                />
              </div>
              <div class="image-upload-actions">
                <input
                  ref="imageInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  class="hidden-file-input"
                  @change="handleImageSelected"
                />
                <n-button
                  secondary
                  :loading="uploadingImage"
                  :disabled="loading"
                  @click="openImagePicker"
                >
                  {{ model.imgUrl ? "Trocar imagem" : "Enviar imagem" }}
                </n-button>
                <n-button
                  v-if="model.imgUrl"
                  tertiary
                  :disabled="loading || uploadingImage"
                  @click="clearImage"
                >
                  Remover imagem
                </n-button>
                <span class="image-upload-hint"
                  >PNG, JPG, WEBP ou GIF até 5 MB.</span
                >
              </div>
            </div>
          </n-form-item>

          <n-form-item label="Categoria" path="productCategoryId">
            <n-select
              v-model:value="model.productCategoryId"
              :options="categoryOptions"
              placeholder="Selecione"
              clearable
            />
          </n-form-item>

          <n-form-item
            v-if="model.isService"
            label="Duração (minutos)"
            path="durationMinutes"
            required
          >
            <n-input-number
              v-model:value="model.durationMinutes"
              :min="1"
              :step="5"
              :precision="0"
              placeholder="Ex: 45"
              style="width: 100%"
            />
          </n-form-item>

          <n-form-item label="Descrição" path="notes" class="full-row">
            <n-input
              v-model:value="model.notes"
              type="textarea"
              :rows="2"
              placeholder="Descrição curta do item"
            />
          </n-form-item>
        </div>
      </section>

      <section class="form-section">
        <div class="section-head">
          <h4 class="section-title">Preço</h4>
        </div>
        <div class="section-grid">
          <n-form-item :label="salePriceLabel" path="salePrice" required>
            <CurrencyInput v-model="model.salePrice" />
          </n-form-item>

          <n-form-item label="Custo (R$)" path="costPrice">
            <CurrencyInput v-model="model.costPrice" />
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
            <n-form-item label="É vacina?" path="isVaccine">
              <n-switch v-model:value="model.isVaccine" />
            </n-form-item>

            <n-form-item label="Tipo de venda" path="saleMode">
              <n-radio-group
                v-model:value="model.saleMode"
                name="saleModeGroup"
              >
                <n-radio-button value="UNIT">Unidade</n-radio-button>
                <n-radio-button value="WEIGHT">Peso</n-radio-button>
              </n-radio-group>
            </n-form-item>

            <n-form-item label="Estoque mínimo" path="minimumStock">
              <n-input-number
                v-model:value="model.minimumStock"
                :min="0"
                :step="0.001"
                :precision="3"
                placeholder="0,000"
                style="width: 100%"
              />
            </n-form-item>

            <n-form-item label="Unidade" path="unit" required>
              <n-input
                v-model:value="model.unit"
                :disabled="model.saleMode === 'WEIGHT'"
                placeholder="Ex: un, ml, kg"
              />
            </n-form-item>

            <n-form-item label="Fornecedor" path="supplierName">
              <n-input
                v-model:value="model.supplierName"
                placeholder="Opcional"
              />
            </n-form-item>

            <n-form-item
              v-if="model.saleMode === 'WEIGHT'"
              label="Aceita etiqueta de balança"
              path="scaleBarcodeEnabled"
            >
              <n-switch v-model:value="model.scaleBarcodeEnabled" />
            </n-form-item>

            <template
              v-if="model.saleMode === 'WEIGHT' && model.scaleBarcodeEnabled"
            >
              <n-form-item
                label="Prefixo da etiqueta"
                path="scaleBarcodePrefix"
              >
                <n-input
                  v-model:value="model.scaleBarcodePrefix"
                  placeholder="Ex: 2"
                />
              </n-form-item>

              <n-form-item
                label="Código interno da balança"
                path="scaleBarcodeProductCode"
              >
                <n-input
                  v-model:value="model.scaleBarcodeProductCode"
                  placeholder="Ex: 00045"
                />
              </n-form-item>

              <n-form-item label="Tipo da etiqueta" path="scaleBarcodeType">
                <n-select
                  v-model:value="model.scaleBarcodeType"
                  :options="scaleBarcodeTypeOptions"
                />
              </n-form-item>
            </template>
          </div>
        </template>
        <p v-else class="service-stock-note">
          Serviços não possuem controle de estoque.
        </p>
      </section>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { FormInst, FormRules } from "naive-ui";
import { useMessage } from "naive-ui";
import CurrencyInput from "../common/CurrencyInput.vue";

export interface Product {
  id?: number;
  name: string;
  productCategoryId?: number | null;
  sku?: string | null;
  barcode?: string | null;
  imgUrl?: string | null;
  isService: boolean;
  durationMinutes?: number | null;
  unit?: string | null;
  saleMode?: "UNIT" | "WEIGHT";
  saleUnit?: string | null;
  scaleBarcodeEnabled?: boolean;
  scaleBarcodePrefix?: string | null;
  scaleBarcodeProductCode?: string | null;
  scaleBarcodeType?: "WEIGHT" | "PRICE" | null;
  salePrice: number;
  costPrice?: number | null;
  trackStock: boolean;
  isVaccine: boolean;
  notes?: string | null;
  isActive: boolean;
  minimumStock?: number | null;
  supplierName?: string | null;
  productCategory?: any;
  updatedAt?: string;
}

const props = defineProps<{
  value?: Product | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", payload: Product): void;
}>();

const formRef = ref<FormInst | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const message = useMessage();
const categoryOptions = ref<{ label: string; value: number }[]>([]);
const uploadingImage = ref(false);

const model = reactive<Product>({
  id: undefined,
  name: "",
  productCategoryId: null,
  sku: "",
  barcode: "",
  imgUrl: "",
  isService: false,
  durationMinutes: null,
  unit: "un",
  saleMode: "UNIT",
  saleUnit: "un",
  scaleBarcodeEnabled: false,
  scaleBarcodePrefix: "",
  scaleBarcodeProductCode: "",
  scaleBarcodeType: "WEIGHT",
  salePrice: 0,
  costPrice: null,
  trackStock: true,
  isVaccine: false,
  notes: "",
  isActive: true,
  minimumStock: 0,
  supplierName: "",
});

const rules: FormRules = {
  name: {
    required: true,
    message: "Nome é obrigatório",
    trigger: "blur",
  },
  isService: {
    type: "boolean",
    required: true,
    message: "Tipo é obrigatório",
    trigger: "change",
  },
  salePrice: [
    {
      type: "number",
      required: true,
      message: "Preço de venda é obrigatório",
      trigger: ["blur", "change"],
    },
    {
      validator: (_rule, value) => Number(value ?? 0) >= 0,
      message: "Preço de venda deve ser maior ou igual a zero",
      trigger: ["blur", "change"],
    },
  ],
  durationMinutes: {
    validator: () => {
      if (!model.isService) return true;
      if (
        model.durationMinutes === null ||
        model.durationMinutes === undefined
      ) {
        return new Error("Duração é obrigatória para serviços");
      }
      const value = Number(model.durationMinutes);
      return (
        (Number.isInteger(value) && value > 0) ||
        new Error("Duração deve ser um número inteiro maior que zero")
      );
    },
    trigger: ["blur", "change"],
  },
  minimumStock: {
    validator: () => {
      if (model.isService) return true;
      return (
        Number(model.minimumStock ?? 0) >= 0 ||
        new Error("Estoque mínimo não pode ser negativo")
      );
    },
    trigger: ["blur", "change"],
  },
  unit: {
    validator: () => {
      if (model.isService) return true;
      return (
        String(model.unit || "").trim().length > 0 ||
        new Error("Unidade é obrigatória quando controlar estoque")
      );
    },
    trigger: ["blur", "change"],
  },
};

const marginLabel = computed(() => {
  const sale = Number(model.salePrice || 0);
  const cost = Number(model.costPrice || 0);
  if (sale <= 0 || cost <= 0 || cost > sale) return "—";
  const margin = ((sale - cost) / sale) * 100;
  return `${margin.toFixed(2)}%`;
});

const salePriceLabel = computed(() => {
  if (model.isService) return "Preço do serviço (R$)";
  return model.saleMode === "WEIGHT"
    ? "Preço por kg (R$)"
    : "Preço de venda (R$)";
});

const scaleBarcodeTypeOptions = [
  { label: "Peso embutido", value: "WEIGHT" },
  { label: "Preço embutido", value: "PRICE" },
];

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? "",
      productCategoryId: val?.productCategoryId
        ? Number(val.productCategoryId)
        : null,
      sku: val?.sku ?? "",
      barcode: val?.barcode ?? "",
      imgUrl: val?.imgUrl ?? "",
      isService: val?.isService ?? false,
      durationMinutes:
        val?.durationMinutes !== undefined && val?.durationMinutes !== null
          ? Number(val.durationMinutes)
          : null,
      unit: val?.unit ?? "un",
      saleMode: val?.saleMode === "WEIGHT" ? "WEIGHT" : "UNIT",
      saleUnit: val?.saleUnit ?? val?.unit ?? "un",
      scaleBarcodeEnabled: Boolean(val?.scaleBarcodeEnabled),
      scaleBarcodePrefix: val?.scaleBarcodePrefix ?? "",
      scaleBarcodeProductCode: val?.scaleBarcodeProductCode ?? "",
      scaleBarcodeType: val?.scaleBarcodeType === "PRICE" ? "PRICE" : "WEIGHT",
      salePrice:
        val?.salePrice !== undefined && val?.salePrice !== null
          ? Number(val.salePrice)
          : 0,
      costPrice:
        val?.costPrice !== undefined && val?.costPrice !== null
          ? Number(val.costPrice)
          : null,
      trackStock: val?.trackStock ?? true,
      isVaccine: val?.isVaccine ?? false,
      notes: val?.notes ?? "",
      isActive: val?.isActive ?? true,
      minimumStock:
        val?.minimumStock !== undefined && val?.minimumStock !== null
          ? Number(val.minimumStock)
          : 0,
      supplierName: val?.supplierName ?? "",
    });
  },
  { immediate: true },
);

watch(
  () => model.isService,
  (isService) => {
    if (isService) {
      model.sku = null;
      model.barcode = null;
      model.imgUrl = null;
      model.trackStock = false;
      model.minimumStock = null;
      model.unit = null;
      model.saleMode = "UNIT";
      model.saleUnit = null;
      model.scaleBarcodeEnabled = false;
      model.scaleBarcodePrefix = null;
      model.scaleBarcodeProductCode = null;
      model.scaleBarcodeType = null;
    } else {
      model.durationMinutes = null;
      model.trackStock = true;
      if (!model.unit) {
        model.unit = "un";
      }
    }
  },
);

watch(
  () => model.saleMode,
  (saleMode) => {
    if (model.isService) return;
    if (saleMode === "WEIGHT") {
      model.unit = "kg";
      model.saleUnit = "kg";
      if (!model.scaleBarcodeType) model.scaleBarcodeType = "WEIGHT";
      return;
    }
    if (!model.unit) model.unit = "un";
    model.saleUnit = model.unit;
    model.scaleBarcodeEnabled = false;
    model.scaleBarcodePrefix = null;
    model.scaleBarcodeProductCode = null;
    model.scaleBarcodeType = null;
  },
);

const loadCategories = async () => {
  const api = useApi();
  try {
    const res = await api<any>("/api/v1/product-categories?limit=100");
    categoryOptions.value = (res.data || []).map((c: any) => ({
      label: c.name,
      value: Number(c.id),
    }));
  } catch {
    message.error("Erro ao carregar categorias");
  }
};

onMounted(() => {
  loadCategories();
});

const submit = async () => {
  await formRef.value?.validate();

  const payload: Product = {
    ...model,
    sku: model.isService ? null : String(model.sku || "").trim() || null,
    barcode: model.isService
      ? null
      : String(model.barcode || "").trim() || null,
    imgUrl: model.isService ? null : String(model.imgUrl || "").trim() || null,
    notes: String(model.notes || "").trim() || null,
    supplierName: String(model.supplierName || "").trim() || null,
    durationMinutes: model.isService
      ? Number(model.durationMinutes ?? 0)
      : null,
    trackStock: !model.isService,
    saleMode: model.isService
      ? "UNIT"
      : model.saleMode === "WEIGHT"
        ? "WEIGHT"
        : "UNIT",
    saleUnit: model.isService
      ? null
      : model.saleMode === "WEIGHT"
        ? "kg"
        : String(model.unit || "").trim() || "un",
    scaleBarcodeEnabled:
      !model.isService && model.saleMode === "WEIGHT"
        ? Boolean(model.scaleBarcodeEnabled)
        : false,
    scaleBarcodePrefix:
      !model.isService &&
      model.saleMode === "WEIGHT" &&
      model.scaleBarcodeEnabled
        ? String(model.scaleBarcodePrefix || "").trim() || null
        : null,
    scaleBarcodeProductCode:
      !model.isService &&
      model.saleMode === "WEIGHT" &&
      model.scaleBarcodeEnabled
        ? String(model.scaleBarcodeProductCode || "").trim() || null
        : null,
    scaleBarcodeType:
      !model.isService &&
      model.saleMode === "WEIGHT" &&
      model.scaleBarcodeEnabled
        ? model.scaleBarcodeType || "WEIGHT"
        : null,
    unit: model.isService
      ? null
      : model.saleMode === "WEIGHT"
        ? "kg"
        : String(model.unit || "").trim() || "un",
    minimumStock: model.isService ? null : Number(model.minimumStock ?? 0),
  };

  emit("submit", payload);
};

const openImagePicker = () => {
  imageInputRef.value?.click();
};

const clearImage = () => {
  model.imgUrl = null;
  if (imageInputRef.value) {
    imageInputRef.value.value = "";
  }
};

const handleImageSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    message.error("Selecione um arquivo de imagem válido.");
    if (input) input.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    message.error("A imagem deve ter no máximo 5 MB.");
    if (input) input.value = "";
    return;
  }

  const api = useApi();
  const formData = new FormData();
  formData.append("file", file);

  uploadingImage.value = true;
  try {
    const response = await api<{ imgUrl: string }>(
      "/api/v1/products/upload-image",
      {
        method: "POST",
        body: formData,
      },
    );
    model.imgUrl = response.imgUrl;
    message.success("Imagem enviada.");
  } catch (err: any) {
    const apiMessage = Array.isArray(err?.data?.message)
      ? err.data.message.join(", ")
      : err?.data?.message;
    message.error(apiMessage || "Erro ao enviar imagem");
  } finally {
    uploadingImage.value = false;
    if (input) input.value = "";
  }
};

defineExpose({ submit });
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

.image-upload-wrap {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.image-preview-card {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-upload-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.image-upload-hint {
  font-size: 12px;
  color: #64748b;
}

.hidden-file-input {
  display: none;
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
