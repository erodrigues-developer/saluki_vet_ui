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
        <p class="summary-label">Total do mês</p>
        <strong class="summary-value">{{ formatCurrency(dashboardData?.kpis?.expectedTotal || 0) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-warning">
        <p class="summary-label">Pendente</p>
        <strong class="summary-value">{{ formatCurrency(dashboardData?.kpis?.totalPending || 0) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-success">
        <p class="summary-label">Pago</p>
        <strong class="summary-value">{{ formatCurrency(dashboardData?.kpis?.totalPaid || 0) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-danger">
        <p class="summary-label">Atrasado</p>
        <strong class="summary-value">{{ formatCurrency(dashboardData?.kpis?.totalOverdue || 0) }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile summary-grid">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Total do mês</p>
        <strong class="summary-value-mobile">{{ formatCurrency(dashboardData?.kpis?.expectedTotal || 0) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-warning">
        <p class="summary-label">Pendente</p>
        <strong class="summary-value-mobile">{{ formatCurrency(dashboardData?.kpis?.totalPending || 0) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-success">
        <p class="summary-label">Pago</p>
        <strong class="summary-value-mobile">{{ formatCurrency(dashboardData?.kpis?.totalPaid || 0) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card summary-card-danger">
        <p class="summary-label">Atrasado</p>
        <strong class="summary-value-mobile">{{ formatCurrency(dashboardData?.kpis?.totalOverdue || 0) }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid filters-grid-finance">
        <n-input v-model:value="filters.search" placeholder="Buscar por descrição ou fornecedor" clearable />
        <n-select v-model:value="filters.month" :options="monthOptions" placeholder="Mês" />
        <n-select v-model:value="filters.year" :options="yearOptions" placeholder="Ano" />
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
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">🔎 Filtros</n-button>
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
            <p class="card-subtitle"><span class="card-line-label">Fornecedor: </span><span class="card-line-value">{{ row.supplier?.name || '-' }}</span></p>
            <p class="card-subtitle"><span class="card-line-label">Categoria: </span><span class="card-line-value">{{ row.category || '-' }}</span></p>
            <p class="card-subtitle" :class="{ 'is-overdue': getEffectiveStatus(row) === 'OVERDUE' }">
              <span class="card-line-label">{{ getEffectiveStatus(row) === 'OVERDUE' ? 'Vencido em: ' : 'Vencimento: ' }}</span>
              <span :class="['card-line-value', { 'overdue-value': getEffectiveStatus(row) === 'OVERDUE' }]">{{ formatDateDisplay(row.dueDate) }}</span>
            </p>
            <p class="card-subtitle card-value-line"><span class="card-line-label">Valor: </span><span class="card-line-value financial-value">{{ formatCurrency(Number(row.amount)) }}</span></p>
            <div class="card-actions">
              <n-button size="small" secondary type="primary" @click="openEditModal(row)">Ver conta</n-button>
              <n-dropdown trigger="click" :options="buildActionOptions(row)" @select="(key: string) => handleActionSelect(key, row)">
                <n-button size="small" quaternary class="menu-button">•••</n-button>
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
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </template>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="52%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.month" :options="monthOptions" placeholder="Mês" />
          <n-select v-model:value="filters.year" :options="yearOptions" placeholder="Ano" />
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
      :title="editingAccountId ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'"
      style="width: 600px"
    >
      <n-form :model="createForm" ref="createFormRef" :rules="createRules">
        <n-form-item label="Descrição" path="description">
          <n-input v-model:value="createForm.description" placeholder="Ex: Aluguel" />
        </n-form-item>
        <n-form-item label="Fornecedor" path="supplierId">
          <n-select
            v-model:value="createForm.supplierId"
            :options="supplierOptions"
            placeholder="Selecione o fornecedor"
            filterable
            remote
            clearable
            :loading="supplierLoading"
            @search="onSupplierSearch"
            @focus="ensureSuppliersLoaded"
          />
        </n-form-item>
        <n-form-item label="Categoria" path="category">
          <n-select
            v-model:value="createForm.category"
            :options="categoryOptions.filter((o) => o.value !== 'Todas as categorias')"
          />
        </n-form-item>
        <n-grid :cols="2" x-gap="12">
          <n-grid-item>
            <n-form-item label="Valor (R$)" path="amount">
              <n-input-number
                v-model:value="createForm.amount"
                :min="0"
                :precision="2"
                clearable
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="Data de Vencimento" path="dueDate">
              <n-date-picker
                v-model:value="createForm.dueDate"
                type="date"
                clearable
                style="width: 100%"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="Anotações" path="notes">
          <n-input type="textarea" v-model:value="createForm.notes" />
        </n-form-item>
        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <n-button @click="closeCreateModal" style="margin-right: 8px;">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="handleSubmitAccount">
            Salvar
          </n-button>
        </div>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showPayModal"
      preset="card"
      title="Registrar Pagamento"
      style="width: 400px"
    >
      <n-form :model="payForm">
        <n-form-item label="Data de Pagamento">
          <n-date-picker
            v-model:value="payForm.paidAt"
            type="date"
            clearable
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="Valor Pago (R$)">
          <n-input-number
            v-model:value="payForm.paidAmount"
            :min="0"
            :precision="2"
            clearable
          />
        </n-form-item>
        <n-form-item label="Forma de Pagamento">
          <n-select v-model:value="payForm.paymentMethod" :options="paymentMethodOptions" />
        </n-form-item>
        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <n-button @click="showPayModal = false" style="margin-right: 8px;">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="handlePay">Confirmar</n-button>
        </div>
      </n-form>
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

interface AccountPayableItem {
  id: number;
  description: string;
  supplierId?: number | null;
  supplier?: SupplierListItem | null;
  category?: string | null;
  amount: number;
  dueDate: string;
  status: string;
  paidAmount?: number | null;
  notes?: string | null;
}

type FinancialStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED';

const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const showCreateModal = ref(false);
const showPayModal = ref(false);
const showMobileFilters = ref(false);
const createFormRef = ref();
const editingAccountId = ref<number | null>(null);
const editingOriginalNotes = ref<string | null>(null);

const payables = ref<AccountPayableItem[]>([]);
const dashboardData = ref<any>(null);
const selectedAccount = ref<AccountPayableItem | null>(null);
const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false; };

const pagination = reactive({
  page: 1,
  pageSize: 10,
});

const supplierOptions = ref<{ label: string; value: number }[]>([]);
const supplierLoading = ref(false);

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

const filters = reactive({
  search: '',
  month: currentMonth,
  year: currentYear,
  category: 'Todas as categorias',
  status: 'ALL',
});

const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: monthNames[i],
  value: i + 1,
}));
const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map((y) => ({
  label: y.toString(),
  value: y,
}));
const categoryOptions = [
  { label: 'Todas as categorias', value: 'Todas as categorias' },
  { label: 'Custos Fixos', value: 'Custos Fixos' },
  { label: 'Fornecedores', value: 'Fornecedores' },
  { label: 'Impostos', value: 'Impostos' },
  { label: 'Folha de Pagamento', value: 'Folha de Pagamento' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Outros', value: 'Outros' },
];

const paymentMethodOptions = [
  { label: 'PIX', value: 'PIX' },
  { label: 'Transferência Bancária', value: 'BANK_TRANSFER' },
  { label: 'Boleto', value: 'BOLETO' },
  { label: 'Dinheiro', value: 'CASH' },
];

const statusOptions = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Pago', value: 'PAID' },
  { label: 'Atrasado', value: 'OVERDUE' },
  { label: 'Cancelado', value: 'CANCELED' },
];

const createForm = reactive({
  description: '',
  supplierId: null as number | null,
  category: 'Custos Fixos',
  amount: 0,
  dueDate: Date.now(),
  notes: '',
});

const payForm = reactive({
  paidAt: Date.now(),
  paidAmount: 0,
  paymentMethod: 'PIX',
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

const formatDateDisplay = (value?: string | null) => {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
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

const filteredPayables = computed(() => {
  let data = [...payables.value];
  const term = filters.search.trim().toLowerCase();

  if (term) {
    data = data.filter((row) => {
      const description = (row.description || '').toLowerCase();
      const supplier = (row.supplier?.name || '').toLowerCase();
      return description.includes(term) || supplier.includes(term);
    });
  }

  if (filters.status === 'OVERDUE') {
    data = data.filter((row) => getEffectiveStatus(row) === 'OVERDUE');
  } else if (filters.status !== 'ALL') {
    data = data.filter((row) => getEffectiveStatus(row) === filters.status);
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
    || filters.month !== currentMonth
    || filters.year !== currentYear
    || filters.category !== 'Todas as categorias'
    || filters.status !== 'ALL',
  );
});

const columns = [
  { title: 'Descrição', key: 'description' },
  {
    title: 'Fornecedor',
    key: 'supplier',
    render(row: AccountPayableItem) {
      return row.supplier?.name || '-';
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
          NButton,
          {
            size: 'small',
            secondary: true,
            type: 'primary',
            onClick: () => openEditModal(row),
          },
          { default: () => 'Ver conta' },
        ),
        h(
          NDropdown,
          {
            trigger: 'click',
            options: buildActionOptions(row),
            onSelect: (key: string) => handleActionSelect(key, row),
          },
          {
            default: () => h(NButton, { size: 'small', quaternary: true, class: 'menu-button' }, { default: () => '•••' }),
          },
        ),
      ]);
    },
  },
];

const buildActionOptions = (row: AccountPayableItem) => {
  const options: Array<{ label: string; key: string }> = [
    { label: 'Editar', key: 'edit' },
  ];

  if (getEffectiveStatus(row) !== 'PAID') {
    options.push({ label: 'Marcar como paga', key: 'pay' });
  }

  options.push({ label: 'Duplicar', key: 'duplicate' });
  return options;
};

const handleActionSelect = (key: string, row: AccountPayableItem) => {
  if (key === 'edit') {
    openEditModal(row);
    return;
  }

  if (key === 'pay') {
    openPayModal(row);
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
    const query = new URLSearchParams({
      month: filters.month.toString(),
      year: filters.year.toString(),
    });

    if (filters.category !== 'Todas as categorias') {
      query.set('category', filters.category);
    }

    const statusForBackend = filters.status === 'OVERDUE' ? 'PENDING' : filters.status;

    if (statusForBackend !== 'ALL') {
      query.set('status', statusForBackend);
    }

    const api = useApi();
    const [listRes, dashRes] = await Promise.all([
      api(`/api/v1/accounts-payable?${query.toString()}`),
      api(`/api/v1/accounts-payable/dashboard?${query.toString()}`),
    ]);

    payables.value = ((listRes as any).data || []) as AccountPayableItem[];
    dashboardData.value = (dashRes as any).data || null;

    if (pagination.page > 1 && (pagination.page - 1) * pagination.pageSize >= filteredPayables.value.length) {
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
  createForm.supplierId = null;
  createForm.category = 'Custos Fixos';
  createForm.amount = 0;
  createForm.dueDate = Date.now();
  createForm.notes = '';
  editingOriginalNotes.value = null;
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

const openEditModal = (row: AccountPayableItem) => {
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
  editingOriginalNotes.value = normalizeOptionalNote(row.notes);

  ensureSelectedSupplierOption(createForm.supplierId, row.supplier?.name);

  showCreateModal.value = true;
  ensureSuppliersLoaded();
};

const handleSubmitAccount = async () => {
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

    if (editingAccountId.value) {
      if (normalizedNotes !== editingOriginalNotes.value) {
        payload.notes = normalizedNotes;
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

const openPayModal = (row: AccountPayableItem) => {
  selectedAccount.value = row;
  payForm.paidAmount = Number(row.amount);
  payForm.paidAt = Date.now();
  showPayModal.value = true;
};

const handlePay = async () => {
  if (!selectedAccount.value) return;

  saving.value = true;
  const api = useApi();

  try {
    await api(`/api/v1/accounts-payable/${selectedAccount.value.id}/pay`, {
      method: 'PATCH',
      body: {
        paidAt: new Date(payForm.paidAt).toISOString(),
        paidAmount: payForm.paidAmount,
        paymentMethod: payForm.paymentMethod,
      },
    });

    message.success('Pagamento registrado!');
    showPayModal.value = false;
    fetchPayables();
  } catch (_err) {
    message.error('Erro ao registrar pagamento');
  } finally {
    saving.value = false;
  }
};

const handleFilter = () => {
  pagination.page = 1;
  fetchPayables();
};

const handleClearFilters = () => {
  filters.search = '';
  filters.month = currentMonth;
  filters.year = currentYear;
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

watch(() => filters.search, () => {
  pagination.page = 1;
});

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)');
  updateIsMobile();
  mediaQuery.addEventListener('change', updateIsMobile);
  fetchSuppliers();
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
  font-size: 28px;
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
  grid-template-columns: 2fr repeat(4, minmax(0, 1fr)) auto;
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
</style>
