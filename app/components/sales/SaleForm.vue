<template>
  <div class="sale-form-container">
    <n-form
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="top"
      :disabled="loading || readonly"
    >
      <div class="grid grid-cols-2 gap-4">
        <n-form-item label="Cliente (Opcional - venda avulsa)" path="clientId">
          <n-select
            v-model:value="model.clientId"
            :options="clientOptions"
            placeholder="Selecione um cliente"
            clearable
            filterable
          />
        </n-form-item>

        <n-form-item label="Veterinário / Vendedor" path="veterinarianId" required>
          <n-select
            v-model:value="model.veterinarianId"
            :options="veterinarianOptions"
            placeholder="Selecione o profissional"
            filterable
          />
        </n-form-item>

        <n-form-item label="Data da Venda" path="saleDate" required>
          <n-date-picker
            v-model:value="model.saleDate"
            type="datetime"
            format="dd/MM/yyyy HH:mm"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="Status" path="status" required>
          <n-select
            v-model:value="model.status"
            :options="statusOptions"
          />
        </n-form-item>

        <n-form-item label="Observações" path="notes" class="col-span-2">
          <n-input v-model:value="model.notes" type="textarea" :rows="2" placeholder="Notas sobre a venda..." />
        </n-form-item>
      </div>

      <n-divider>Itens da Venda</n-divider>

      <n-data-table
        :columns="itemColumns"
        :data="model.items"
        :bordered="false"
        class="mb-4"
      />

      <!-- Button to add new items -->
      <n-button dashed block @click="addItem" v-if="!readonly">
        + Adicionar Produto / Serviço
      </n-button>

      <div class="mt-6 p-4 bg-gray-50 rounded dark:bg-gray-800">
        <div class="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>{{ formatCurrency(calculatedSubtotal) }}</span>
        </div>
        <div class="flex justify-between mb-2 items-center">
          <span>Desconto (R$):</span>
          <n-input-number
            v-model:value="model.discountAmount"
            :min="0"
            :precision="2"
            :max="calculatedSubtotal"
            size="small"
            style="width: 150px"
            :disabled="readonly"
          />
        </div>
        <div class="flex justify-between font-bold text-lg border-t pt-2 border-gray-200 dark:border-gray-700">
          <span>Total:</span>
          <span>{{ formatCurrency(calculatedTotal) }}</span>
        </div>
      </div>

      <div class="actions mt-6 flex justify-end gap-2">
        <n-button @click="$emit('cancel')" :disabled="loading">Cancelar</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit" v-if="!readonly">
          Salvar Venda
        </n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, resolveComponent } from 'vue';
import { NSelect, NInputNumber, NButton, useMessage } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';

const props = defineProps<{
  initialData?: any;
  readonly?: boolean;
}>();

const emit = defineEmits(['saved', 'cancel']);
const message = useMessage();
const loading = ref(false);
const formRef = ref<FormInst | null>(null);

const clientOptions = ref<{label: string, value: number}[]>([]);
const veterinarianOptions = ref<{label: string, value: number}[]>([]);
const productOptions = ref<{label: string, value: number, salePrice: number}[]>([]);

const statusOptions = [
  { label: 'Aberta', value: 'OPEN' },
  { label: 'Paga', value: 'PAID' },
  { label: 'Cancelada', value: 'CANCELED' }
];

const model = reactive({
  id: undefined,
  clientId: null as number | null,
  veterinarianId: null as number | null,
  saleDate: Date.now(),
  status: 'OPEN',
  notes: '',
  discountAmount: 0,
  items: [] as Array<{
    id?: number,
    productId: number | null,
    quantity: number,
    unitPrice: number,
    discountAmount: number,
    totalPrice: number,
    _key: string
  }>
});

