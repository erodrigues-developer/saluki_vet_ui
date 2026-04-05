<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Vendas e Caixa</h1>
      <n-button type="primary" size="large" @click="openCreateModal">
        Nova Venda
      </n-button>
    </div>

    <n-card class="mb-6">
      <n-space>
        <n-select
          v-model:value="filters.status"
          :options="statusOptions"
          placeholder="Status"
          clearable
          style="width: 200px"
          @update:value="handleSearch"
        />
        <n-date-picker
          v-model:value="dateRange"
          type="daterange"
          clearable
          placeholder="Período"
          @update:value="handleSearch"
        />
      </n-space>
    </n-card>

    <n-data-table
      remote
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      @update:page="handlePageChange"
    />

    <n-modal v-model:show="showModal" preset="card" :title="modalTitle" class="w-full max-w-4xl">
      <SaleForm
        v-if="showModal"
        :initial-data="selectedSale"
        :readonly="isReadonly"
        @saved="handleSaved"
        @cancel="showModal = false"
      />
    </n-modal>

    <n-modal
      v-model:show="showCheckoutModal"
      preset="card"
      title="Receber Venda"
      class="w-full max-w-lg"
    >
      <n-form :model="checkoutForm" label-placement="top">
        <n-form-item label="Venda">
          <n-input :value="checkoutSummary" disabled />
        </n-form-item>

        <n-form-item label="Forma de Pagamento" required>
          <n-select
            v-model:value="checkoutForm.paymentMethodId"
            :options="paymentMethodOptions"
            placeholder="Selecione a forma de pagamento"
            filterable
            clearable
          />
        </n-form-item>

        <n-form-item label="Valor" required>
          <n-input-number
            v-model:value="checkoutForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="Data/Hora do Pagamento" required>
          <n-date-picker
            v-model:value="checkoutForm.paidAt"
            type="datetime"
            format="dd/MM/yyyy HH:mm"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="Observações">
          <n-input
            v-model:value="checkoutForm.notes"
            type="textarea"
            :rows="3"
            placeholder="Opcional. Ex: pago no balcão via PIX."
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showCheckoutModal = false" :disabled="checkoutLoading">
            Cancelar
          </n-button>
          <n-button type="primary" :loading="checkoutLoading" @click="handleCheckout">
            Confirmar Recebimento
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, resolveComponent } from 'vue';
import { NButton, NSpace, NTag, useMessage } from 'naive-ui';
import SaleForm from '~/components/sales/SaleForm.vue';
import { format } from 'date-fns';

type SaleRow = {
  id: number;
  status: 'OPEN' | 'PAID' | 'CANCELED' | string;
  totalAmount: number | string;
  saleDate: string;
  client?: { name?: string };
  veterinarian?: { name?: string };
};

const message = useMessage();
const loading = ref(false);
const data = ref<SaleRow[]>([]);
const showModal = ref(false);
const selectedSale = ref<any>(null);
const modalTitle = ref('Nova Venda');
const isReadonly = ref(false);
const showCheckoutModal = ref(false);
const checkoutLoading = ref(false);
const checkoutTargetSale = ref<SaleRow | null>(null);
const paymentMethodOptions = ref<Array<{ label: string; value: number }>>([]);

const dateRange = ref<[number, number] | null>(null);

const filters = ref({
  status: null as string | null,
});

const checkoutForm = reactive({
  paymentMethodId: null as number | null,
  amount: 0,
  paidAt: Date.now(),
  notes: '',
});

const statusOptions = [
  { label: 'Aberta', value: 'OPEN' },
  { label: 'Paga', value: 'PAID' },
  { label: 'Cancelada', value: 'CANCELED' }
];

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
});

const formatCurrency = (val: string | number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
};

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: 'Data',
    key: 'saleDate',
    render(row: any) {
      return format(new Date(row.saleDate), 'dd/MM/yyyy HH:mm');
    }
  },
  {
    title: 'Cliente',
    key: 'client',
    render(row: any) {
      return row.client?.name || 'Venda Balcão (Avulsa)';
    }
  },
  {
    title: 'Veterinário/Vendedor',
    key: 'veterinarian',
    render(row: any) {
      return row.veterinarian?.name || '-';
    }
  },
  {
    title: 'Total',
    key: 'totalAmount',
    render(row: any) {
      return formatCurrency(row.totalAmount);
    }
  },
  {
    title: 'Status',
    key: 'status',
    render(row: any) {
      const typeMap: Record<string, string> = {
        'OPEN': 'warning',
        'PAID': 'success',
        'CANCELED': 'error'
      };
      const labelMap: Record<string, string> = {
        'OPEN': 'Aberta',
        'PAID': 'Paga',
        'CANCELED': 'Cancelada'
      };
      return h(
        resolveComponent('NTag'),
        {
          type: typeMap[row.status] || 'default',
          bordered: false,
        },
        { default: () => labelMap[row.status] || row.status }
      );
    },
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 260,
    render(row: SaleRow) {
      const actions = [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => openViewModal(row),
          },
          { default: () => 'Ver / Editar' }
        ),
      ];

      if (row.status === 'OPEN') {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              secondary: true,
              'data-testid': `checkout-button-${row.id}`,
              onClick: () => openCheckoutModal(row),
            },
            { default: () => 'Receber' }
          )
        );
      }

      return h(NSpace, {}, {
        default: () => actions,
      });
    },
  },
];

