<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">FINANCEIRO</p>
        <h1>Comissões</h1>
        <p class="subhead">Acompanhe a carteira de comissões, gere pagamentos e conecte a liquidação ao contas a pagar.</p>
      </div>
      <n-button v-if="!isMobile" type="primary" size="large" class="head-cta" @click="openPayoutModal">
        Gerar pagamento
      </n-button>
    </div>

    <n-button v-if="isMobile" type="primary" block class="mobile-primary-cta" @click="openPayoutModal">
      Gerar pagamento
    </n-button>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card summary-card-warning">
        <p class="summary-label">Pendentes</p>
        <strong class="summary-value">{{ formatCurrency(summary.pendingTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-neutral">
        <p class="summary-label">Programadas</p>
        <strong class="summary-value">{{ formatCurrency(summary.scheduledTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-success">
        <p class="summary-label">Pagas</p>
        <strong class="summary-value">{{ formatCurrency(summary.paidTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-danger">
        <p class="summary-label">Canceladas</p>
        <strong class="summary-value">{{ summary.countByStatus.CANCELED || 0 }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile summary-grid">
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-warning">
        <p class="summary-label">Pendentes</p>
        <strong class="summary-value-mobile">{{ formatCurrency(summary.pendingTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-neutral">
        <p class="summary-label">Programadas</p>
        <strong class="summary-value-mobile">{{ formatCurrency(summary.scheduledTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-success">
        <p class="summary-label">Pagas</p>
        <strong class="summary-value-mobile">{{ formatCurrency(summary.paidTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-danger">
        <p class="summary-label">Canceladas</p>
        <strong class="summary-value-mobile">{{ summary.countByStatus.CANCELED || 0 }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-finance">
        <n-select
          v-model:value="filters.userId"
          :options="userOptions"
          placeholder="Profissional"
          clearable
          filterable
        />
        <n-select
          v-model:value="filters.status"
          :options="statusOptions"
          placeholder="Status"
        />
        <n-date-picker
          v-model:value="filters.period"
          type="daterange"
          format="dd/MM/yyyy"
          clearable
          start-placeholder="Período"
          end-placeholder="Período"
        />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input :value="selectedProfessionalLabel" placeholder="Todos os profissionais" readonly />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">
          <span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span>
        </n-button>
      </div>
    </n-card>

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="section-eyebrow">Carteira</p>
          <h2 class="section-title">Comissões calculadas</h2>
        </div>
      </div>

      <template v-if="isMobile">
        <div v-if="!rows.length && !loading" class="data-table-card empty-state">
          <h3>Nenhuma comissão encontrada</h3>
          <p>Não há comissões para os filtros selecionados.</p>
        </div>
        <div v-else class="card-list">
          <div v-for="row in rows" :key="row.id" class="entity-card">
            <div class="card-top">
              <p class="card-title">{{ row.user?.name || '-' }}</p>
              <n-tag :bordered="false" :class="['status-chip', statusBadgeClass(row.status)]">{{ statusLabel(row.status) }}</n-tag>
            </div>
            <p class="card-subtitle">{{ row.procedure?.name || 'Origem não identificada' }}</p>
            <p class="card-subtitle">Origem: {{ originLabel(row) }}</p>
            <p class="card-subtitle">Base: {{ formatCurrency(row.baseAmount) }} • Taxa: {{ formatPercent(row.ratePercent) }}</p>
            <p class="card-subtitle card-value">Comissão: {{ formatCurrency(row.amount) }}</p>
            <div class="card-actions">
              <n-button v-if="row.saleId" size="small" secondary type="primary" @click="openSale(row.saleId)">Abrir venda</n-button>
              <n-button v-if="resolveAccountPayableId(row)" size="small" tertiary @click="openAccountPayable(resolveAccountPayableId(row)!)">Abrir conta</n-button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="data-table-card">
        <n-data-table
          remote
          :columns="columns"
          :data="rows"
          :loading="loading"
          :pagination="pagination"
          :bordered="false"
          @update:page="handlePageChange"
        />
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="section-eyebrow">Pagamentos</p>
          <h2 class="section-title">Lotes gerados</h2>
        </div>
      </div>

      <template v-if="isMobile">
        <div v-if="!payouts.length && !payoutsLoading" class="data-table-card empty-state">
          <h3>Nenhum lote gerado</h3>
          <p>Gere um pagamento de comissão para criar a conta a pagar correspondente.</p>
        </div>
        <div v-else class="card-list">
          <div v-for="payout in payouts" :key="payout.id" class="entity-card">
            <div class="card-top">
              <p class="card-title">{{ payout.user?.name || '-' }}</p>
              <n-tag :bordered="false" :class="['status-chip', payoutStatusBadgeClass(payout.status)]">{{ payoutStatusLabel(payout.status) }}</n-tag>
            </div>
            <p class="card-subtitle">Período: {{ formatDateDisplay(payout.periodStart) }} a {{ formatDateDisplay(payout.periodEnd) }}</p>
            <p class="card-subtitle">Bruto: {{ formatCurrency(payout.grossAmount) }} • Ajustes: {{ formatCurrency(payout.adjustmentAmount) }}</p>
            <p class="card-subtitle card-value">Líquido: {{ formatCurrency(payout.netAmount) }}</p>
            <div class="card-actions">
              <n-button v-if="payout.accountPayableId" size="small" secondary type="primary" @click="openAccountPayable(payout.accountPayableId)">Abrir conta</n-button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="data-table-card">
        <n-data-table
          remote
          :columns="payoutColumns"
          :data="payouts"
          :loading="payoutsLoading"
          :pagination="payoutPagination"
          :bordered="false"
          @update:page="handlePayoutPageChange"
        />
      </div>
    </section>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="48%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select
            v-model:value="filters.userId"
            :options="userOptions"
            placeholder="Profissional"
            clearable
            filterable
          />
          <n-select
            v-model:value="filters.status"
            :options="statusOptions"
            placeholder="Status"
          />
          <n-date-picker
            v-model:value="filters.period"
            type="daterange"
            format="dd/MM/yyyy"
            clearable
            start-placeholder="Período"
            end-placeholder="Período"
          />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="showPayoutModal"
      preset="card"
      class="commissions-payout-modal"
      :mask-closable="false"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">Gerar pagamento de comissão</h3>
          <p class="modal-subtitle">Selecione o profissional e o período para consolidar as comissões em uma conta a pagar.</p>
        </div>
      </template>

      <n-form label-placement="top" :show-require-mark="false">
        <div class="sections">
          <section class="form-section">
            <h4 class="section-title">Filtros do pagamento</h4>
            <div class="form-grid">
              <n-form-item label="Profissional *">
                <n-select
                  v-model:value="payoutForm.userId"
                  :options="userOptions"
                  placeholder="Selecione o profissional"
                  filterable
                />
              </n-form-item>
              <n-form-item label="Período *" class="full-row">
                <n-date-picker
                  v-model:value="payoutForm.period"
                  type="daterange"
                  format="dd/MM/yyyy"
                  clearable
                  style="width: 100%"
                />
              </n-form-item>
              <n-form-item label="Observações" class="full-row">
                <n-input
                  v-model:value="payoutForm.notes"
                  type="textarea"
                  :rows="3"
                  placeholder="Opcional. Ex: fechamento mensal da equipe clínica."
                />
              </n-form-item>
            </div>
          </section>

          <section class="form-section">
            <div class="section-head section-head-tight">
              <h4 class="section-title">Pré-visualização</h4>
              <n-button secondary strong size="small" :loading="previewLoading" @click="handlePreviewPayout">
                Pré-visualizar
              </n-button>
            </div>

            <div v-if="payoutPreview" class="preview-stack">
              <div class="preview-summary-grid">
                <div class="preview-summary-card">
                  <p class="summary-label">Bruto</p>
                  <strong class="preview-summary-value">{{ formatCurrency(payoutPreview.totals.grossAmount) }}</strong>
                </div>
                <div class="preview-summary-card">
                  <p class="summary-label">Ajustes</p>
                  <strong class="preview-summary-value">{{ formatCurrency(payoutPreview.totals.adjustmentAmount) }}</strong>
                </div>
                <div class="preview-summary-card">
                  <p class="summary-label">Líquido</p>
                  <strong class="preview-summary-value">{{ formatCurrency(payoutPreview.totals.netAmount) }}</strong>
                </div>
              </div>

              <div class="preview-list">
                <div v-for="item in payoutPreview.commissions" :key="item.id" class="preview-item">
                  <div>
                    <p class="preview-item-title">{{ item.procedure?.name || 'Origem não identificada' }}</p>
                    <p class="preview-item-subtitle">{{ originLabel(item) }}</p>
                  </div>
                  <strong>{{ formatCurrency(item.amount) }}</strong>
                </div>
              </div>
            </div>

            <div v-else class="empty-inline-state">
              <p>Use a pré-visualização para conferir as comissões que entrarão no pagamento.</p>
            </div>
          </section>
        </div>
      </n-form>

      <template #footer>
        <div class="modal-actions">
          <n-button tertiary @click="closePayoutModal">Cancelar</n-button>
          <n-button type="primary" :loading="creatingPayout" @click="handleCreatePayout">
            Gerar pagamento
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { format, startOfMonth } from 'date-fns';
import { NButton, NTag, useMessage } from 'naive-ui';

definePageMeta({ layout: 'default' });

type UserOption = {
  label: string;
  value: number;
};

type CommissionRow = {
  id: number;
  status: string;
  amount: number | string;
  baseAmount?: number | string | null;
  ratePercent?: number | string | null;
  calculatedAt: string;
  saleId?: number | null;
  procedure?: { name?: string | null } | null;
  user?: { name?: string | null } | null;
  payoutItems?: Array<{
    payout?: {
      id: number;
      accountPayableId?: number | null;
      status?: string | null;
    } | null;
  }>;
};

type CommissionSummary = {
  pendingTotal: number;
  scheduledTotal: number;
  paidTotal: number;
  canceledTotal: number;
  countByStatus: Record<string, number>;
};

type CommissionPayoutRow = {
  id: number;
  status: string;
  grossAmount: number | string;
  adjustmentAmount: number | string;
  netAmount: number | string;
  periodStart: string;
  periodEnd: string;
  accountPayableId?: number | null;
  accountPayable?: {
    id: number;
    status?: string | null;
  } | null;
  user?: { name?: string | null } | null;
};

type CommissionPreviewResponse = {
  userId: number;
  periodStart: string;
  periodEnd: string;
  totals: {
    grossAmount: number;
    adjustmentAmount: number;
    netAmount: number;
  };
  commissions: CommissionRow[];
};

const message = useMessage();
const loading = ref(false);
const payoutsLoading = ref(false);
const previewLoading = ref(false);
const creatingPayout = ref(false);
const rows = ref<CommissionRow[]>([]);
const payouts = ref<CommissionPayoutRow[]>([]);
const userOptions = ref<UserOption[]>([]);
const showMobileFilters = ref(false);
const showPayoutModal = ref(false);
const payoutPreview = ref<CommissionPreviewResponse | null>(null);
const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;

const defaultPeriod = (): [number, number] => {
  const start = startOfMonth(new Date());
  const end = new Date();
  return [start.getTime(), end.getTime()];
};

const filters = reactive({
  userId: null as number | null,
  status: 'ALL',
  period: defaultPeriod() as [number, number] | null,
});

const payoutForm = reactive({
  userId: null as number | null,
  period: defaultPeriod() as [number, number] | null,
  notes: '',
});

const summary = reactive<CommissionSummary>({
  pendingTotal: 0,
  scheduledTotal: 0,
  paidTotal: 0,
  canceledTotal: 0,
  countByStatus: {},
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
});

const payoutPagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
});

const statusOptions = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Programada', value: 'SCHEDULED' },
  { label: 'Paga', value: 'PAID' },
  { label: 'Cancelada', value: 'CANCELED' },
];

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const formatPercent = (value: number | string | null | undefined) =>
  `${Number(value || 0).toFixed(2)}%`;

const formatDateDisplay = (value?: string | null) => {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
};

const formatDateTimeDisplay = (value?: string | null) => {
  if (!value) return '-';
  return format(new Date(value), 'dd/MM/yyyy HH:mm');
};

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    SCHEDULED: 'Programada',
    PAID: 'Paga',
    CANCELED: 'Cancelada',
  };
  return labels[status] || status;
};

const statusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'badge-soft-warning',
    SCHEDULED: 'badge-soft-neutral',
    PAID: 'badge-soft-success',
    CANCELED: 'badge-soft-danger',
  };
  return classes[status] || 'badge-soft-neutral';
};

const payoutStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    OPEN: 'Aberto',
    PAID: 'Pago',
    CANCELED: 'Cancelado',
  };
  return labels[status] || status;
};

const payoutStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    OPEN: 'badge-soft-warning',
    PAID: 'badge-soft-success',
    CANCELED: 'badge-soft-danger',
  };
  return classes[status] || 'badge-soft-neutral';
};

const selectedProfessionalLabel = computed(() => {
  return userOptions.value.find((option) => option.value === filters.userId)?.label || '';
});

const walletQuery = computed(() => {
  const query: Record<string, string | number> = {
    page: pagination.page,
    limit: pagination.pageSize,
  };

  if (filters.status !== 'ALL') query.status = filters.status;
  if (filters.userId) query.userId = filters.userId;

  if (filters.period?.[0] && filters.period?.[1]) {
    query.startDate = new Date(filters.period[0]).toISOString();
    query.endDate = new Date(filters.period[1]).toISOString();
  }

  return query;
});

const payoutQuery = computed(() => {
  const query: Record<string, string | number> = {
    page: payoutPagination.page,
    limit: payoutPagination.pageSize,
  };

  if (filters.userId) query.userId = filters.userId;
  if (filters.period?.[0] && filters.period?.[1]) {
    query.startDate = new Date(filters.period[0]).toISOString();
    query.endDate = new Date(filters.period[1]).toISOString();
  }

  return query;
});

const resolveAccountPayableId = (row: CommissionRow) =>
  row.payoutItems?.[0]?.payout?.accountPayableId || null;

const originLabel = (row: CommissionRow) => {
  if (row.saleId) return `Venda #${row.saleId}`;
  return 'Origem não identificada';
};

const openSale = (saleId: number) => navigateTo(`/financeiro/vendas/${saleId}`);

const openAccountPayable = (accountId: number) =>
  navigateTo(`/financeiro/contas-a-pagar?accountId=${accountId}`);

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: 'Profissional',
    key: 'user',
    render: (row: CommissionRow) => row.user?.name || '-',
  },
  {
    title: 'Procedimento',
    key: 'procedure',
    render: (row: CommissionRow) => row.procedure?.name || 'Origem não identificada',
  },
  {
    title: 'Origem',
    key: 'origin',
    render: (row: CommissionRow) => originLabel(row),
  },
  {
    title: 'Base',
    key: 'baseAmount',
    render: (row: CommissionRow) => formatCurrency(row.baseAmount),
  },
  {
    title: 'Taxa',
    key: 'ratePercent',
    render: (row: CommissionRow) => formatPercent(row.ratePercent),
  },
  {
    title: 'Comissão',
    key: 'amount',
    render: (row: CommissionRow) => formatCurrency(row.amount),
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: CommissionRow) =>
      h(
        NTag,
        { bordered: false, class: ['status-chip', statusBadgeClass(row.status)] },
        { default: () => statusLabel(row.status) },
      ),
  },
  {
    title: 'Calculada em',
    key: 'calculatedAt',
    render: (row: CommissionRow) => formatDateTimeDisplay(row.calculatedAt),
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: CommissionRow) =>
      h('div', { class: 'data-table__actions' }, [
        row.saleId
          ? h(
              NButton,
              {
                size: 'small',
                secondary: true,
                type: 'primary',
                onClick: (event: MouseEvent) => {
                  event.stopPropagation();
                  openSale(Number(row.saleId));
                },
              },
              { default: () => 'Abrir venda' },
            )
          : null,
        resolveAccountPayableId(row)
          ? h(
              NButton,
              {
                size: 'small',
                tertiary: true,
                onClick: (event: MouseEvent) => {
                  event.stopPropagation();
                  openAccountPayable(Number(resolveAccountPayableId(row)));
                },
              },
              { default: () => 'Abrir conta' },
            )
          : null,
      ]),
  },
];

const payoutColumns = [
  {
    title: 'Profissional',
    key: 'user',
    render: (row: CommissionPayoutRow) => row.user?.name || '-',
  },
  {
    title: 'Período',
    key: 'period',
    render: (row: CommissionPayoutRow) =>
      `${formatDateDisplay(row.periodStart)} a ${formatDateDisplay(row.periodEnd)}`,
  },
  {
    title: 'Bruto',
    key: 'grossAmount',
    render: (row: CommissionPayoutRow) => formatCurrency(row.grossAmount),
  },
  {
    title: 'Ajustes',
    key: 'adjustmentAmount',
    render: (row: CommissionPayoutRow) => formatCurrency(row.adjustmentAmount),
  },
  {
    title: 'Líquido',
    key: 'netAmount',
    render: (row: CommissionPayoutRow) => formatCurrency(row.netAmount),
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: CommissionPayoutRow) =>
      h(
        NTag,
        { bordered: false, class: ['status-chip', payoutStatusBadgeClass(row.status)] },
        { default: () => payoutStatusLabel(row.status) },
      ),
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: CommissionPayoutRow) =>
      row.accountPayableId
        ? h(
            NButton,
            {
              size: 'small',
              secondary: true,
              type: 'primary',
              onClick: (event: MouseEvent) => {
                event.stopPropagation();
                openAccountPayable(Number(row.accountPayableId));
              },
            },
            { default: () => 'Abrir conta' },
          )
        : '-',
  },
];

const fetchUsers = async () => {
  try {
    const api = useApi();
    const response = await api<any>('/api/v1/users', {
      query: {
        page: 1,
        limit: 200,
      },
    });

    userOptions.value = (response.data || []).map((user: any) => ({
      label: user.name,
      value: Number(user.id),
    }));
  } catch (_error) {
    message.error('Erro ao carregar profissionais');
  }
};

const fetchWallet = async () => {
  loading.value = true;
  try {
    const api = useApi();
    const query = walletQuery.value;
    const [listResponse, summaryResponse] = await Promise.all([
      api<any>('/api/v1/commissions', { query }),
      api<any>('/api/v1/commissions/summary', {
        query: {
          status: filters.status !== 'ALL' ? filters.status : undefined,
          userId: filters.userId || undefined,
          startDate: query.startDate,
          endDate: query.endDate,
        },
      }),
    ]);

    rows.value = listResponse.data || [];
    pagination.itemCount = Number(listResponse.meta?.total || 0);
    summary.pendingTotal = Number(summaryResponse.pendingTotal || 0);
    summary.scheduledTotal = Number(summaryResponse.scheduledTotal || 0);
    summary.paidTotal = Number(summaryResponse.paidTotal || 0);
    summary.canceledTotal = Number(summaryResponse.canceledTotal || 0);
    summary.countByStatus = summaryResponse.countByStatus || {};
  } catch (_error) {
    message.error('Erro ao carregar carteira de comissões');
  } finally {
    loading.value = false;
  }
};

const fetchPayouts = async () => {
  payoutsLoading.value = true;
  try {
    const api = useApi();
    const response = await api<any>('/api/v1/commissions/payouts', {
      query: payoutQuery.value,
    });

    payouts.value = response.data || [];
    payoutPagination.itemCount = Number(response.meta?.total || 0);
  } catch (_error) {
    message.error('Erro ao carregar pagamentos gerados');
  } finally {
    payoutsLoading.value = false;
  }
};

const handleFilter = () => {
  pagination.page = 1;
  payoutPagination.page = 1;
  fetchWallet();
  fetchPayouts();
};

const handleClearFilters = () => {
  filters.userId = null;
  filters.status = 'ALL';
  filters.period = defaultPeriod();
  pagination.page = 1;
  payoutPagination.page = 1;
  fetchWallet();
  fetchPayouts();
};

const applyMobileFilters = () => {
  showMobileFilters.value = false;
  handleFilter();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchWallet();
};

const handlePayoutPageChange = (page: number) => {
  payoutPagination.page = page;
  fetchPayouts();
};

const openPayoutModal = () => {
  payoutForm.userId = filters.userId;
  payoutForm.period = filters.period ? [...filters.period] as [number, number] : defaultPeriod();
  payoutForm.notes = '';
  payoutPreview.value = null;
  showPayoutModal.value = true;
};

const closePayoutModal = () => {
  showPayoutModal.value = false;
  payoutPreview.value = null;
};

const buildPayoutPayload = () => {
  if (!payoutForm.userId || !payoutForm.period?.[0] || !payoutForm.period?.[1]) {
    message.error('Selecione o profissional e o período do pagamento.');
    return null;
  }

  return {
    userId: Number(payoutForm.userId),
    periodStart: new Date(payoutForm.period[0]).toISOString(),
    periodEnd: new Date(payoutForm.period[1]).toISOString(),
    notes: payoutForm.notes.trim() || undefined,
  };
};

const handlePreviewPayout = async () => {
  const payload = buildPayoutPayload();
  if (!payload) return;

  previewLoading.value = true;
  try {
    const api = useApi();
    const response = await api<any>('/api/v1/commissions/payouts/preview', {
      method: 'POST',
      body: payload,
    });

    payoutPreview.value = response.data;
  } catch (error: any) {
    payoutPreview.value = null;
    message.error(error?.data?.message || 'Erro ao pré-visualizar pagamento.');
  } finally {
    previewLoading.value = false;
  }
};

const handleCreatePayout = async () => {
  const payload = buildPayoutPayload();
  if (!payload) return;

  if (!payoutPreview.value) {
    await handlePreviewPayout();
    if (!payoutPreview.value) return;
  }

  creatingPayout.value = true;
  try {
    const api = useApi();
    await api('/api/v1/commissions/payouts', {
      method: 'POST',
      body: payload,
    });

    message.success('Pagamento de comissão gerado com sucesso.');
    closePayoutModal();
    fetchWallet();
    fetchPayouts();
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao gerar pagamento.');
  } finally {
    creatingPayout.value = false;
  }
};

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false;
};

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 768px)');
  updateIsMobile();
  mediaQuery.addEventListener('change', updateIsMobile);
  await fetchUsers();
  await Promise.all([fetchWallet(), fetchPayouts()]);
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
  margin-top: 8px;
  font-size: 24px;
  color: #0f172a;
}

