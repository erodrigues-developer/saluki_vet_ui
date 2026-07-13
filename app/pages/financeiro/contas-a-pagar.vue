<template>
  <div class="page">
    <div class="page-header page-head">
      <div class="head-copy">
        <p class="eyebrow">FINANCEIRO</p>
        <h1>Contas a pagar</h1>
        <p class="subhead">Gerencie despesas, vencimentos, pagamentos e pendências financeiras.</p>
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
        <p class="summary-label">Pago</p>
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
        <p class="summary-label">Pago</p>
        <strong class="summary-value-mobile">{{ formatCurrency(filteredSummary.totalPaid) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-danger">
        <p class="summary-label">Atrasado</p>
        <strong class="summary-value-mobile">{{ formatCurrency(filteredSummary.totalOverdue) }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-finance">
        <n-input v-model:value="filters.search" placeholder="Buscar por descrição ou fornecedor" clearable />
        <n-date-picker
          v-model:value="filters.dueDateRange"
          type="daterange"
          format="dd/MM/yyyy"
          clearable
          start-placeholder="Período de vencimento"
          end-placeholder="Período de vencimento"
        />
        <n-select v-model:value="filters.category" :options="categoryOptions" placeholder="Categoria" />
        <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Status" />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar despesa ou fornecedor" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <template v-if="isMobile">
      <template v-if="!filteredPayables.length && !loading">
        <div class="data-table-card empty-state">
          <h3>{{ hasActiveFilters ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada' }}</h3>
          <p>
            {{ hasActiveFilters
              ? 'Não encontramos despesas para os filtros selecionados.'
              : 'Adicione sua primeira conta para acompanhar vencimentos e pagamentos.' }}
          </p>
          <div class="empty-actions">
            <n-button v-if="hasActiveFilters" tertiary @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="openCreateModal">Adicionar conta</n-button>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="mobile-list card-list">
          <div v-for="row in paginatedPayables" :key="row.id" class="mobile-record-card entity-card">
            <div class="mobile-record-top">
              <p class="card-title">{{ row.description }}</p>
              <span :class="['badge', statusBadgeClass(getEffectiveStatus(row))]">{{ statusLabel(getEffectiveStatus(row)) }}</span>
            </div>
            <p class="card-subtitle"><span class="card-line-label">Favorecido: </span><span class="card-line-value">{{ resolvePayeeName(row) }}</span></p>
            <p class="card-subtitle"><span class="card-line-label">Categoria: </span><span class="card-line-value">{{ row.category || '-' }}</span></p>
            <p v-if="row.recurrenceId" class="card-subtitle"><span class="card-line-label">Recorrência: </span><span class="card-line-value">{{ recurrenceSummary(row) }}</span></p>
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
      <div v-if="!filteredPayables.length && !loading" class="data-table-card empty-state">
        <h3>{{ hasActiveFilters ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada' }}</h3>
        <p>
          {{ hasActiveFilters
            ? 'Não encontramos despesas para os filtros selecionados.'
            : 'Adicione sua primeira conta para acompanhar vencimentos e pagamentos.' }}
        </p>
        <div class="empty-actions">
          <n-button v-if="hasActiveFilters" tertiary @click="handleClearFilters">Limpar filtros</n-button>
          <n-button type="primary" @click="openCreateModal">Adicionar conta</n-button>
        </div>
      </div>
      <n-data-table
        v-else
        :columns="columns"
        :data="filteredPayables"
        :loading="loading"
        :pagination="tablePagination"
        :bordered="false"
        :row-props="tableRowProps"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </template>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="52%" :trap-focus="false">
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
          <n-select v-model:value="filters.category" :options="categoryOptions" placeholder="Categoria" />
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
      class="accounts-payable-modal"
      :mask-closable="false"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingAccountId ? 'Editar conta a pagar' : 'Nova conta a pagar' }}</h3>
          <p class="modal-subtitle">Informe os dados da despesa, vencimento e pagamento.</p>
        </div>
      </template>
      <n-form :model="createForm" ref="createFormRef" :rules="createRules" label-placement="top" :show-require-mark="false">
        <div class="sections">
          <section class="form-section">
            <h4 class="section-title">Dados da conta</h4>
            <div class="form-grid">
              <n-form-item label="Descrição *" path="description" required>
                <n-input v-model:value="createForm.description" placeholder="Ex: Aluguel" :disabled="isGeneratedCommissionAccount" />
              </n-form-item>
              <n-form-item label="Fornecedor *" path="supplierId" required>
                <n-select
                  v-model:value="createForm.supplierId"
                  :options="supplierOptions"
                  placeholder="Selecione o fornecedor"
                  filterable
                  remote
                  clearable
                  :loading="supplierLoading"
                  :disabled="isGeneratedCommissionAccount"
                  @search="onSupplierSearch"
                  @focus="ensureSuppliersLoaded"
                />
              </n-form-item>
              <n-form-item label="Categoria" path="category">
                <n-select
                  v-model:value="createForm.category"
                  :options="categoryOptions.filter((o) => o.value !== 'Todas as categorias')"
                  :disabled="isGeneratedCommissionAccount"
                />
              </n-form-item>
            </div>
          </section>

          <section class="form-section">
            <div class="section-head">
              <h4 class="section-title">Financeiro</h4>
              <n-tag :bordered="false" class="status-chip" :class="statusBadgeClass(modalCurrentStatus)">
                {{ statusLabel(modalCurrentStatus) }}
              </n-tag>
            </div>
            <div class="form-grid">
              <n-form-item label="Valor *" path="amount" required>
                <n-input
                  v-model:value="amountDisplay"
                  placeholder="R$ 0,00"
                  :disabled="isGeneratedCommissionAccount"
                  @update:value="onAmountInput"
                  @blur="onAmountBlur"
                />
              </n-form-item>
              <n-form-item label="Data de vencimento *" path="dueDate" required>
                <n-date-picker
                  v-model:value="createForm.dueDate"
                  type="date"
                  clearable
                  :disabled="isGeneratedCommissionAccount"
                  style="width: 100%"
                />
              </n-form-item>
              <p v-if="modalCurrentStatus === 'OVERDUE'" class="overdue-hint full-row">
                Esta conta está vencida e ainda não possui pagamento registrado.
              </p>
            </div>
            <div v-if="editingAccountId" class="payment-inline-area">
              <div v-if="modalCurrentStatus === 'PAID'" class="payment-registered-card">
                <p class="payment-registered-title">Pagamento registrado</p>
                <p><span class="card-line-label">Data de pagamento: </span><span class="card-line-value">{{ formatDateTimeDisplay(registeredPayment.paidAt) }}</span></p>
                <p><span class="card-line-label">Valor pago: </span><span class="card-line-value">{{ formatCurrency(Number(registeredPayment.paidAmount || 0)) }}</span></p>
                <p><span class="card-line-label">Forma de pagamento: </span><span class="card-line-value">{{ registeredPayment.paymentMethod || '-' }}</span></p>
                <n-button size="small" tertiary @click="handleUndoInlinePayment">Estornar pagamento</n-button>
              </div>

              <template v-else>
                <n-button
                  v-if="!showInlinePaymentForm"
                  size="small"
                  secondary
                  type="primary"
                  @click="openInlinePaymentForm"
                >
                  Registrar pagamento
                </n-button>

                <div v-else class="payment-form-inline">
                  <div class="payment-form-head">
                    <p class="payment-form-title">Registrar pagamento</p>
                    <n-button text class="btn-clear" @click="collapseInlinePaymentForm">Ocultar pagamento</n-button>
                  </div>
                  <p class="payment-form-status-impact">Ao confirmar, esta conta será marcada como Paga.</p>
                  <div class="form-grid">
                    <n-form-item label="Data de pagamento *">
                      <n-date-picker v-model:value="inlinePayForm.paidAt" type="date" clearable style="width: 100%" />
                    </n-form-item>
                    <n-form-item label="Valor pago *">
                      <n-input
                        v-model:value="inlinePaidAmountDisplay"
                        placeholder="R$ 0,00"
                        @update:value="onInlinePaidAmountInput"
                        @blur="onInlinePaidAmountBlur"
                      />
                    </n-form-item>
                    <n-form-item label="Forma de pagamento *">
                      <n-select v-model:value="inlinePayForm.paymentMethodId" :options="paymentMethodOptions" />
                    </n-form-item>
                    <n-form-item label="Observação do pagamento" class="full-row">
                      <n-input v-model:value="inlinePayForm.note" type="textarea" :rows="2" />
                    </n-form-item>
                  </div>
                </div>
              </template>
            </div>
          </section>

          <section v-if="!isGeneratedCommissionAccount" class="form-section">
            <div class="section-head">
              <h4 class="section-title">Recorrência</h4>
              <n-tag v-if="createForm.recurrenceEnabled" :bordered="false" class="status-chip badge-soft-neutral">
                Série ativa
              </n-tag>
            </div>
            <div class="form-grid">
              <n-form-item label="Conta recorrente" class="full-row">
                <n-switch v-model:value="createForm.recurrenceEnabled" />
              </n-form-item>

              <template v-if="createForm.recurrenceEnabled">
                <n-form-item label="Periodicidade">
                  <n-select v-model:value="createForm.recurrenceFrequency" :options="recurrenceFrequencyOptions" />
                </n-form-item>
                <n-form-item label="A cada">
                  <n-input-number v-model:value="createForm.recurrenceIntervalCount" :min="1" :step="1" style="width: 100%" />
                </n-form-item>
                <n-form-item label="Data final da recorrência">
                  <n-date-picker v-model:value="createForm.recurrenceEndsAt" type="date" clearable style="width: 100%" />
                </n-form-item>
                <n-form-item label="Quantidade total de parcelas">
                  <n-input-number v-model:value="createForm.recurrenceOccurrencesLimit" :min="1" :step="1" clearable style="width: 100%" />
                </n-form-item>
                <n-form-item v-if="editingAccountId && createForm.recurrenceId" label="Aplicar alteração">
                  <n-select v-model:value="createForm.recurrenceUpdateScope" :options="recurrenceScopeOptions" />
                </n-form-item>
                <p class="helper-line full-row">
                  Use a data final quando souber até quando a cobrança vai existir, ou a quantidade total quando souber o número de parcelas. Se ambos forem preenchidos, vale o primeiro limite atingido.
                </p>
                <p class="helper-line full-row">
                  O sistema manterá parcelas futuras geradas automaticamente conforme a janela configurada na clínica.
                </p>
              </template>
            </div>
          </section>

          <section class="form-section">
            <h4 class="section-title">Observações</h4>
            <div class="form-grid">
              <n-form-item label="Anotações" path="notes" class="full-row">
                <n-input type="textarea" v-model:value="createForm.notes" :rows="3" :disabled="isGeneratedCommissionAccount" />
              </n-form-item>
            </div>
          </section>
        </div>
      </n-form>
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeCreateModal">Cancelar</n-button>
          <n-button type="primary" :loading="primaryActionLoading" @click="handlePrimaryModalAction">
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

interface SupplierListItem {
  id: number;
  name: string;
}

interface BeneficiaryUserListItem {
  id: number;
  name: string;
}

interface AccountPayableItem {
  id: number;
  description: string;
  supplierId?: number | null;
  supplier?: SupplierListItem | null;
  beneficiaryUserId?: number | null;
  beneficiaryUser?: BeneficiaryUserListItem | null;
  category?: string | null;
  amount: number;
  dueDate: string;
  status: string;
  paidAmount?: number | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentMethodId?: number | null;
  originType?: string | null;
  originReferenceId?: number | null;
  notes?: string | null;
  recurrenceId?: number | null;
  recurrenceSequence?: number | null;
  isRecurrenceGenerated?: boolean;
  recurrence?: {
    id: number;
    frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    intervalCount: number;
    endsAt?: string | null;
    occurrencesLimit?: number | null;
    isActive?: boolean;
  } | null;
}

type FinancialStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED';

const message = useMessage();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const savingInlinePayment = ref(false);
const showCreateModal = ref(false);
const showMobileFilters = ref(false);
const createFormRef = ref();
const editingAccountId = ref<number | null>(null);
const editingOriginalNotes = ref<string | null>(null);
const modalBaseStatus = ref<string>('PENDING');
const modalHadPayment = ref(false);
const modalOriginType = ref<string>('MANUAL');
const amountDisplay = ref('R$ 0,00');
const showInlinePaymentForm = ref(false);
const pendingAccountIdToOpen = ref<number | null>(
  route.query.accountId ? Number(route.query.accountId) : null,
);
const hasOpenedRouteAccount = ref(false);
const inlinePayForm = reactive({
  paidAt: Date.now(),
  paidAmount: 0,
  paymentMethodId: null as number | null,
  note: '',
});
const inlinePaidAmountDisplay = ref('R$ 0,00');
const registeredPayment = reactive<{
  paidAt: string | null;
  paidAmount: number | null;
  paymentMethod: string | null;
}>({
  paidAt: null,
  paidAmount: null,
  paymentMethod: null,
});

const payables = ref<AccountPayableItem[]>([]);
const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false; };

const pagination = reactive({
  page: 1,
  pageSize: 10,
});

const supplierOptions = ref<{ label: string; value: number }[]>([]);
const supplierLoading = ref(false);

const today = new Date();
today.setHours(0, 0, 0, 0);
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const defaultDueDateFrom = new Date(today.getTime() - THIRTY_DAYS_IN_MS).getTime();
const defaultDueDateTo = new Date(today.getTime() + THIRTY_DAYS_IN_MS).getTime();

const filters = reactive({
  search: '',
  dueDateRange: [defaultDueDateFrom, defaultDueDateTo] as [number, number] | null,
  category: 'Todas as categorias',
  status: 'ALL',
});

const categoryOptions = [
  { label: 'Todas as categorias', value: 'Todas as categorias' },
  { label: 'Custos Fixos', value: 'Custos Fixos' },
  { label: 'Fornecedores', value: 'Fornecedores' },
  { label: 'Impostos', value: 'Impostos' },
  { label: 'Folha de Pagamento', value: 'Folha de Pagamento' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Outros', value: 'Outros' },
];

const paymentMethodOptions = ref<Array<{ label: string; value: number }>>([]);

const statusOptions = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Pago', value: 'PAID' },
  { label: 'Atrasado', value: 'OVERDUE' },
  { label: 'Cancelado', value: 'CANCELED' },
];

const recurrenceFrequencyOptions = [
  { label: 'Semanal', value: 'WEEKLY' },
  { label: 'Mensal', value: 'MONTHLY' },
  { label: 'Anual', value: 'YEARLY' },
];

const recurrenceScopeOptions = [
  { label: 'Somente esta conta', value: 'THIS' },
  { label: 'Esta e próximas pendentes', value: 'THIS_AND_NEXT' },
];

const createForm = reactive({
  description: '',
  supplierId: null as number | null,
  category: 'Custos Fixos',
  amount: 0,
  dueDate: Date.now(),
  notes: '',
  recurrenceEnabled: false,
  recurrenceFrequency: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  recurrenceIntervalCount: 1,
  recurrenceEndsAt: null as number | null,
  recurrenceOccurrencesLimit: null as number | null,
  recurrenceId: null as number | null,
  recurrenceUpdateScope: 'THIS' as 'THIS' | 'THIS_AND_NEXT',
});

const createRules = {
  description: { required: true, message: 'Requerido', trigger: 'blur' },
  supplierId: {
    required: true,
    trigger: ['change', 'blur'],
    validator: (_rule: any, value: number | null) =>
      value ? true : new Error('Selecione um fornecedor'),
  },
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

const onInlinePaidAmountInput = (value: string) => {
  const parsed = parseCurrencyBr(value);
  inlinePayForm.paidAmount = parsed;
  inlinePaidAmountDisplay.value = formatCurrencyInput(parsed);
};

const onInlinePaidAmountBlur = () => {
  inlinePaidAmountDisplay.value = formatCurrencyInput(inlinePayForm.paidAmount);
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

const isOverdue = (row: AccountPayableItem) => {
  const due = new Date(`${row.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return row.status === 'PENDING' && due.valueOf() < today.valueOf();
};

const getEffectiveStatus = (row: AccountPayableItem): FinancialStatus => {
  if (row.status === 'PAID') return 'PAID';
  if (row.status === 'CANCELED') return 'CANCELED';
  if (isOverdue(row)) return 'OVERDUE';
  return 'PENDING';
};

const getCalculatedStatus = (
  baseStatus: string,
  dueDateMs: number,
  hasPayment: boolean,
): FinancialStatus => {
  if (baseStatus === 'CANCELED') return 'CANCELED';
  if (baseStatus === 'PAID' || hasPayment) return 'PAID';
  const due = new Date(dueDateMs);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.valueOf() < today.valueOf() ? 'OVERDUE' : 'PENDING';
};

const modalCurrentStatus = computed<FinancialStatus>(() =>
  getCalculatedStatus(modalBaseStatus.value, Number(createForm.dueDate), modalHadPayment.value),
);

const isGeneratedCommissionAccount = computed(
  () => editingAccountId.value !== null && modalOriginType.value === 'COMMISSION_PAYOUT',
);

const primaryActionLabel = computed(() => {
  if (editingAccountId.value && showInlinePaymentForm.value) {
    return 'Salvar e registrar pagamento';
  }
  if (isGeneratedCommissionAccount.value) {
    return 'Fechar';
  }
  return editingAccountId.value ? 'Salvar alterações' : 'Criar conta';
});

const primaryActionLoading = computed(() => {
  if (editingAccountId.value && showInlinePaymentForm.value) {
    return savingInlinePayment.value;
  }
  return saving.value;
});

const statusLabel = (status: FinancialStatus) => {
  const labels: Record<FinancialStatus, string> = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    OVERDUE: 'Atrasado',
    CANCELED: 'Cancelado',
  };
  return labels[status];
};

const statusBadgeClass = (status: FinancialStatus) => {
  const classes: Record<FinancialStatus, string> = {
    PENDING: 'badge-soft-warning',
    PAID: 'badge-soft-success',
    OVERDUE: 'badge-soft-danger',
    CANCELED: 'badge-soft-neutral',
  };
  return classes[status];
};

const resolvePayeeName = (row: AccountPayableItem) => {
  return row.supplier?.name || row.beneficiaryUser?.name || '-';
};

const recurrenceLabel = (frequency?: string | null) => {
  if (frequency === 'WEEKLY') return 'Semanal';
  if (frequency === 'YEARLY') return 'Anual';
  return 'Mensal';
};

const recurrenceSummary = (row: AccountPayableItem) => {
  if (!row.recurrenceId || !row.recurrence) return 'Recorrente';
  return `${recurrenceLabel(row.recurrence.frequency)} a cada ${row.recurrence.intervalCount || 1}`;
};

const filteredPayables = computed(() => {
  let data = [...payables.value];
  const term = filters.search.trim().toLowerCase();

  if (term) {
    data = data.filter((row) => {
      const description = (row.description || '').toLowerCase();
      const payee = resolvePayeeName(row).toLowerCase();
      return description.includes(term) || payee.includes(term);
    });
  }

  if (filters.category !== 'Todas as categorias') {
    data = data.filter((row) => (row.category || 'Outros') === filters.category);
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

const paginatedPayables = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize;
  return filteredPayables.value.slice(start, start + pagination.pageSize);
});

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.pageSize,
  itemCount: filteredPayables.value.length,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
}));

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.search.trim()
    || filters.dueDateRange?.[0] !== defaultDueDateFrom
    || filters.dueDateRange?.[1] !== defaultDueDateTo
    || filters.category !== 'Todas as categorias'
    || filters.status !== 'ALL',
  );
});

const filteredSummary = computed(() => {
  return filteredPayables.value.reduce(
    (acc, row) => {
      const status = getEffectiveStatus(row);
      const amount = Number(row.amount || 0);
      if (status !== 'CANCELED') acc.expectedTotal += amount;
      if (status === 'PAID') acc.totalPaid += Number(row.paidAmount || row.amount || 0);
      if (status === 'PENDING') acc.totalPending += amount;
      if (status === 'OVERDUE') acc.totalOverdue += amount;
      return acc;
    },
    { expectedTotal: 0, totalPending: 0, totalPaid: 0, totalOverdue: 0 },
  );
});

const columns = [
  { title: 'Descrição', key: 'description' },
  {
    title: 'Favorecido',
    key: 'supplier',
    render(row: AccountPayableItem) {
      return resolvePayeeName(row);
    },
  },
  { title: 'Categoria', key: 'category' },
  {
    title: 'Vencimento',
    key: 'dueDate',
    render(row: AccountPayableItem) {
      return formatDateDisplay(row.dueDate);
    },
  },
  {
    title: 'Valor',
    key: 'amount',
    align: 'right',
    titleAlign: 'right',
    render(row: AccountPayableItem) {
      return h('span', { class: 'amount-cell' }, formatCurrency(Number(row.amount)));
    },
  },
  {
    title: 'Status',
    key: 'status',
    render(row: AccountPayableItem) {
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
    render(row: AccountPayableItem) {
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

const tableRowProps = (row: AccountPayableItem) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => openEditModal(row),
  };
};

const buildActionOptions = (row: AccountPayableItem) => {
  const options: Array<{ label: string; key: string }> = [
    { label: 'Editar', key: 'edit' },
  ];

  if (getEffectiveStatus(row) !== 'PAID') {
    options.push({ label: 'Registrar pagamento', key: 'pay' });
  }

  if (row.originType !== 'COMMISSION_PAYOUT') {
    options.push({ label: 'Duplicar', key: 'duplicate' });
  }
  return options;
};

const handleActionSelect = (key: string, row: AccountPayableItem) => {
  if (key === 'edit') {
    openEditModal(row);
    return;
  }

  if (key === 'pay') {
    openEditModal(row, { openPayment: true });
    return;
  }

  if (key === 'duplicate') {
    openDuplicateModal(row);
  }
};

const openDuplicateModal = (row: AccountPayableItem) => {
  editingAccountId.value = null;
  createForm.description = row.description || '';
  createForm.supplierId = row.supplierId || row.supplier?.id || null;
  createForm.category = row.category || 'Outros';
  createForm.amount = Number(row.amount || 0);
  createForm.dueDate = Date.now();
  createForm.notes = row.notes || '';
  createForm.recurrenceEnabled = false;
  createForm.recurrenceFrequency = 'MONTHLY';
  createForm.recurrenceIntervalCount = 1;
  createForm.recurrenceEndsAt = null;
  createForm.recurrenceOccurrencesLimit = null;
  createForm.recurrenceId = null;
  createForm.recurrenceUpdateScope = 'THIS';
  editingOriginalNotes.value = null;

  ensureSelectedSupplierOption(createForm.supplierId, row.supplier?.name);
  showCreateModal.value = true;
  ensureSuppliersLoaded();
};

const ensureSelectedSupplierOption = (supplierId: number | null, name?: string) => {
  if (!supplierId) return;

  const exists = supplierOptions.value.some((opt) => opt.value === supplierId);

  if (!exists) {
    supplierOptions.value = [
      { label: name || `Fornecedor ${supplierId}`, value: supplierId },
      ...supplierOptions.value,
    ];
  }
};

const fetchSuppliers = async (search?: string) => {
  supplierLoading.value = true;
  const api = useApi();

  try {
    const response = await api<any>('/api/v1/suppliers', {
      query: {
        limit: 20,
        isActive: true,
        ...(search ? { search } : {}),
      },
    });

    const suppliers = (response.data || []) as SupplierListItem[];

    supplierOptions.value = suppliers.map((supplier) => ({
      label: supplier.name,
      value: Number(supplier.id),
    }));

    ensureSelectedSupplierOption(createForm.supplierId);
  } catch (_err) {
    message.error('Erro ao carregar fornecedores');
  } finally {
    supplierLoading.value = false;
  }
};

const fetchPaymentMethods = async () => {
  try {
    const api = useApi();
    const response = await api<any>('/api/v1/payment-methods', {
      query: {
        page: 1,
        limit: 100,
      },
    });

    const methods = (response.data || []) as Array<{
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

    if (!inlinePayForm.paymentMethodId && paymentMethodOptions.value.length) {
      inlinePayForm.paymentMethodId = paymentMethodOptions.value[0].value;
    }
  } catch (_err) {
    message.error('Erro ao carregar formas de pagamento');
  }
};

const onSupplierSearch = (value: string) => {
  fetchSuppliers(value || undefined);
};

const ensureSuppliersLoaded = () => {
  if (!supplierOptions.value.length && !supplierLoading.value) {
    fetchSuppliers();
  }
};

const fetchPayables = async () => {
  loading.value = true;

  try {
    const api = useApi();
    const [listRes] = await Promise.all([
      api('/api/v1/accounts-payable'),
    ]);

    payables.value = ((listRes as any).data || []) as AccountPayableItem[];
    if (pagination.page > 1 && (pagination.page - 1) * pagination.pageSize >= filteredPayables.value.length) {
      pagination.page = 1;
    }
    maybeOpenRouteAccount();
  } catch (_err) {
    message.error('Erro ao carregar dados');
  } finally {
    loading.value = false;
  }
};

const resetCreateForm = () => {
  createForm.description = '';
  createForm.supplierId = null;
  createForm.category = 'Custos Fixos';
  createForm.amount = 0;
  createForm.dueDate = Date.now();
  createForm.notes = '';
  createForm.recurrenceEnabled = false;
  createForm.recurrenceFrequency = 'MONTHLY';
  createForm.recurrenceIntervalCount = 1;
  createForm.recurrenceEndsAt = null;
  createForm.recurrenceOccurrencesLimit = null;
  createForm.recurrenceId = null;
  createForm.recurrenceUpdateScope = 'THIS';
  editingOriginalNotes.value = null;
  modalBaseStatus.value = 'PENDING';
  modalHadPayment.value = false;
  modalOriginType.value = 'MANUAL';
  amountDisplay.value = formatCurrencyInput(0);
  showInlinePaymentForm.value = false;
  inlinePayForm.paidAt = Date.now();
  inlinePayForm.paidAmount = 0;
  inlinePayForm.paymentMethodId = paymentMethodOptions.value[0]?.value ?? null;
  inlinePayForm.note = '';
  inlinePaidAmountDisplay.value = formatCurrencyInput(0);
  registeredPayment.paidAt = null;
  registeredPayment.paidAmount = null;
  registeredPayment.paymentMethod = null;
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
  ensureSuppliersLoaded();
};

const normalizeOptionalNote = (value?: string | null): string | null => {
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

const openEditModal = (row: AccountPayableItem, options?: { openPayment?: boolean }) => {
  editingAccountId.value = Number(row.id);
  createForm.description = row.description || '';
  createForm.supplierId =
    row.supplierId != null
      ? Number(row.supplierId)
      : row.supplier?.id != null
        ? Number(row.supplier.id)
        : null;
  createForm.category = row.category || 'Outros';
  createForm.amount = Number(row.amount || 0);
  createForm.dueDate = toDatePickerValue(row.dueDate);
  createForm.notes = row.notes || '';
  createForm.recurrenceEnabled = Boolean(row.recurrenceId);
  createForm.recurrenceFrequency = row.recurrence?.frequency || 'MONTHLY';
  createForm.recurrenceIntervalCount = Number(row.recurrence?.intervalCount || 1);
  createForm.recurrenceEndsAt = row.recurrence?.endsAt ? toDatePickerValue(row.recurrence.endsAt) : null;
  createForm.recurrenceOccurrencesLimit = row.recurrence?.occurrencesLimit != null
    ? Number(row.recurrence.occurrencesLimit)
    : null;
  createForm.recurrenceId = row.recurrenceId || null;
  createForm.recurrenceUpdateScope = 'THIS';
  editingOriginalNotes.value = normalizeOptionalNote(row.notes);
  modalBaseStatus.value = row.status || 'PENDING';
  modalHadPayment.value = Boolean(row.paidAt || row.paidAmount);
  modalOriginType.value = row.originType || 'MANUAL';
  amountDisplay.value = formatCurrencyInput(createForm.amount);
  registeredPayment.paidAt = row.paidAt || null;
  registeredPayment.paidAmount = row.paidAmount != null ? Number(row.paidAmount) : null;
  registeredPayment.paymentMethod = row.paymentMethod || null;
  showInlinePaymentForm.value = Boolean(options?.openPayment && modalCurrentStatus.value !== 'PAID');
  inlinePayForm.paidAt = Date.now();
  inlinePayForm.paidAmount = Number(row.amount || 0);
  inlinePayForm.paymentMethodId = row.paymentMethodId || paymentMethodOptions.value[0]?.value || null;
  inlinePayForm.note = '';
  inlinePaidAmountDisplay.value = formatCurrencyInput(inlinePayForm.paidAmount);

  ensureSelectedSupplierOption(createForm.supplierId, row.supplier?.name);

  showCreateModal.value = true;
  ensureSuppliersLoaded();
};

const handleSubmitAccount = async () => {
  if (isGeneratedCommissionAccount.value) {
    closeCreateModal();
    return;
  }
  if (
    !createForm.description
    || !createForm.supplierId
    || !createForm.amount
    || !createForm.dueDate
  ) {
    message.error('Preencha os campos obrigatórios');
    return;
  }

  saving.value = true;
  const api = useApi();

  try {
    const normalizedNotes = normalizeOptionalNote(createForm.notes);
    const payload: Record<string, unknown> = {
      description: createForm.description,
      supplierId: Number(createForm.supplierId),
      category: createForm.category,
      amount: createForm.amount,
      dueDate: new Date(createForm.dueDate).toISOString().split('T')[0],
    };

    if (createForm.recurrenceEnabled) {
      payload.recurrence = {
        enabled: true,
        frequency: createForm.recurrenceFrequency,
        intervalCount: Number(createForm.recurrenceIntervalCount || 1),
        endsAt: createForm.recurrenceEndsAt
          ? new Date(createForm.recurrenceEndsAt).toISOString().split('T')[0]
          : undefined,
        occurrencesLimit: createForm.recurrenceOccurrencesLimit || undefined,
      };
    } else if (editingAccountId.value && createForm.recurrenceId) {
      payload.recurrence = {
        enabled: false,
      };
    }

    if (editingAccountId.value) {
      if (normalizedNotes !== editingOriginalNotes.value) {
        payload.notes = normalizedNotes;
      }
      if (createForm.recurrenceId) {
        payload.scope = createForm.recurrenceUpdateScope;
      }

      await api(`/api/v1/accounts-payable/${editingAccountId.value}`, {
        method: 'PATCH',
        body: payload,
      });
      message.success('Conta atualizada com sucesso!');
    } else {
      payload.notes = normalizedNotes;

      await api('/api/v1/accounts-payable', {
        method: 'POST',
        body: payload,
      });
      message.success('Conta criada com sucesso!');
    }

    closeCreateModal();
    fetchPayables();
  } catch (_err) {
    message.error('Erro ao salvar conta');
  } finally {
    saving.value = false;
  }
};

const openInlinePaymentForm = () => {
  inlinePayForm.paidAt = Date.now();
  inlinePayForm.paidAmount = Number(createForm.amount || 0);
  inlinePayForm.paymentMethodId = paymentMethodOptions.value[0]?.value || null;
  inlinePayForm.note = '';
  inlinePaidAmountDisplay.value = formatCurrencyInput(inlinePayForm.paidAmount);
  showInlinePaymentForm.value = true;
};

const collapseInlinePaymentForm = () => {
  showInlinePaymentForm.value = false;
};

const cancelInlinePayment = () => {
  inlinePayForm.paidAt = Date.now();
  inlinePayForm.paidAmount = Number(createForm.amount || 0);
  inlinePayForm.paymentMethodId = paymentMethodOptions.value[0]?.value || null;
  inlinePayForm.note = '';
  inlinePaidAmountDisplay.value = formatCurrencyInput(inlinePayForm.paidAmount);
  showInlinePaymentForm.value = false;
};

const handlePrimaryModalAction = async () => {
  if (isGeneratedCommissionAccount.value && !showInlinePaymentForm.value) {
    closeCreateModal();
    return;
  }
  if (editingAccountId.value && showInlinePaymentForm.value) {
    await confirmInlinePayment();
    return;
  }
  await handleSubmitAccount();
};

const confirmInlinePayment = async () => {
  if (!editingAccountId.value) return;
  if (!inlinePayForm.paidAt || !inlinePayForm.paidAmount || !inlinePayForm.paymentMethodId) {
    message.error('Preencha os campos obrigatórios do pagamento');
    return;
  }
  if (Math.abs(Number(inlinePayForm.paidAmount) - Number(createForm.amount)) > 0.0001) {
    message.error('Pagamento parcial ainda não é suportado. Informe o valor total da conta.');
    return;
  }

  savingInlinePayment.value = true;
  const api = useApi();

  try {
    await api(`/api/v1/accounts-payable/${editingAccountId.value}/pay`, {
      method: 'PATCH',
      body: {
        paidAt: new Date(inlinePayForm.paidAt).toISOString(),
        paidAmount: inlinePayForm.paidAmount,
        paymentMethodId: inlinePayForm.paymentMethodId,
      },
    });

    if (inlinePayForm.note.trim()) {
      const mergedNote = [normalizeOptionalNote(createForm.notes), `[Pagamento] ${inlinePayForm.note.trim()}`]
        .filter(Boolean)
        .join('\n');
      await api(`/api/v1/accounts-payable/${editingAccountId.value}`, {
        method: 'PATCH',
        body: { notes: mergedNote },
      });
      createForm.notes = mergedNote;
    }

    modalBaseStatus.value = 'PAID';
    modalHadPayment.value = true;
    registeredPayment.paidAt = new Date(inlinePayForm.paidAt).toISOString();
    registeredPayment.paidAmount = inlinePayForm.paidAmount;
    registeredPayment.paymentMethod =
      paymentMethodOptions.value.find((option) => option.value === inlinePayForm.paymentMethodId)?.label || null;
    showInlinePaymentForm.value = false;
    message.success('Pagamento registrado!');
    await fetchPayables();
  } catch (_err) {
    message.error('Erro ao registrar pagamento');
  } finally {
    savingInlinePayment.value = false;
  }
};

const handleUndoInlinePayment = async () => {
  if (!editingAccountId.value) return;
  savingInlinePayment.value = true;
  const api = useApi();

  try {
    await api(`/api/v1/accounts-payable/${editingAccountId.value}/undo-pay`, {
      method: 'PATCH',
    });
    modalBaseStatus.value = 'PENDING';
    modalHadPayment.value = false;
    registeredPayment.paidAt = null;
    registeredPayment.paidAmount = null;
    registeredPayment.paymentMethod = null;
    message.success('Pagamento estornado');
    await fetchPayables();
  } catch (_err) {
    message.error('Erro ao estornar pagamento');
  } finally {
    savingInlinePayment.value = false;
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
  fetchPayables();
};

const handleClearFilters = () => {
  filters.search = '';
  filters.dueDateRange = [defaultDueDateFrom, defaultDueDateTo];
  filters.category = 'Todas as categorias';
  filters.status = 'ALL';
  pagination.page = 1;
  fetchPayables();
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

const maybeOpenRouteAccount = () => {
  const targetId = pendingAccountIdToOpen.value;
  if (!targetId || hasOpenedRouteAccount.value) {
    return;
  }

  const row = payables.value.find((item) => Number(item.id) === Number(targetId));
  if (!row) {
    return;
  }

  hasOpenedRouteAccount.value = true;
  openEditModal(row);
  pendingAccountIdToOpen.value = null;
  const nextQuery = { ...route.query };
  delete nextQuery.accountId;
  router.replace({ query: nextQuery });
};

watch(() => filters.search, () => {
  pagination.page = 1;
});

watch(
  () => route.query.accountId,
  (value) => {
    pendingAccountIdToOpen.value = value ? Number(value) : null;
    hasOpenedRouteAccount.value = false;
    maybeOpenRouteAccount();
  },
);

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)');
  updateIsMobile();
  mediaQuery.addEventListener('change', updateIsMobile);
  fetchSuppliers();
  fetchPaymentMethods();
  fetchPayables();
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
  grid-template-columns: 2fr 1.35fr repeat(2, minmax(0, 1fr)) auto;
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

.badge-soft-neutral {
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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

:deep(.status-chip.badge-soft-neutral.n-tag) {
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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

.overdue-hint {
  margin: -6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #b45309;
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

.helper-line {
  margin: -2px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #64748b;
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

@media (max-width: 1280px) {
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
:root .n-modal-container:has(.accounts-payable-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.accounts-payable-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.accounts-payable-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.accounts-payable-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.accounts-payable-modal.n-card {
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

.accounts-payable-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.accounts-payable-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 112px;
  scroll-padding-bottom: 136px;
}

.accounts-payable-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}
</style>
