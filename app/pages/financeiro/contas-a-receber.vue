<template>
  <div class="page">
    <div class="page-header page-head">
      <div class="head-copy">
        <p class="eyebrow">FINANCEIRO</p>
        <h1>Contas a receber</h1>
        <p class="subhead">Gerencie recebimentos, vencimentos, clientes e pendências financeiras.</p>
      </div>
      <n-button v-if="!isMobile" type="primary" size="large" class="head-cta" @click="openCreateModal">
        Nova conta
      </n-button>
    </div>

    <n-button v-if="isMobile" type="primary" block class="mobile-primary-cta" @click="openCreateModal">
      Nova conta
    </n-button>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Total do período</p>
        <strong class="summary-value">{{ formatCurrency(filteredSummary.expectedTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-warning">
        <p class="summary-label">Pendente</p>
        <strong class="summary-value">{{ formatCurrency(filteredSummary.totalPending) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-success">
        <p class="summary-label">Recebido</p>
        <strong class="summary-value">{{ formatCurrency(filteredSummary.totalPaid) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-danger">
        <p class="summary-label">Atrasado</p>
        <strong class="summary-value">{{ formatCurrency(filteredSummary.totalOverdue) }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile summary-grid">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Total do período</p>
        <strong class="summary-value-mobile">{{ formatCurrency(filteredSummary.expectedTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-warning">
        <p class="summary-label">Pendente</p>
        <strong class="summary-value-mobile">{{ formatCurrency(filteredSummary.totalPending) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-success">
        <p class="summary-label">Recebido</p>
        <strong class="summary-value-mobile">{{ formatCurrency(filteredSummary.totalPaid) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-danger">
        <p class="summary-label">Atrasado</p>
        <strong class="summary-value-mobile">{{ formatCurrency(filteredSummary.totalOverdue) }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-finance">
        <n-input v-model:value="filters.search" placeholder="Buscar por descrição, cliente ou venda" clearable />
        <n-date-picker
          v-model:value="filters.dueDateRange"
          type="daterange"
          format="dd/MM/yyyy"
          clearable
          start-placeholder="Período de vencimento"
          end-placeholder="Período de vencimento"
        />
        <n-select
          v-model:value="filters.clientId"
          :options="clientOptions"
          placeholder="Cliente"
          filterable
          remote
          clearable
          :loading="clientLoading"
          @search="onClientSearch"
          @focus="ensureClientsLoaded"
        />
        <n-select v-model:value="filters.originType" :options="originOptions" placeholder="Origem" />
        <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Status" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar por descrição, cliente ou venda" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <template v-if="isMobile">
      <template v-if="!filteredReceivables.length && !loading">
        <div class="data-table-card empty-state">
          <h3>{{ hasActiveFilters ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada' }}</h3>
          <p>
            {{ hasActiveFilters
              ? 'Não encontramos recebimentos para os filtros selecionados.'
              : 'Adicione sua primeira conta para acompanhar vencimentos e recebimentos.' }}
          </p>
          <div class="empty-actions">
            <n-button v-if="hasActiveFilters" tertiary @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="openCreateModal">Adicionar conta</n-button>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="mobile-list card-list">
          <div v-for="row in paginatedReceivables" :key="row.id" class="mobile-record-card entity-card">
            <div class="mobile-record-top">
              <p class="card-title">{{ row.description }}</p>
              <span :class="['badge', statusBadgeClass(getEffectiveStatus(row))]">{{ statusLabel(getEffectiveStatus(row)) }}</span>
            </div>
            <p class="card-subtitle"><span class="card-line-label">Cliente: </span><span class="card-line-value">{{ row.client?.name || 'Sem cliente' }}</span></p>
            <p class="card-subtitle"><span class="card-line-label">Origem: </span><span class="card-line-value">{{ originLabel(row) }}</span></p>
            <p v-if="row.saleId" class="card-subtitle"><span class="card-line-label">Venda: </span><span class="card-line-value">#{{ row.saleId }}</span></p>
            <p class="card-subtitle" :class="{ 'is-overdue': getEffectiveStatus(row) === 'OVERDUE' }">
              <span class="card-line-label">{{ getEffectiveStatus(row) === 'OVERDUE' ? 'Vencido em: ' : 'Vencimento: ' }}</span>
              <span :class="['card-line-value', { 'overdue-value': getEffectiveStatus(row) === 'OVERDUE' }]">{{ formatDateDisplay(row.dueDate) }}</span>
            </p>
            <p class="card-subtitle card-value-line"><span class="card-line-label">Valor: </span><span class="card-line-value financial-value">{{ formatCurrency(Number(row.amount)) }}</span></p>
            <div class="card-actions" @click.stop @mousedown.stop>
              <n-button size="small" secondary type="primary" @click.stop="openEditModal(row)">Ver conta</n-button>
              <n-dropdown trigger="click" :options="buildActionOptions(row)" @select="(key: string) => handleActionSelect(key, row)">
                <n-button size="small" quaternary class="menu-button" @click.stop @mousedown.stop><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
              </n-dropdown>
            </div>
          </div>
        </div>
      </template>
    </template>

    <template v-else>
      <div v-if="!filteredReceivables.length && !loading" class="data-table-card empty-state">
        <h3>{{ hasActiveFilters ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada' }}</h3>
        <p>
          {{ hasActiveFilters
            ? 'Não encontramos recebimentos para os filtros selecionados.'
            : 'Adicione sua primeira conta para acompanhar vencimentos e recebimentos.' }}
        </p>
        <div class="empty-actions">
          <n-button v-if="hasActiveFilters" tertiary @click="handleClearFilters">Limpar filtros</n-button>
          <n-button type="primary" @click="openCreateModal">Adicionar conta</n-button>
        </div>
      </div>
      <n-data-table
        v-else
        :columns="columns"
        :data="filteredReceivables"
        :loading="loading"
        :pagination="tablePagination"
        :bordered="false"
        :row-props="tableRowProps"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </template>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="56%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-date-picker
            v-model:value="filters.dueDateRange"
            type="daterange"
            format="dd/MM/yyyy"
            clearable
            start-placeholder="Período de vencimento"
            end-placeholder="Período de vencimento"
          />
          <n-select
            v-model:value="filters.clientId"
            :options="clientOptions"
            placeholder="Cliente"
            filterable
            remote
            clearable
            :loading="clientLoading"
            @search="onClientSearch"
            @focus="ensureClientsLoaded"
          />
          <n-select v-model:value="filters.originType" :options="originOptions" placeholder="Origem" />
          <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Status" />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="showCreateModal"
      preset="card"
      class="accounts-receivable-modal"
      :mask-closable="false"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingAccountId ? 'Editar conta a receber' : 'Nova conta a receber' }}</h3>
          <p class="modal-subtitle">Informe os dados do recebimento, vencimento e liquidação.</p>
        </div>
      </template>
      <n-form :model="createForm" ref="createFormRef" :rules="createRules" label-placement="top" :show-require-mark="false">
        <div class="sections">
          <section class="form-section">
            <div class="section-head">
              <h4 class="section-title">Dados da conta</h4>
              <n-tag :bordered="false" class="status-chip" :class="statusBadgeClass(modalCurrentStatus)">
                {{ statusLabel(modalCurrentStatus) }}
              </n-tag>
            </div>
            <div class="form-grid">
              <n-form-item label="Descrição *" path="description" required>
                <n-input v-model:value="createForm.description" :disabled="isManagedBySale" placeholder="Ex: Hospedagem em aberto" />
              </n-form-item>
              <n-form-item label="Cliente" path="clientId">
                <n-select
                  v-model:value="createForm.clientId"
                  :options="clientOptions"
                  placeholder="Selecione o cliente"
                  filterable
                  remote
                  clearable
                  :disabled="isManagedBySale"
                  :loading="clientLoading"
                  @search="onClientSearch"
                  @focus="ensureClientsLoaded"
                />
              </n-form-item>
              <n-form-item label="Origem">
                <n-input :value="originLabelFromValue(createForm.originType, linkedSaleId)" disabled />
              </n-form-item>
              <n-form-item v-if="linkedSaleId" label="Venda vinculada">
                <n-input :value="`Venda #${linkedSaleId}`" disabled />
              </n-form-item>
            </div>
            <p v-if="isManagedBySale" class="origin-hint full-row">
              Este lançamento foi gerado automaticamente a partir de uma venda. Alterações e estornos devem ser feitos pelo fluxo de vendas.
            </p>
          </section>

          <section class="form-section">
            <h4 class="section-title">Financeiro</h4>
            <div class="form-grid">
              <n-form-item label="Valor *" path="amount" required>
                <n-input
                  v-model:value="amountDisplay"
                  :disabled="isManagedBySale"
                  placeholder="R$ 0,00"
                  @update:value="onAmountInput"
                  @blur="onAmountBlur"
                />
              </n-form-item>
              <n-form-item label="Data de vencimento *" path="dueDate" required>
                <n-date-picker
                  v-model:value="createForm.dueDate"
                  type="date"
                  clearable
                  :disabled="isManagedBySale"
                  style="width: 100%"
                />
              </n-form-item>
              <p v-if="modalCurrentStatus === 'OVERDUE'" class="overdue-hint full-row">
                Esta conta está vencida e ainda não possui recebimento registrado.
              </p>
            </div>

            <div v-if="editingAccountId" class="payment-inline-area">
              <div v-if="modalCurrentStatus === 'PAID'" class="payment-registered-card">
                <p class="payment-registered-title">Recebimento registrado</p>
                <p><span class="card-line-label">Data de recebimento: </span><span class="card-line-value">{{ formatDateTimeDisplay(registeredReceipt.paidAt) }}</span></p>
                <p><span class="card-line-label">Valor recebido: </span><span class="card-line-value">{{ formatCurrency(Number(registeredReceipt.paidAmount || 0)) }}</span></p>
                <p><span class="card-line-label">Forma de pagamento: </span><span class="card-line-value">{{ registeredReceipt.paymentMethodName || '-' }}</span></p>
                <n-button v-if="!isManagedBySale" size="small" tertiary @click="handleUndoInlineReceipt">Estornar recebimento</n-button>
              </div>

              <template v-else-if="!isManagedBySale">
                <n-button
                  v-if="!showInlineReceiptForm"
                  size="small"
                  secondary
                  type="primary"
                  @click="openInlineReceiptForm"
                >
                  Registrar recebimento
                </n-button>

                <div v-else class="payment-form-inline">
                  <div class="payment-form-head">
                    <p class="payment-form-title">Registrar recebimento</p>
                    <n-button text class="btn-clear" @click="collapseInlineReceiptForm">Ocultar recebimento</n-button>
                  </div>
                  <p class="payment-form-status-impact">Ao confirmar, esta conta será marcada como Recebida.</p>
                  <div class="form-grid">
                    <n-form-item label="Data do recebimento *">
                      <n-date-picker v-model:value="inlineReceiptForm.paidAt" type="datetime" clearable style="width: 100%" />
                    </n-form-item>
                    <n-form-item label="Valor recebido *">
                      <n-input
                        v-model:value="inlineReceivedAmountDisplay"
                        placeholder="R$ 0,00"
                        @update:value="onInlineReceivedAmountInput"
                        @blur="onInlineReceivedAmountBlur"
                      />
                    </n-form-item>
                    <n-form-item label="Forma de pagamento *">
                      <n-select
                        v-model:value="inlineReceiptForm.paymentMethodId"
                        :options="paymentMethodOptions"
                        :loading="paymentMethodLoading"
                        clearable
                        filterable
                      />
                    </n-form-item>
                    <n-form-item label="Observação do recebimento" class="full-row">
                      <n-input v-model:value="inlineReceiptForm.note" type="textarea" :rows="2" />
                    </n-form-item>
                  </div>
                </div>
              </template>
            </div>
          </section>

          <section class="form-section">
            <h4 class="section-title">Observações</h4>
            <div class="form-grid">
              <n-form-item label="Anotações" path="notes" class="full-row">
                <n-input type="textarea" v-model:value="createForm.notes" :disabled="isManagedBySale" :rows="3" />
              </n-form-item>
              <n-form-item label="Link do documento" path="documentUrl" class="full-row">
                <n-input v-model:value="createForm.documentUrl" :disabled="isManagedBySale" placeholder="https://..." />
              </n-form-item>
            </div>
          </section>
        </div>
      </n-form>
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeCreateModal">Cancelar</n-button>
          <n-button
            type="primary"
            :loading="primaryActionLoading"
            :disabled="primaryActionDisabled"
            @click="handlePrimaryModalAction"
          >
            {{ primaryActionLabel }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { NButton, NDropdown, NTag, useMessage } from 'naive-ui';

definePageMeta({ layout: 'default' });

interface ClientListItem {
  id: number;
  name: string;
}

interface SaleReference {
  id: number;
}

interface PaymentMethodReference {
  id: number;
  name: string;
}

interface AccountReceivableItem {
  id: number;
  description: string;
  clientId?: number | null;
  client?: ClientListItem | null;
  saleId?: number | null;
  sale?: SaleReference | null;
  paymentMethodId?: number | null;
  paymentMethod?: PaymentMethodReference | null;
  originType?: 'MANUAL' | 'SALE' | string;
  amount: number;
  dueDate: string;
  status: string;
  paidAmount?: number | null;
  paidAt?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
}

type FinancialStatus = 'PENDING' | 'PAID' | 'OVERDUE';
type AccountOrigin = 'MANUAL' | 'SALE';

const router = useRouter();
const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const savingInlineReceipt = ref(false);
const showCreateModal = ref(false);
const showMobileFilters = ref(false);
const createFormRef = ref();
const editingAccountId = ref<number | null>(null);
const linkedSaleId = ref<number | null>(null);
const editingOriginalNotes = ref<string | null>(null);
const editingOriginalDocumentUrl = ref<string | null>(null);
const modalBaseStatus = ref<string>('PENDING');
const modalHadReceipt = ref(false);
const amountDisplay = ref('R$ 0,00');
const showInlineReceiptForm = ref(false);
const inlineReceiptForm = reactive({
  paidAt: Date.now(),
  paidAmount: 0,
  paymentMethodId: null as number | null,
  note: '',
});
const inlineReceivedAmountDisplay = ref('R$ 0,00');
const registeredReceipt = reactive<{
  paidAt: string | null;
  paidAmount: number | null;
  paymentMethodName: string | null;
}>({
  paidAt: null,
  paidAmount: null,
  paymentMethodName: null,
});

const receivables = ref<AccountReceivableItem[]>([]);
const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false; };

const pagination = reactive({
  page: 1,
  pageSize: 10,
});

const clientOptions = ref<{ label: string; value: number }[]>([]);
const clientLoading = ref(false);
const paymentMethodOptions = ref<{ label: string; value: number }[]>([]);
const paymentMethodLoading = ref(false);

const today = new Date();
today.setHours(0, 0, 0, 0);
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const defaultDueDateFrom = new Date(today.getTime() - THIRTY_DAYS_IN_MS).getTime();
const defaultDueDateTo = new Date(today.getTime() + THIRTY_DAYS_IN_MS).getTime();

const filters = reactive({
  search: '',
  dueDateRange: [defaultDueDateFrom, defaultDueDateTo] as [number, number] | null,
  clientId: null as number | null,
  originType: 'ALL' as 'ALL' | AccountOrigin,
  status: 'ALL' as 'ALL' | FinancialStatus,
});

const originOptions = [
  { label: 'Todas as origens', value: 'ALL' },
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Venda', value: 'SALE' },
];

const statusOptions = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Recebido', value: 'PAID' },
  { label: 'Atrasado', value: 'OVERDUE' },
];

const createForm = reactive({
  description: '',
  clientId: null as number | null,
  originType: 'MANUAL' as AccountOrigin,
  amount: 0,
  dueDate: Date.now(),
  notes: '',
  documentUrl: '',
});

const createRules = {
  description: { required: true, message: 'Requerido', trigger: 'blur' },
  amount: {
    type: 'number',
    required: true,
    message: 'Requerido',
    trigger: 'blur',
  },
  dueDate: {
    type: 'number',
    required: true,
    message: 'Requerido',
    trigger: 'blur',
  },
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);

const parseCurrencyBr = (value: string) => {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
};

const formatCurrencyInput = (value: number) => formatCurrency(Number(value || 0));

const onAmountInput = (value: string) => {
  const parsed = parseCurrencyBr(value);
  createForm.amount = parsed;
  amountDisplay.value = formatCurrencyInput(parsed);
};

const onAmountBlur = () => {
  amountDisplay.value = formatCurrencyInput(createForm.amount);
};

const onInlineReceivedAmountInput = (value: string) => {
  const parsed = parseCurrencyBr(value);
  inlineReceiptForm.paidAmount = parsed;
  inlineReceivedAmountDisplay.value = formatCurrencyInput(parsed);
};

const onInlineReceivedAmountBlur = () => {
  inlineReceivedAmountDisplay.value = formatCurrencyInput(
    inlineReceiptForm.paidAmount,
  );
};

const formatDateDisplay = (value?: string | null) => {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
};

const formatDateTimeDisplay = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
};

const normalizeOptionalText = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toDatePickerValue = (rawDate?: string) => {
  if (!rawDate) {
    return Date.now();
  }

  const date = new Date(`${rawDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return Date.now();
  }

  return date.getTime();
};

const isOverdue = (row: AccountReceivableItem) => {
  const due = new Date(`${row.dueDate}T00:00:00`);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  return row.status === 'PENDING' && due.valueOf() < currentDate.valueOf();
};

const getEffectiveStatus = (row: AccountReceivableItem): FinancialStatus => {
  if (row.status === 'PAID') return 'PAID';
  if (isOverdue(row)) return 'OVERDUE';
  return 'PENDING';
};

const getCalculatedStatus = (
  baseStatus: string,
  dueDateMs: number,
  hasReceipt: boolean,
): FinancialStatus => {
  if (baseStatus === 'PAID' || hasReceipt) return 'PAID';
  const due = new Date(dueDateMs);
  due.setHours(0, 0, 0, 0);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  return due.valueOf() < currentDate.valueOf() ? 'OVERDUE' : 'PENDING';
};

const modalCurrentStatus = computed<FinancialStatus>(() =>
  getCalculatedStatus(
    modalBaseStatus.value,
    Number(createForm.dueDate),
    modalHadReceipt.value,
  ),
);

const isManagedBySale = computed(
  () => createForm.originType === 'SALE' || linkedSaleId.value !== null,
);

const primaryActionLabel = computed(() => {
  if (isManagedBySale.value) {
    return linkedSaleId.value ? 'Abrir venda' : 'Fechar';
  }

  if (editingAccountId.value && showInlineReceiptForm.value) {
    return 'Salvar e registrar recebimento';
  }

  return editingAccountId.value ? 'Salvar alterações' : 'Criar conta';
});

const primaryActionDisabled = computed(() => {
  if (isManagedBySale.value) {
    return !linkedSaleId.value;
  }

  if (editingAccountId.value && showInlineReceiptForm.value) {
    return savingInlineReceipt.value;
  }

  return saving.value;
});

const primaryActionLoading = computed(() => {
  if (editingAccountId.value && showInlineReceiptForm.value) {
    return savingInlineReceipt.value;
  }
  return saving.value;
});

const statusLabel = (status: FinancialStatus) => {
  const labels: Record<FinancialStatus, string> = {
    PENDING: 'Pendente',
    PAID: 'Recebido',
    OVERDUE: 'Atrasado',
  };
  return labels[status];
};

const statusBadgeClass = (status: FinancialStatus) => {
  const classes: Record<FinancialStatus, string> = {
    PENDING: 'badge-soft-warning',
    PAID: 'badge-soft-success',
    OVERDUE: 'badge-soft-danger',
  };
  return classes[status];
};

const originLabelFromValue = (
  originType?: string | null,
  saleId?: number | null,
) => {
  if (originType === 'SALE' || saleId) {
    return saleId ? `Venda #${saleId}` : 'Venda';
  }
  return 'Manual';
};

const originLabel = (row: AccountReceivableItem) =>
  originLabelFromValue(row.originType, row.saleId);

const filteredReceivables = computed(() => {
  let data = [...receivables.value];
  const term = filters.search.trim().toLowerCase();

  if (term) {
    data = data.filter((row) => {
      const description = (row.description || '').toLowerCase();
      const client = (row.client?.name || '').toLowerCase();
      const sale = row.saleId ? String(row.saleId) : '';
      return (
        description.includes(term)
        || client.includes(term)
        || sale.includes(term)
      );
    });
  }

  if (filters.clientId) {
    data = data.filter((row) => Number(row.clientId) === Number(filters.clientId));
  }

  if (filters.originType !== 'ALL') {
    data = data.filter((row) => {
      const origin = (row.originType || (row.saleId ? 'SALE' : 'MANUAL')) as AccountOrigin;
      return origin === filters.originType;
    });
  }

  if (filters.status === 'OVERDUE') {
    data = data.filter((row) => getEffectiveStatus(row) === 'OVERDUE');
  } else if (filters.status !== 'ALL') {
    data = data.filter((row) => getEffectiveStatus(row) === filters.status);
  }

  if (filters.dueDateRange?.[0]) {
    const from = new Date(filters.dueDateRange[0]);
    from.setHours(0, 0, 0, 0);
    data = data.filter((row) => {
      const due = new Date(`${row.dueDate}T00:00:00`);
      return due.valueOf() >= from.valueOf();
    });
  }

  if (filters.dueDateRange?.[1]) {
    const to = new Date(filters.dueDateRange[1]);
    to.setHours(0, 0, 0, 0);
    data = data.filter((row) => {
      const due = new Date(`${row.dueDate}T00:00:00`);
      return due.valueOf() <= to.valueOf();
    });
  }

  return data;
});

const paginatedReceivables = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize;
  return filteredReceivables.value.slice(start, start + pagination.pageSize);
});

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.pageSize,
  itemCount: filteredReceivables.value.length,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
}));

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.search.trim()
    || filters.dueDateRange?.[0] !== defaultDueDateFrom
    || filters.dueDateRange?.[1] !== defaultDueDateTo
    || filters.clientId !== null
    || filters.originType !== 'ALL'
    || filters.status !== 'ALL',
  );
});

const filteredSummary = computed(() => {
  return filteredReceivables.value.reduce(
    (acc, row) => {
      const status = getEffectiveStatus(row);
      const amount = Number(row.amount || 0);
      acc.expectedTotal += amount;
      if (status === 'PAID') acc.totalPaid += Number(row.paidAmount || row.amount || 0);
      if (status === 'PENDING') acc.totalPending += amount;
      if (status === 'OVERDUE') acc.totalOverdue += amount;
      return acc;
    },
    { expectedTotal: 0, totalPending: 0, totalPaid: 0, totalOverdue: 0 },
  );
});

const openSale = (saleId?: number | null) => {
  if (!saleId) return;
  router.push(`/financeiro/vendas/${saleId}`);
};

const columns = [
  { title: 'Descrição', key: 'description' },
  {
    title: 'Cliente',
    key: 'client',
    render(row: AccountReceivableItem) {
      return row.client?.name || 'Sem cliente';
    },
  },
  {
    title: 'Origem',
    key: 'originType',
    render(row: AccountReceivableItem) {
      return originLabel(row);
    },
  },
  {
    title: 'Vencimento',
    key: 'dueDate',
    render(row: AccountReceivableItem) {
      return formatDateDisplay(row.dueDate);
    },
  },
  {
    title: 'Valor',
    key: 'amount',
    align: 'right',
    titleAlign: 'right',
    render(row: AccountReceivableItem) {
      return h('span', { class: 'amount-cell' }, formatCurrency(Number(row.amount)));
    },
  },
  {
    title: 'Status',
    key: 'status',
    render(row: AccountReceivableItem) {
      const status = getEffectiveStatus(row);
      return h(
        NTag,
        { bordered: false, class: ['status-chip', statusBadgeClass(status)] },
        { default: () => statusLabel(status) },
      );
    },
  },
  {
    title: 'Ações',
    key: 'actions',
    render(row: AccountReceivableItem) {
      return h('div', { class: 'data-table__actions' }, [
        h(
          'div',
          {
            onClick: (event: MouseEvent) => event.stopPropagation(),
            onMousedown: (event: MouseEvent) => event.stopPropagation(),
          },
          [
            h(
              NButton,
              {
                size: 'small',
                secondary: true,
                type: 'primary',
                onClick: (event: MouseEvent) => {
                  event.stopPropagation();
                  openEditModal(row);
                },
              },
              { default: () => 'Ver conta' },
            ),
          ],
        ),
        h(
          'div',
          {
            onClick: (event: MouseEvent) => event.stopPropagation(),
            onMousedown: (event: MouseEvent) => event.stopPropagation(),
          },
          [
            h(
              NDropdown,
              {
                trigger: 'click',
                options: buildActionOptions(row),
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
                      onClick: (event: MouseEvent) => event.stopPropagation(),
                      onMousedown: (event: MouseEvent) => event.stopPropagation(),
                    },
                    { default: () => '⋯' },
                  ),
              },
            ),
          ],
        ),
      ]);
    },
  },
];

const tableRowProps = (row: AccountReceivableItem) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => openEditModal(row),
  };
};

const buildActionOptions = (row: AccountReceivableItem) => {
  const options: Array<{ label: string; key: string }> = [
    { label: row.saleId ? 'Visualizar' : 'Editar', key: 'edit' },
  ];

  if (!row.saleId && getEffectiveStatus(row) !== 'PAID') {
    options.push({ label: 'Registrar recebimento', key: 'receive' });
    options.push({ label: 'Duplicar', key: 'duplicate' });
  }

  if (row.saleId) {
    options.push({ label: `Abrir venda #${row.saleId}`, key: 'open-sale' });
  }

  return options;
};

const handleActionSelect = (key: string, row: AccountReceivableItem) => {
  if (key === 'edit') {
    openEditModal(row);
    return;
  }

  if (key === 'receive') {
    openEditModal(row, { openReceipt: true });
    return;
  }

  if (key === 'duplicate') {
    openDuplicateModal(row);
    return;
  }

  if (key === 'open-sale') {
    openSale(row.saleId);
  }
};

const ensureSelectedClientOption = (clientId: number | null, name?: string) => {
  if (!clientId) return;

  const exists = clientOptions.value.some((opt) => opt.value === clientId);
  if (!exists) {
    clientOptions.value = [
      { label: name || `Cliente ${clientId}`, value: clientId },
      ...clientOptions.value,
    ];
  }
};

const fetchClients = async (search?: string) => {
  clientLoading.value = true;
  const api = useApi();

  try {
    const response = await api<any>('/api/v1/clients', {
      query: {
        limit: 20,
        ...(search ? { name: search } : {}),
      },
    });

    const clients = (response.data || []) as ClientListItem[];

    clientOptions.value = clients.map((client) => ({
      label: client.name,
      value: Number(client.id),
    }));

    ensureSelectedClientOption(createForm.clientId);
    ensureSelectedClientOption(filters.clientId);
  } catch (_err) {
    message.error('Erro ao carregar clientes');
  } finally {
    clientLoading.value = false;
  }
};

const onClientSearch = (value: string) => {
  fetchClients(value || undefined);
};

const ensureClientsLoaded = () => {
  if (!clientOptions.value.length && !clientLoading.value) {
    fetchClients();
  }
};

const fetchPaymentMethods = async () => {
  paymentMethodLoading.value = true;
  const api = useApi();

  try {
    const response = await api<any>('/api/v1/payment-methods', {
      query: {
        limit: 100,
      },
    });

    const methods = ((response.data || []) as Array<{
      id: number;
      name: string;
      isActive?: boolean;
    }>).filter((method) => method.isActive !== false);

    paymentMethodOptions.value = methods.map((method) => ({
      label: method.name,
      value: Number(method.id),
    }));
  } catch (_err) {
    message.error('Erro ao carregar formas de pagamento');
  } finally {
    paymentMethodLoading.value = false;
  }
};

const fetchReceivables = async () => {
  loading.value = true;

  try {
    const api = useApi();
    const response = await api('/api/v1/accounts-receivable');
    receivables.value = ((response as any).data || []) as AccountReceivableItem[];

    if (
      pagination.page > 1
      && (pagination.page - 1) * pagination.pageSize >= filteredReceivables.value.length
    ) {
      pagination.page = 1;
    }
  } catch (_err) {
    message.error('Erro ao carregar dados');
  } finally {
    loading.value = false;
  }
};

const resetCreateForm = () => {
  createForm.description = '';
  createForm.clientId = null;
  createForm.originType = 'MANUAL';
  createForm.amount = 0;
  createForm.dueDate = Date.now();
  createForm.notes = '';
  createForm.documentUrl = '';
  editingOriginalNotes.value = null;
  editingOriginalDocumentUrl.value = null;
  linkedSaleId.value = null;
  modalBaseStatus.value = 'PENDING';
  modalHadReceipt.value = false;
  amountDisplay.value = formatCurrencyInput(0);
  showInlineReceiptForm.value = false;
  inlineReceiptForm.paidAt = Date.now();
  inlineReceiptForm.paidAmount = 0;
  inlineReceiptForm.paymentMethodId = null;
  inlineReceiptForm.note = '';
  inlineReceivedAmountDisplay.value = formatCurrencyInput(0);
  registeredReceipt.paidAt = null;
  registeredReceipt.paidAmount = null;
  registeredReceipt.paymentMethodName = null;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  editingAccountId.value = null;
  resetCreateForm();
};

const openCreateModal = () => {
  editingAccountId.value = null;
  resetCreateForm();
  showCreateModal.value = true;
  ensureClientsLoaded();
};

const openDuplicateModal = (row: AccountReceivableItem) => {
  editingAccountId.value = null;
  linkedSaleId.value = null;
  createForm.description = row.description || '';
  createForm.clientId = row.clientId || row.client?.id || null;
  createForm.originType = 'MANUAL';
  createForm.amount = Number(row.amount || 0);
  createForm.dueDate = Date.now();
  createForm.notes = row.notes || '';
  createForm.documentUrl = row.documentUrl || '';
  editingOriginalNotes.value = null;
  editingOriginalDocumentUrl.value = null;
  modalBaseStatus.value = 'PENDING';
  modalHadReceipt.value = false;
  amountDisplay.value = formatCurrencyInput(createForm.amount);
  showInlineReceiptForm.value = false;
  registeredReceipt.paidAt = null;
  registeredReceipt.paidAmount = null;
  registeredReceipt.paymentMethodName = null;

  ensureSelectedClientOption(createForm.clientId, row.client?.name);
  showCreateModal.value = true;
  ensureClientsLoaded();
};

const openEditModal = (
  row: AccountReceivableItem,
  options?: { openReceipt?: boolean },
) => {
  editingAccountId.value = Number(row.id);
  linkedSaleId.value =
    row.saleId != null
      ? Number(row.saleId)
      : row.sale?.id != null
        ? Number(row.sale.id)
        : null;
  createForm.description = row.description || '';
  createForm.clientId =
    row.clientId != null
      ? Number(row.clientId)
      : row.client?.id != null
        ? Number(row.client.id)
        : null;
  createForm.originType = (row.originType || (linkedSaleId.value ? 'SALE' : 'MANUAL')) as AccountOrigin;
  createForm.amount = Number(row.amount || 0);
  createForm.dueDate = toDatePickerValue(row.dueDate);
  createForm.notes = row.notes || '';
  createForm.documentUrl = row.documentUrl || '';
  editingOriginalNotes.value = normalizeOptionalText(row.notes);
  editingOriginalDocumentUrl.value = normalizeOptionalText(row.documentUrl);
  modalBaseStatus.value = row.status || 'PENDING';
  modalHadReceipt.value = Boolean(row.paidAt || row.paidAmount);
  amountDisplay.value = formatCurrencyInput(createForm.amount);
  registeredReceipt.paidAt = row.paidAt || null;
  registeredReceipt.paidAmount =
    row.paidAmount != null ? Number(row.paidAmount) : null;
  registeredReceipt.paymentMethodName = row.paymentMethod?.name || null;
  showInlineReceiptForm.value = Boolean(
    options?.openReceipt
      && !isManagedBySale.value
      && modalCurrentStatus.value !== 'PAID',
  );
  inlineReceiptForm.paidAt = Date.now();
  inlineReceiptForm.paidAmount = Number(row.amount || 0);
  inlineReceiptForm.paymentMethodId = row.paymentMethodId
    ? Number(row.paymentMethodId)
    : null;
  inlineReceiptForm.note = '';
  inlineReceivedAmountDisplay.value = formatCurrencyInput(
    inlineReceiptForm.paidAmount,
  );

  ensureSelectedClientOption(createForm.clientId, row.client?.name);
  showCreateModal.value = true;
  ensureClientsLoaded();
};

const handleSubmitAccount = async () => {
  if (!createForm.description || !createForm.amount || !createForm.dueDate) {
    message.error('Preencha os campos obrigatórios');
    return;
  }

  saving.value = true;
  const api = useApi();

  try {
    const normalizedNotes = normalizeOptionalText(createForm.notes);
    const normalizedDocumentUrl = normalizeOptionalText(createForm.documentUrl);
    const payload: Record<string, unknown> = {
      description: createForm.description,
      clientId: createForm.clientId ? Number(createForm.clientId) : undefined,
      amount: createForm.amount,
      dueDate: new Date(createForm.dueDate).toISOString().split('T')[0],
      notes: normalizedNotes,
      documentUrl: normalizedDocumentUrl,
    };

    if (!payload.clientId) {
      delete payload.clientId;
    }

    if (editingAccountId.value) {
      if (normalizedNotes === editingOriginalNotes.value) {
        delete payload.notes;
      }
      if (normalizedDocumentUrl === editingOriginalDocumentUrl.value) {
        delete payload.documentUrl;
      }

      await api(`/api/v1/accounts-receivable/${editingAccountId.value}`, {
        method: 'PATCH',
        body: payload,
      });
      message.success('Conta atualizada com sucesso!');
    } else {
      await api('/api/v1/accounts-receivable', {
        method: 'POST',
        body: payload,
      });
      message.success('Conta criada com sucesso!');
    }

    closeCreateModal();
    await fetchReceivables();
  } catch (_err) {
    message.error('Erro ao salvar conta');
  } finally {
    saving.value = false;
  }
};

const openInlineReceiptForm = () => {
  inlineReceiptForm.paidAt = Date.now();
  inlineReceiptForm.paidAmount = Number(createForm.amount || 0);
  inlineReceiptForm.paymentMethodId = paymentMethodOptions.value[0]?.value || null;
  inlineReceiptForm.note = '';
  inlineReceivedAmountDisplay.value = formatCurrencyInput(
    inlineReceiptForm.paidAmount,
  );
  showInlineReceiptForm.value = true;
};

const collapseInlineReceiptForm = () => {
  showInlineReceiptForm.value = false;
};

const handlePrimaryModalAction = async () => {
  if (isManagedBySale.value) {
    openSale(linkedSaleId.value);
    return;
  }

  if (editingAccountId.value && showInlineReceiptForm.value) {
    await confirmInlineReceipt();
    return;
  }

  await handleSubmitAccount();
};

const confirmInlineReceipt = async () => {
  if (!editingAccountId.value) return;
  if (
    !inlineReceiptForm.paidAt
    || !inlineReceiptForm.paidAmount
    || !inlineReceiptForm.paymentMethodId
  ) {
    message.error('Preencha os campos obrigatórios do recebimento');
    return;
  }

  if (
    Math.abs(Number(inlineReceiptForm.paidAmount) - Number(createForm.amount))
    > 0.0001
  ) {
    message.error('Recebimento parcial ainda não é suportado. Informe o valor total da conta.');
    return;
  }

  savingInlineReceipt.value = true;
  const api = useApi();

  try {
    await api(`/api/v1/accounts-receivable/${editingAccountId.value}/receive`, {
      method: 'PATCH',
      body: {
        paidAt: new Date(inlineReceiptForm.paidAt).toISOString(),
        paidAmount: inlineReceiptForm.paidAmount,
        paymentMethodId: inlineReceiptForm.paymentMethodId,
        note: inlineReceiptForm.note.trim() || undefined,
      },
    });

    modalBaseStatus.value = 'PAID';
    modalHadReceipt.value = true;
    registeredReceipt.paidAt = new Date(inlineReceiptForm.paidAt).toISOString();
    registeredReceipt.paidAmount = inlineReceiptForm.paidAmount;
    registeredReceipt.paymentMethodName =
      paymentMethodOptions.value.find(
        (option) => option.value === inlineReceiptForm.paymentMethodId,
      )?.label || null;
    showInlineReceiptForm.value = false;
    message.success('Recebimento registrado!');
    await fetchReceivables();
  } catch (_err) {
    message.error('Erro ao registrar recebimento');
  } finally {
    savingInlineReceipt.value = false;
  }
};

const handleUndoInlineReceipt = async () => {
  if (!editingAccountId.value || isManagedBySale.value) return;
  savingInlineReceipt.value = true;
  const api = useApi();

  try {
    await api(`/api/v1/accounts-receivable/${editingAccountId.value}/undo-receive`, {
      method: 'PATCH',
    });
    modalBaseStatus.value = 'PENDING';
    modalHadReceipt.value = false;
    registeredReceipt.paidAt = null;
    registeredReceipt.paidAmount = null;
    registeredReceipt.paymentMethodName = null;
    message.success('Recebimento estornado');
    await fetchReceivables();
  } catch (_err) {
    message.error('Erro ao estornar recebimento');
  } finally {
    savingInlineReceipt.value = false;
  }
};

const handleFilter = () => {
  if (!filters.dueDateRange || !filters.dueDateRange[0] || !filters.dueDateRange[1]) {
    message.error('Selecione o período de vencimento completo');
    return;
  }
  if (filters.dueDateRange[0] > filters.dueDateRange[1]) {
    message.error('Data inicial do período não pode ser maior que a final');
    return;
  }
  pagination.page = 1;
};

const handleClearFilters = () => {
  filters.search = '';
  filters.dueDateRange = [defaultDueDateFrom, defaultDueDateTo];
  filters.clientId = null;
  filters.originType = 'ALL';
  filters.status = 'ALL';
  pagination.page = 1;
};

const applyMobileFilters = () => {
  showMobileFilters.value = false;
  handleFilter();
};

const onPageChange = (page: number) => {
  pagination.page = page;
};

const onPageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
};

watch(
  () => filters.search,
  () => {
    pagination.page = 1;
  },
);

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)');
  updateIsMobile();
  mediaQuery.addEventListener('change', updateIsMobile);
  fetchClients();
  fetchPaymentMethods();
  fetchReceivables();
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

.page-header,
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

.summary-card-warning {
  border-color: #fdecc8;
  background: #fffdf6;
}

.summary-card-success {
  border-color: #d1fae5;
  background: #f7fef9;
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

.filters-grid-finance {
  grid-template-columns: 2fr 1.35fr repeat(3, minmax(0, 1fr)) auto;
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

:deep(.n-data-table) {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.n-data-table-th) {
  font-weight: 600;
  color: #374151;
  background: #f8fafc;
}

:deep(.n-data-table-td) {
  background: #ffffff;
  padding-top: 5px !important;
  padding-bottom: 5px !important;
  line-height: 1.15;
}

:deep(.n-data-table-tr:hover td) {
  background: #f8fafc;
}

:deep(.n-data-table-th),
:deep(.n-data-table-td) {
  white-space: nowrap;
  word-break: normal;
}

:deep(.n-data-table .n-data-table__pagination),
:deep(.n-data-table .n-data-table-pagination) {
  min-height: 40px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.data-table__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-cell {
  font-weight: 600;
  color: #0f172a;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}

.badge-soft-warning {
  color: #9a6700;
  background: #fff7e6;
  border: 1px solid #fdecc8;
}

.badge-soft-success {
  color: #166534;
  background: #ecfdf3;
  border: 1px solid #d1fae5;
}

.badge-soft-danger {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
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

:deep(.status-chip.badge-soft-danger.n-tag) {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
}

.empty-state h3 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  max-width: 520px;
}

.empty-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
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
  background: #ffffff;
}

:deep(.mobile-filter-trigger.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}

.mobile-filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-record-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.mobile-record-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.card-value-line {
  margin-top: 6px;
}

.card-line-label {
  color: #64748b;
}

.card-line-value {
  color: #0f172a;
  font-weight: 500;
}

.financial-value {
  font-weight: 700;
}

.card-actions {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.overdue-value {
  color: #b91c1c;
  font-weight: 700;
}

.is-overdue {
  color: #b91c1c;
}

.mobile-primary-cta {
  margin-top: -6px;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
}

.section-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.section-head .section-title {
  margin-bottom: 0;
}

.overdue-hint,
.origin-hint {
  margin: -6px 0 0;
  font-size: 12px;
  line-height: 1.4;
}

.overdue-hint {
  color: #b45309;
}

.origin-hint {
  color: #475569;
}

.payment-inline-area {
  margin-top: 8px;
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
}

.payment-form-inline {
  margin-top: 8px;
}

.payment-form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.payment-form-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.payment-form-status-impact {
  margin: 0 0 10px;
  font-size: 12px;
  color: #64748b;
}

.payment-registered-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
}

.payment-registered-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.payment-registered-card p {
  margin: 4px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.full-row {
  grid-column: 1 / -1;
}

.modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 1440px) {
  .filters-grid-finance {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .page-header,
  .page-head {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}
</style>

<style>
:root .n-modal-container:has(.accounts-receivable-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.accounts-receivable-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.accounts-receivable-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.accounts-receivable-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.accounts-receivable-modal.n-card {
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

.accounts-receivable-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.accounts-receivable-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 112px;
  scroll-padding-bottom: 136px;
}

.accounts-receivable-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}
</style>
