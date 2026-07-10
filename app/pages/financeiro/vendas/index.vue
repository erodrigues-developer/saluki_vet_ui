<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">FINANCEIRO</p>
        <h1>Vendas</h1>
        <p class="subhead">Gerencie vendas, recebimentos, clientes e lançamentos financeiros.</p>
      </div>
      <n-button v-if="!isMobile" type="primary" size="large" class="head-cta" @click="openCreateModal">
        Nova venda avulsa
      </n-button>
    </div>

    <n-button v-if="isMobile" type="primary" block class="mobile-primary-cta" @click="openCreateModal">
      Nova venda avulsa
    </n-button>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Total do período</p>
        <strong class="summary-value">{{ formatCurrency(summary.totalPeriod) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-success">
        <p class="summary-label">Recebido</p>
        <strong class="summary-value">{{ formatCurrency(summary.received) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-warning">
        <p class="summary-label">A receber</p>
        <strong class="summary-value">{{ formatCurrency(summary.toReceive) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-danger">
        <p class="summary-label">Vendas canceladas</p>
        <strong class="summary-value">{{ summary.canceledCount }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile summary-grid">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Total do período</p>
        <strong class="summary-value-mobile">{{ formatCurrency(summary.totalPeriod) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-success">
        <p class="summary-label">Recebido</p>
        <strong class="summary-value-mobile">{{ formatCurrency(summary.received) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-warning">
        <p class="summary-label">A receber</p>
        <strong class="summary-value-mobile">{{ formatCurrency(summary.toReceive) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-danger">
        <p class="summary-label">Vendas canceladas</p>
        <strong class="summary-value-mobile">{{ summary.canceledCount }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-sales">
        <n-input v-model:value="filters.search" placeholder="Buscar por cliente ou vendedor" clearable />
        <n-date-picker
          v-model:value="filters.period"
          type="daterange"
          format="dd/MM/yyyy"
          placeholder="Período da venda"
          clearable
          start-placeholder="Período da venda"
          end-placeholder="Período da venda"
        />
        <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Status" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar por cliente ou vendedor" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div v-for="row in data" :key="row.id" class="entity-card" @click="openViewModal(row)">
        <div class="card-top">
          <p class="card-title">{{ row.client?.name || 'Venda balcão' }}</p>
          <n-tag :bordered="false" :class="['status-chip', statusBadgeClass(row.status)]">{{ statusLabel(row.status) }}</n-tag>
        </div>
        <p class="card-subtitle">Data: {{ formatDate(row.saleDate) }} · Venda #{{ row.id }}</p>
        <p class="card-subtitle">Vendedor: {{ row.veterinarian?.name || '-' }}</p>
        <p class="card-subtitle card-value">Total: {{ formatCurrency(row.totalAmount) }}</p>

        <div class="card-actions">
          <n-button
            size="small"
            type="primary"
            :secondary="row.status === 'OPEN'"
            :disabled="row.status !== 'OPEN'"
            :aria-disabled="row.status !== 'OPEN' ? 'true' : 'false'"
            :class="['receive-btn', row.status === 'OPEN' ? 'receive-btn-active' : 'receive-btn-disabled']"
            @click.stop="openCheckoutModal(row)"
          >
            Receber
          </n-button>
          <n-dropdown trigger="click" :options="actionOptionsFor(row)" @select="(key: string) => handleActionSelect(key, row)">
            <n-button size="small" quaternary class="menu-button" @click.stop><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
          </n-dropdown>
        </div>
      </div>
    </div>

    <div v-else class="data-table-card">
      <n-data-table
        remote
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        :row-props="tableRowProps"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="46%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-date-picker
            v-model:value="filters.period"
            type="daterange"
            format="dd/MM/yyyy"
            placeholder="Período da venda"
            clearable
            start-placeholder="Período da venda"
            end-placeholder="Período da venda"
          />
          <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Status" />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="showCheckoutModal"
      preset="card"
      class="sales-checkout-modal"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">Receber venda</h3>
          <p class="modal-subtitle">Informe os dados do recebimento para marcar a venda como paga.</p>
        </div>
      </template>
      <n-form :model="checkoutForm" label-placement="top">
        <div class="sections">
          <section class="form-section">
            <h4 class="section-title">Resumo da venda</h4>
            <div class="checkout-summary-card">
              <p class="checkout-summary-title">Venda #{{ checkoutTargetSale?.id || '-' }}</p>
              <p><span>Cliente:</span> <strong>{{ checkoutClientName }}</strong></p>
              <p><span>Total da venda:</span> <strong>{{ formatCurrency(checkoutTargetAmount) }}</strong></p>
              <p class="checkout-amount-due"><span>Valor a receber:</span> <strong>{{ formatCurrency(checkoutTargetAmount) }}</strong></p>
              <p><span>Status:</span> <strong>{{ checkoutStatusLabel }}</strong></p>
            </div>
          </section>

          <section class="form-section">
            <h4 class="section-title">Dados do recebimento</h4>
            <div class="form-grid">
              <n-form-item label="Forma de pagamento" required>
                <n-select
                  v-model:value="checkoutForm.paymentMethodId"
                  :options="paymentMethodOptions"
                  placeholder="Selecione a forma de pagamento"
                  filterable
                  clearable
                />
              </n-form-item>

              <n-form-item label="Valor recebido" required>
                <CurrencyInput v-model="checkoutForm.amount" />
              </n-form-item>

              <n-form-item label="Data/hora do pagamento" required>
                <n-date-picker
                  v-model:value="checkoutForm.paidAt"
                  type="datetime"
                  format="dd/MM/yyyy HH:mm"
                  style="width: 100%"
                />
              </n-form-item>

              <n-form-item label="Observações" class="full-row">
                <n-input
                  v-model:value="checkoutForm.notes"
                  type="textarea"
                  :rows="3"
                  placeholder="Opcional. Ex: pago no balcão via PIX."
                />
              </n-form-item>
            </div>
            <p class="checkout-hint">Ao confirmar, esta venda será marcada como Paga.</p>
          </section>
        </div>
      </n-form>

      <template #footer>
        <div class="modal-actions">
          <n-button :disabled="checkoutLoading" @click="showCheckoutModal = false">
            Cancelar
          </n-button>
          <n-button type="primary" :loading="checkoutLoading" @click="handleCheckout">
            Confirmar recebimento
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { NButton, NDropdown, NTag, useDialog, useMessage } from 'naive-ui';
import { format, subDays } from 'date-fns';
import CurrencyInput from '../../../components/common/CurrencyInput.vue';

type SaleRow = {
  id: number;
  status: 'OPEN' | 'PAID' | 'CANCELED' | string;
  totalAmount: number | string;
  saleDate: string;
  client?: { name?: string };
  veterinarian?: { name?: string };
};

const message = useMessage();
const dialog = useDialog();
const router = useRouter();
const loading = ref(false);
const data = ref<SaleRow[]>([]);
const showCheckoutModal = ref(false);
const checkoutLoading = ref(false);
const checkoutTargetSale = ref<SaleRow | null>(null);
const paymentMethodOptions = ref<Array<{ label: string; value: number }>>([]);
const showMobileFilters = ref(false);
const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;

const defaultDateRange = (): [number, number] => {
  const end = new Date();
  const start = subDays(end, 29);
  return [start.getTime(), end.getTime()];
};

const filters = reactive({
  search: '',
  period: defaultDateRange() as [number, number] | null,
  status: 'ALL' as string,
});

const checkoutForm = reactive({
  paymentMethodId: null as number | null,
  amount: 0,
  paidAt: Date.now(),
  notes: '',
});

const statusOptions = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Aberta', value: 'OPEN' },
  { label: 'Paga', value: 'PAID' },
  { label: 'Cancelada', value: 'CANCELED' },
];

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

const formatCurrency = (val: string | number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0));
};

const formatDate = (value: string) => format(new Date(value), 'dd/MM/yyyy HH:mm');

const statusLabel = (status: string) => {
  if (status === 'OPEN') return 'Aberta';
  if (status === 'PAID') return 'Paga';
  if (status === 'CANCELED') return 'Cancelada';
  return status;
};

const statusBadgeClass = (status: string) => {
  if (status === 'OPEN') return 'badge-soft-warning';
  if (status === 'PAID') return 'badge-soft-success';
  if (status === 'CANCELED') return 'badge-soft-danger';
  return 'badge-soft-neutral';
};

const summary = computed(() => {
  return data.value.reduce(
    (acc, row) => {
      const amount = Number(row.totalAmount || 0);
      acc.totalPeriod += amount;
      if (row.status === 'PAID') acc.received += amount;
      if (row.status === 'OPEN') {
        acc.toReceive += amount;
      }
      if (row.status === 'CANCELED') {
        acc.canceledCount += 1;
      }
      return acc;
    },
    { totalPeriod: 0, received: 0, toReceive: 0, canceledCount: 0 },
  );
});

const actionOptionsFor = (row: SaleRow) => {
  return [
    {
      label: 'Cancelar venda',
      key: 'cancel',
      disabled: row.status === 'CANCELED',
    },
  ];
};

const handleActionSelect = (key: string, row: SaleRow) => {
  if (key === 'cancel') {
    confirmCancelSale(row);
    return;
  }
};

const columns = [
  {
    title: 'Data',
    key: 'saleDate',
    render(row: SaleRow) {
      return h('div', { class: 'cell-stacked' }, [
        h('div', { class: 'cell-main' }, formatDate(row.saleDate)),
        h('small', { class: 'cell-sub' }, `Venda #${row.id}`),
      ]);
    },
  },
  {
    title: 'Cliente',
    key: 'client',
    render(row: SaleRow) {
      return row.client?.name || 'Venda balcão';
    },
  },
  {
    title: 'Vendedor',
    key: 'veterinarian',
    render(row: SaleRow) {
      return row.veterinarian?.name || '-';
    },
  },
  {
    title: 'Total',
    key: 'totalAmount',
    align: 'right',
    titleAlign: 'right',
    render(row: SaleRow) {
      return h('span', { class: 'amount-cell' }, formatCurrency(row.totalAmount));
    },
  },
  {
    title: 'Status',
    key: 'status',
    render(row: SaleRow) {
      return h(
        NTag,
        { bordered: false, class: ['status-chip', statusBadgeClass(row.status)] },
        { default: () => statusLabel(row.status) },
      );
    },
  },
  {
    title: 'Ações',
    key: 'actions',
    align: 'right',
    titleAlign: 'right',
    width: 220,
    render(row: SaleRow) {
      const isReceivable = row.status === 'OPEN';

      return h(
        'div',
        {
          class: 'data-table__actions',
          style: 'display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:8px;white-space:nowrap;',
        },
        [
          h(
            'div',
            {
              class: 'receive-button-wrap',
              onClick: (e: MouseEvent) => e.stopPropagation(),
              onMousedown: (e: MouseEvent) => e.stopPropagation(),
            },
            [
              h(
                NButton,
                {
                  size: 'small',
                  type: 'primary',
                  secondary: isReceivable,
                  disabled: !isReceivable,
                  'aria-disabled': !isReceivable ? 'true' : 'false',
                  class: ['receive-btn', isReceivable ? 'receive-btn-active' : 'receive-btn-disabled'],
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    openCheckoutModal(row);
                  },
                },
                { default: () => 'Receber' },
              ),
            ],
          ),
          h(
            NDropdown,
            {
              trigger: 'click',
              options: actionOptionsFor(row),
              onSelect: (key: string) => handleActionSelect(key, row),
            },
            {
              default: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    quaternary: true,
                    class: 'menu-button',
                    onClick: (e: MouseEvent) => e.stopPropagation(),
                  },
                  { default: () => '⋯' },
                ),
            },
          ),
        ],
      );
    },
  },
];

const tableRowProps = (row: SaleRow) => ({
  style: 'cursor: pointer;',
  onClick: () => openViewModal(row),
});

const fetchSales = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
    };

    if (filters.status && filters.status !== 'ALL') {
      params.status = filters.status;
    }

    if (filters.period?.[0] && filters.period?.[1]) {
      params.startDate = new Date(filters.period[0]).toISOString();
      params.endDate = new Date(filters.period[1]).toISOString();
    }

    const api = useApi();
    const response = await api('/api/v1/sales', { params });

    let rows = ((response as any).data || []) as SaleRow[];
    const search = filters.search.trim().toLowerCase();

    if (search) {
      rows = rows.filter((row) => {
        const client = (row.client?.name || '').toLowerCase();
        const seller = (row.veterinarian?.name || '').toLowerCase();
        return client.includes(search) || seller.includes(search);
      });
    }

    data.value = rows;
    pagination.value.itemCount = Number((response as any).total || 0);
  } catch (_error: any) {
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

const checkoutTargetAmount = computed(() => Number(checkoutTargetSale.value?.totalAmount || 0));
const checkoutClientName = computed(() => checkoutTargetSale.value?.client?.name || 'Venda balcão');
const checkoutStatusLabel = computed(() => statusLabel(checkoutTargetSale.value?.status || 'OPEN'));

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchSales();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
  fetchSales();
};

const handleFilter = () => {
  pagination.value.page = 1;
  fetchSales();
};

const handleClearFilters = () => {
  filters.search = '';
  filters.status = 'ALL';
  filters.period = defaultDateRange();
  pagination.value.page = 1;
  fetchSales();
};

const applyMobileFilters = () => {
  showMobileFilters.value = false;
  handleFilter();
};

const openCreateModal = () => {
  router.push('/financeiro/vendas/nova');
};

const openViewModal = (sale: SaleRow) => {
  router.push(`/financeiro/vendas/${sale.id}`);
};

const openCheckoutModal = async (sale: SaleRow) => {
  if (sale.status !== 'OPEN') {
    message.warning('Recebimento disponível apenas para vendas abertas.');
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
  data.value = data.value.map((sale) => (sale.id === saleId ? { ...sale, status } : sale));
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
  if (!checkoutTargetSale.value) return;
  if (!checkoutForm.paymentMethodId) {
    message.warning('Selecione a forma de pagamento.');
    return;
  }
  if (Number(checkoutForm.amount || 0) <= 0) {
    message.warning('Informe um valor recebido maior que zero.');
    return;
  }
  if (Number(checkoutForm.amount || 0) > checkoutTargetAmount.value) {
    message.warning('Valor recebido não pode ser maior que o valor a receber.');
    return;
  }
  if (!checkoutForm.paidAt) {
    message.warning('Informe a data/hora de pagamento.');
    return;
  }

  checkoutLoading.value = true;
  try {
    const api = useApi();
    const response = await api(`/api/v1/sales/${checkoutTargetSale.value.id}/checkout`, {
      method: 'POST',
      body: {
        paymentMethodId: checkoutForm.paymentMethodId,
        amount: Number(checkoutForm.amount),
        paidAt: new Date(checkoutForm.paidAt).toISOString(),
        notes: checkoutForm.notes || undefined,
      },
    });

    updateSaleStatusLocally(Number((response as any).saleId), 'PAID');
    showCheckoutModal.value = false;
    message.success('Recebimento realizado com sucesso.');
  } catch (error: any) {
    message.error(extractApiErrorMessage(error, 'Erro ao realizar recebimento.'));
  } finally {
    checkoutLoading.value = false;
  }
};

const cancelSale = async (sale: SaleRow) => {
  try {
    const api = useApi();
    await api(`/api/v1/sales/${sale.id}/cancel`, { method: 'POST' });
    updateSaleStatusLocally(sale.id, 'CANCELED');
    message.success('Venda cancelada com sucesso.');
  } catch (error: any) {
    message.error(extractApiErrorMessage(error, 'Erro ao cancelar venda.'));
  }
};

const confirmCancelSale = (sale: SaleRow) => {
  dialog.warning({
    title: 'Cancelar venda',
    content: `Deseja cancelar a venda #${sale.id}?`,
    positiveText: 'Cancelar venda',
    negativeText: 'Voltar',
    onPositiveClick: () => cancelSale(sale),
  });
};

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false;
};

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)');
  updateIsMobile();
  mediaQuery.addEventListener('change', updateIsMobile);
  fetchSales();
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateIsMobile);
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
}

h1 {
  margin: 4px 0 0;
  font-size: 22px;
  color: #0f172a;
}

.subhead {
  margin: 8px 0 0;
  color: #475569;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-grid-mobile {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.summary-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.summary-card-success {
  border-color: #d1fae5;
  background: #f7fef9;
}

.summary-card-warning {
  border-color: #fdecc8;
  background: #fffdf6;
}

.summary-card-neutral {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.summary-card-danger {
  border-color: #fecaca;
  background: #fff8f8;
}

.summary-label {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.summary-value {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  color: #0f172a;
}

.summary-value-mobile {
  display: block;
  margin-top: 6px;
  font-size: 20px;
  color: #0f172a;
}

.filters-card {
  background: #fff;
  border: 1px solid #e5e7eb;
}

.filters-card :deep(.n-card__content) {
  padding: 12px;
}

.filters-grid {
  display: grid;
  gap: 12px;
  align-items: end;
}

.filters-grid-sales {
  grid-template-columns: 2fr 1.5fr 1fr auto;
}

.filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.btn-clear {
  color: #475569;
}

.btn-filter {
  width: 112px;
}

:deep(.btn-filter.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
}

:deep(.btn-filter.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}

.data-table-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

:deep(.n-data-table-th) {
  font-weight: 600;
  color: #374151;
  background: #f8fafc;
}

:deep(.n-data-table-td) {
  background: #fff;
  padding-top: 7px !important;
  padding-bottom: 7px !important;
}

:deep(.n-data-table-tr:hover td) {
  background: #f8fafc;
}

:deep(.n-data-table .n-data-table__pagination),
:deep(.n-data-table .n-data-table-pagination) {
  min-height: 40px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 12px 12px;
}

.data-table__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
  width: 100%;
}

.receive-button-wrap {
  display: inline-flex;
  flex: 0 0 auto;
}

:deep(.data-table__actions .n-button),
:deep(.data-table__actions .n-dropdown) {
  flex: 0 0 auto;
}

:deep(.receive-btn-disabled.n-button) {
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  border-color: #e2e8f0 !important;
  cursor: not-allowed !important;
}

:deep(.receive-btn-disabled.n-button:hover),
:deep(.receive-btn-disabled.n-button:focus) {
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  border-color: #e2e8f0 !important;
  box-shadow: none !important;
}

:deep(.receive-btn-active.n-button) {
  color: #166534 !important;
  border-color: #86efac !important;
  background: #f0fdf4 !important;
}

:deep(.receive-btn-active.n-button:hover) {
  color: #14532d !important;
  border-color: #4ade80 !important;
  background: #dcfce7 !important;
}

.amount-cell {
  font-weight: 600;
  color: #0f172a;
}

.cell-stacked {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.25;
  gap: 2px;
}

.cell-main {
  color: #0f172a;
  white-space: nowrap;
}

.cell-sub {
  color: #64748b;
  font-size: 12px;
  line-height: 1.1;
}

:deep(.status-chip.n-tag) {
  border-width: 1px !important;
}

:deep(.status-chip.badge-soft-warning.n-tag) {
  color: #9a6700;
  background: #fff7e6;
  border: 1px solid #fdecc8;
}

:deep(.status-chip.badge-soft-success.n-tag) {
  color: #166534;
  background: #ecfdf3;
  border: 1px solid #d1fae5;
}

:deep(.status-chip.badge-soft-neutral.n-tag) {
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

:deep(.status-chip.badge-soft-danger.n-tag) {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.mobile-primary-cta {
  margin-top: -6px;
}

.mobile-filters-card {
  padding: 10px;
}

.mobile-filter-top {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:deep(.mobile-filter-trigger.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
  background: #fff;
}

:deep(.mobile-filter-trigger.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}

.mobile-filters-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entity-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
}

.card-value {
  font-weight: 700;
  color: #0f172a;
}

.card-actions {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; line-height: 1.2; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }
.sections { display: flex; flex-direction: column; gap: 12px; }
.form-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}
.full-row { grid-column: 1 / -1; }
.checkout-summary-card {
  padding: 2px 0 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.checkout-summary-title { margin: 0 0 6px; font-weight: 700; color: #0f172a; }
.checkout-summary-card p { margin: 3px 0; color: #334155; }
.checkout-summary-card span { color: #64748b; }
.checkout-amount-due strong { color: #0f172a; font-size: 16px; font-weight: 800; }
.checkout-hint { margin: 8px 0 0; color: #64748b; font-size: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }

@media (max-width: 1280px) {
  .filters-grid-sales {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
    gap: 8px;
  }

  .modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .modal-actions :deep(.n-button) { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
  .form-section { padding: 10px; }
}
</style>

<style>
.sales-checkout-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
  width: 760px !important;
  max-width: calc(100vw - 24px) !important;
  max-height: calc(100vh - 48px) !important;
  max-height: calc(100dvh - 48px) !important;
  margin: 0 auto !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sales-checkout-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.sales-checkout-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 24px;
}

.sales-checkout-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .sales-checkout-modal.n-card {
    max-width: calc(100vw - 12px) !important;
    max-height: calc(100vh - 16px) !important;
    max-height: calc(100dvh - 16px) !important;
  }
}
</style>