const rules: FormRules = {
  veterinarianId: { type: 'number', required: true, message: 'Obrigatório seleconar o vendedor/veterinário', trigger: 'change' },
  saleDate: { type: 'number', required: true, message: 'A data é obrigatória', trigger: 'change' }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const loadLookups = async () => {
  const api = useApi();
  try {
    const [clientsRes, usersRes, productsRes] = await Promise.all([
      api<any>('/api/v1/clients?limit=500'),
      api<any>('/api/v1/users?limit=100'),
      api<any>('/api/v1/products?limit=500')
    ]);

    clientOptions.value = clientsRes.data.map((i: any) => ({ label: i.name, value: Number(i.id) }));
    veterinarianOptions.value = usersRes.data.map((i: any) => ({ label: i.name, value: Number(i.id) }));
    productOptions.value = productsRes.data.map((i: any) => ({
      label: `${i.name} (${formatCurrency(Number(i.salePrice))})`,
      value: Number(i.id),
      salePrice: Number(i.salePrice)
    }));
  } catch (err) {
    message.error('Erro ao carregar dados auxiliares');
  }
};

const addItem = () => {
  model.items.push({
    productId: null,
    quantity: 1,
    unitPrice: 0,
    discountAmount: 0,
    totalPrice: 0,
    _key: Math.random().toString(36).substring(7)
  });
};

const removeItem = (key: string) => {
  if (props.readonly) return;
  model.items = model.items.filter(i => i._key !== key);
};

const handleProductSelect = (val: number, row: any) => {
  const prod = productOptions.value.find(p => p.value === val);
  if (prod) {
    row.unitPrice = prod.salePrice;
    recalculateRow(row);
  }
};

const recalculateRow = (row: any) => {
  row.totalPrice = (row.quantity * row.unitPrice) - row.discountAmount;
  if (row.totalPrice < 0) row.totalPrice = 0;
};

const calculatedSubtotal = computed(() => {
  return model.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
});

const calculatedTotal = computed(() => {
  let sub = calculatedSubtotal.value;
  // Apply individual item discounts first (already in row.totalPrice)
  let sumWithItemDiscounts = model.items.reduce((sum, item) => sum + item.totalPrice, 0);
  let final = sumWithItemDiscounts - (model.discountAmount || 0);
  return final > 0 ? final : 0;
});

const itemColumns = computed(() => {
  return [
    {
      title: 'Produto/Serviço',
      key: 'productId',
      render(row: any) {
        if (props.readonly) {
          const p = productOptions.value.find(o => o.value === row.productId);
          return p ? p.label.split('(')[0] : 'Desconhecido';
        }
        return h(NSelect, {
          value: row.productId,
          options: productOptions.value,
          filterable: true,
          placeholder: 'Selecione',
          onUpdateValue: (val) => {
            row.productId = val;
            handleProductSelect(val, row);
          }
        });
      }
    },
    {
      title: 'Quantidade',
      key: 'quantity',
      width: 120,
      render(row: any) {
        if (props.readonly) return row.quantity;
        return h(NInputNumber, {
          value: row.quantity,
          min: 1,
          showButton: false,
          onUpdateValue: (val) => {
            row.quantity = val || 1;
            recalculateRow(row);
          }
        });
      }
    },
    {
      title: 'Preço Unt.',
      key: 'unitPrice',
      width: 140,
      render(row: any) {
        if (props.readonly) return formatCurrency(row.unitPrice);
        return h(NInputNumber, {
          value: row.unitPrice,
          min: 0,
          precision: 2,
          showButton: false,
          onUpdateValue: (val) => {
            row.unitPrice = val || 0;
            recalculateRow(row);
          }
        });
      }
    },
    {
      title: 'Desc. Unt.',
      key: 'discountAmount',
      width: 120,
      render(row: any) {
        if (props.readonly) return formatCurrency(row.discountAmount);
        return h(NInputNumber, {
          value: row.discountAmount,
          min: 0,
          precision: 2,
          showButton: false,
          onUpdateValue: (val) => {
            row.discountAmount = val || 0;
            recalculateRow(row);
          }
        });
      }
    },
    {
      title: 'Total',
      key: 'totalPrice',
      width: 140,
      render(row: any) {
        return formatCurrency(row.totalPrice);
      }
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render(row: any) {
        if (props.readonly) return null;
        return h(NButton, {
          quaternary: true,
          type: 'error',
          onClick: () => removeItem(row._key)
        }, { default: () => 'X' });
      }
    }
  ];
});

onMounted(async () => {
  await loadLookups();
  if (props.initialData) {
    Object.assign(model, {
      ...props.initialData,
      clientId: props.initialData.clientId ? Number(props.initialData.clientId) : null,
      veterinarianId: props.initialData.veterinarianId ? Number(props.initialData.veterinarianId) : null,
      saleDate: new Date(props.initialData.saleDate).getTime(),
      items: props.initialData.items ? props.initialData.items.map((i:any) => ({
        ...i,
        productId: Number(i.productId),
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discountAmount: Number(i.discountAmount),
        totalPrice: Number(i.totalPrice),
        _key: Math.random().toString(36).substring(7)
      })) : []
    });
  }
});

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    if (model.items.length === 0) {
      message.warning('Adicione ao menos um item à venda.');
      return;
    }

    const hasEmptyProduct = model.items.some(i => !i.productId);
    if (hasEmptyProduct) {
      message.warning('Todos os itens devem ter um produto selecionado.');
      return;
    }

    loading.value = true;

    const payload = {
      ...model,
      saleDate: new Date(model.saleDate).toISOString(),
      subtotal: calculatedSubtotal.value,
      totalAmount: calculatedTotal.value,
    };

    const url = model.id ? `/api/v1/sales/${model.id}` : '/api/v1/sales';
    const method = model.id ? 'PATCH' : 'POST';

    const api = useApi();

    const response = await api(url, {
      method,
      body: payload
    });

    // We must also save items if we are creating.
    // Since our backend service 'sales.service.ts' simple CRUD doesn't save nested items,
    // we must manually loop and create sale_items.
    if (!model.id && response.id) {
       for (const item of model.items) {
          await api('/api/v1/sale-items', {
             method: 'POST',
             body: {
               saleId: response.id,
               productId: item.productId,
               quantity: item.quantity,
               unitPrice: item.unitPrice,
               discountAmount: item.discountAmount,
               totalPrice: item.totalPrice
             }
          });
       }
    }

    message.success('Venda salva com sucesso!');
    emit('saved', response);
  } catch (error: any) {
    message.error(error.data?.message || 'Erro ao salvar a venda');
  } finally {
    loading.value = false;
  }
};
</script>