const fetchSales = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
    };
    if (filters.value.status) params.status = filters.value.status;

    if (dateRange.value) {
      params.startDate = new Date(dateRange.value[0]).toISOString();
      params.endDate = new Date(dateRange.value[1]).toISOString();
    }

    const api = useApi();
    const response = await api('/api/v1/sales', { params });
    data.value = (response as any).data || [];
    pagination.value.itemCount = Number((response as any).total || 0);
  } catch (error: any) {
    message.error('Erro ao carregar vendas');
  } finally {
    loading.value = false;
  }
};

const fetchPaymentMethods = async () => {
  const api = useApi();
  const response = await api('/api/v1/payment-methods', {
    params: {
      page: 1,
      limit: 100,
    },
  });

  const methods = ((response as any).data || []) as Array<{
    id: number;
    name: string;
    isActive?: boolean;
  }>;

  paymentMethodOptions.value = methods
    .filter((method) => method.isActive !== false)
    .map((method) => ({
      label: method.name,
      value: Number(method.id),
    }));
};

const checkoutSummary = computed(() => {
  if (!checkoutTargetSale.value) return '';
  return `#${checkoutTargetSale.value.id} - Total ${formatCurrency(
    checkoutTargetSale.value.totalAmount
  )}`;
});

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchSales();
};

const handleSearch = () => {
  pagination.value.page = 1;
  fetchSales();
};

const openCreateModal = () => {
  selectedSale.value = null;
  isReadonly.value = false;
  modalTitle.value = 'Nova Venda';
  showModal.value = true;
};

const openViewModal = async (sale: any) => {
  try {
    const api = useApi();
    const fullSale = await api(`/api/v1/sales/${sale.id}`);
    selectedSale.value = fullSale;
    isReadonly.value = fullSale.status !== 'OPEN'; // If it's paid or canceled, only view
    modalTitle.value = isReadonly.value ? `Detalhes da Venda #${fullSale.id}` : `Editar Venda #${fullSale.id}`;
    showModal.value = true;
  } catch(e) {
    message.error("Erro ao carregar detalhes da venda");
  }
};

const openCheckoutModal = async (sale: SaleRow) => {
  if (sale.status !== 'OPEN') {
    message.warning('Checkout disponivel apenas para vendas abertas.');
    return;
  }

  checkoutTargetSale.value = sale;
  checkoutForm.paymentMethodId = null;
  checkoutForm.amount = Number(sale.totalAmount);
  checkoutForm.paidAt = Date.now();
  checkoutForm.notes = '';

  checkoutLoading.value = true;
  try {
    await fetchPaymentMethods();
    if (paymentMethodOptions.value.length > 0) {
      checkoutForm.paymentMethodId = paymentMethodOptions.value[0].value;
    }
    showCheckoutModal.value = true;
  } catch (_error) {
    message.error('Erro ao carregar formas de pagamento');
  } finally {
    checkoutLoading.value = false;
  }
};

const updateSaleStatusLocally = (saleId: number, status: string) => {
  data.value = data.value.map((sale) =>
    sale.id === saleId ? { ...sale, status } : sale
  );

  if (selectedSale.value?.id === saleId) {
    selectedSale.value = {
      ...selectedSale.value,
      status,
    };
  }
};

const extractApiErrorMessage = (error: any, fallback: string) => {
  const responseMessage = error?.data?.message;
  if (Array.isArray(responseMessage)) {
    return responseMessage.join(', ');
  }
  if (typeof responseMessage === 'string' && responseMessage.length > 0) {
    return responseMessage;
  }
  return fallback;
};

const handleCheckout = async () => {
  if (!checkoutTargetSale.value) {
    return;
  }
  if (!checkoutForm.paymentMethodId) {
    message.warning('Selecione a forma de pagamento.');
    return;
  }
  if (!checkoutForm.paidAt) {
    message.warning('Informe a data/hora de pagamento.');
    return;
  }

  checkoutLoading.value = true;
  try {
    const api = useApi();
    const response = await api(
      `/api/v1/sales/${checkoutTargetSale.value.id}/checkout`,
      {
        method: 'POST',
        body: {
          paymentMethodId: checkoutForm.paymentMethodId,
          amount: Number(checkoutForm.amount),
          paidAt: new Date(checkoutForm.paidAt).toISOString(),
          notes: checkoutForm.notes || undefined,
        },
      },
    );

    updateSaleStatusLocally(Number((response as any).saleId), 'PAID');
    showCheckoutModal.value = false;
    message.success('Recebimento realizado com sucesso.');
  } catch (error: any) {
    message.error(extractApiErrorMessage(error, 'Erro ao realizar recebimento.'));
  } finally {
    checkoutLoading.value = false;
  }
};

const handleSaved = () => {
  showModal.value = false;
  fetchSales();
};

onMounted(() => {
  fetchSales();
});
</script>