.summary-value-mobile {
  display: block;
  margin-top: 8px;
  font-size: 18px;
  color: #0f172a;
}

.filters-card,
.data-table-card,
.section-block,
.preview-summary-card,
.preview-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.filters-grid {
  display: grid;
  gap: 12px;
}

.filters-grid-finance {
  grid-template-columns: 1.2fr 1fr 1.2fr auto;
  align-items: center;
}

.filter-actions,
.modal-actions,
.card-actions,
.data-table__actions,
.section-head-tight {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mobile-filter-top,
.mobile-filter-actions {
  display: flex;
  gap: 8px;
}

.mobile-filter-top > :first-child {
  flex: 1;
}

.section-block {
  padding: 16px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.section-eyebrow {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.section-title {
  margin: 4px 0 0;
  font-size: 18px;
  color: #0f172a;
}

.card-list {
  display: grid;
  gap: 12px;
}

.entity-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 14px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}

.card-title {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  margin: 6px 0 0;
  color: #475569;
}

.card-value {
  font-weight: 700;
  color: #0f172a;
}

.status-chip {
  font-weight: 700;
}

.badge-soft-warning {
  background: #fff7ed;
  color: #c2410c;
}

.badge-soft-neutral {
  background: #f8fafc;
  color: #475569;
}

.badge-soft-success {
  background: #ecfdf5;
  color: #047857;
}

.badge-soft-danger {
  background: #fef2f2;
  color: #b91c1c;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
}

.empty-state h3,
.modal-title {
  margin: 0;
  color: #0f172a;
}

.empty-state p,
.modal-subtitle {
  margin: 8px 0 0;
  color: #475569;
}

.modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.full-row {
  grid-column: 1 / -1;
}

.preview-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.preview-summary-card {
  padding: 12px;
}

.preview-summary-value {
  display: block;
  margin-top: 8px;
  font-size: 20px;
  color: #0f172a;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.preview-item-title {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.preview-item-subtitle {
  margin: 4px 0 0;
  color: #64748b;
}

.empty-inline-state {
  padding: 20px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
}

.inline-icon-label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.mobile-primary-cta {
  border-radius: 12px;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters-grid-finance,
  .form-grid,
  .preview-summary-grid {
    grid-template-columns: 1fr;
  }

  .section-block {
    padding: 12px;
  }
}
</style>
