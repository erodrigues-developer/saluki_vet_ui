<template>
  <div style="padding: 24px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h1>Contas a Pagar e Despesas</h1>
      <n-button type="primary" @click="showCreateModal = true">Nova Conta</n-button>
    </div>

    <!-- Filters -->
    <n-card style="margin-bottom: 24px;">
      <n-form inline :model="filters">
        <n-form-item label="Mês">
          <n-select v-model:value="filters.month" :options="monthOptions" style="width: 150px" />
        </n-form-item>
        <n-form-item label="Ano">
          <n-select v-model:value="filters.year" :options="yearOptions" style="width: 150px" />
        </n-form-item>
        <n-form-item label="Categoria">
          <n-select v-model:value="filters.category" :options="categoryOptions" style="width: 200px" />
        </n-form-item>
        <n-form-item label="Status">
          <n-select v-model:value="filters.status" :options="statusOptions" style="width: 180px" />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- KPIs -->
    <n-grid x-gap="12" :cols="4" style="margin-bottom: 24px;">
      <n-grid-item>
        <n-card title="Total Geral do Mês">
          <n-statistic>
            <span style="font-size: 24px; font-weight: bold;">{{ formatCurrency(dashboardData?.kpis?.expectedTotal || 0) }}</span>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="Total Pendente">
          <n-statistic>
            <span style="font-size: 24px; font-weight: bold; color: #f0a020;">{{ formatCurrency(dashboardData?.kpis?.totalPending || 0) }}</span>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="Total Pago">
          <n-statistic>
            <span style="font-size: 24px; font-weight: bold; color: #18a058;">{{ formatCurrency(dashboardData?.kpis?.totalPaid || 0) }}</span>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="Atrasado">
          <n-statistic>
            <span style="font-size: 24px; font-weight: bold; color: #d03050;">{{ formatCurrency(dashboardData?.kpis?.totalOverdue || 0) }}</span>
          </n-statistic>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- Table -->
    <n-card title="Lançamentos" style="margin-bottom: 24px;">
      <n-data-table
        :columns="columns"
        :data="payables"
        :loading="loading"
        :row-class-name="rowClassName"
      />
    </n-card>

    <!-- Create Modal -->
    <n-modal v-model:show="showCreateModal" preset="card" title="Nova Conta a Pagar" style="width: 600px">
      <n-form :model="createForm" ref="createFormRef" :rules="createRules">
        <n-form-item label="Descrição" path="description">
          <n-input v-model:value="createForm.description" placeholder="Ex: Aluguel" />
        </n-form-item>
        <n-form-item label="Fornecedor" path="supplierName">
          <n-input v-model:value="createForm.supplierName" placeholder="Ex: Imobiliária Silva" />
        </n-form-item>
        <n-form-item label="Categoria" path="category">
          <n-select v-model:value="createForm.category" :options="categoryOptions.filter(o => o.value !== 'Todas as Despesas')" />
        </n-form-item>
        <n-grid :cols="2" x-gap="12">
          <n-grid-item>
            <n-form-item label="Valor (R$)" path="amount">
              <n-input-number v-model:value="createForm.amount" :min="0" :precision="2" clearable />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="Data de Vencimento" path="dueDate">
              <n-date-picker v-model:value="createForm.dueDate" type="date" clearable style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="Anotações" path="notes">
          <n-input type="textarea" v-model:value="createForm.notes" />
        </n-form-item>
        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <n-button @click="showCreateModal = false" style="margin-right: 8px;">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="handleCreate">Salvar</n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- Pay Modal -->
    <n-modal v-model:show="showPayModal" preset="card" title="Informar Pagamento" style="width: 400px">
      <n-form :model="payForm">
        <n-form-item label="Data de Pagamento">
          <n-date-picker v-model:value="payForm.paidAt" type="date" clearable style="width: 100%" />
        </n-form-item>
        <n-form-item label="Valor Pago (R$)">
          <n-input-number v-model:value="payForm.paidAmount" :min="0" :precision="2" clearable />
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
import { ref, reactive, onMounted, watch, h } from 'vue';
import { useMessage, NButton, NTag, NSpace } from 'naive-ui';


definePageMeta({ layout: 'default' });

const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const showCreateModal = ref(false);
const showPayModal = ref(false);

const payables = ref([]);
const dashboardData = ref(null);
const selectedAccount = ref(null);

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

const filters = reactive({
  month: currentMonth,
  year: currentYear,
  category: 'Todas as Despesas',
  status: 'ALL',
});

const monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: `Mês ${i + 1}`, value: i + 1 }));
const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => ({ label: y.toString(), value: y }));
const categoryOptions = [
  { label: 'Todas as Despesas', value: 'Todas as Despesas' },
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
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Pagos', value: 'PAID' },
  { label: 'Atrasados', value: 'OVERDUE' },
];

const createForm = reactive({
  description: '',
  supplierName: '',
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
  amount: { type: 'number', required: true, message: 'Requerido', trigger: 'blur' },
  dueDate: { type: 'number', required: true, message: 'Requerido', trigger: 'blur' },
};

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const rowClassName = (row: any) => {
  const due = new Date(row.dueDate);
  due.setDate(due.getDate() + 1); // fix timezone offset
  const today = new Date();
  today.setHours(0,0,0,0);

  if (row.status === 'PENDING' && due.valueOf() < today.valueOf()) {
    return 'overdue-row';
  }
  return '';
};

const columns = [
  { title: 'Descrição', key: 'description' },
  { title: 'Fornecedor', key: 'supplierName' },
  { title: 'Categoria', key: 'category' },
  {
    title: 'Vencimento',
    key: 'dueDate',
    render(row: any) {
      const due = new Date(row.dueDate);
      due.setDate(due.getDate() + 1);
      return due.toLocaleDateString('pt-BR');
    }
  },
  {
    title: 'Valor',
    key: 'amount',
    render(row: any) { return formatCurrency(row.amount); }
  },
  {
    title: 'Status',
    key: 'status',
    render(row: any) {
      if (row.status === 'PAID') return h(NTag, { type: 'success' }, { default: () => 'PAGO' });

      const due = new Date(row.dueDate);
      due.setDate(due.getDate() + 1);
      const today = new Date();
      today.setHours(0,0,0,0);

      if (due.valueOf() < today.valueOf()) return h(NTag, { type: 'error' }, { default: () => 'ATRASADO' });
      return h(NTag, { type: 'warning' }, { default: () => 'PENDENTE' });
    }
  },
  {
    title: 'Ações',
    key: 'actions',
    render(row: any) {
      return h(NSpace, {}, {
        default: () => [
          row.status === 'PENDING'
            ? h(NButton, { size: 'small', type: 'primary', onClick: () => openPayModal(row) }, { default: () => 'Dar Baixa' })
            : h(NButton, { size: 'small', onClick: () => handleUndo(row) }, { default: () => 'Desfazer' })
        ]
      });
    }
  }
];

const fetchPayables = async () => {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      month: filters.month.toString(),
      year: filters.year.toString(),
    });
    if (filters.category !== 'Todas as Despesas') query.set('category', filters.category);
    if (filters.status !== 'ALL') query.set('status', filters.status);

    const api = useApi();
    const [listRes, dashRes] = await Promise.all([
      api(`/api/v1/accounts-payable?${query.toString()}`),
      api(`/api/v1/accounts-payable/dashboard?${query.toString()}`)
    ]);

    payables.value = (listRes as any).data || [];
    dashboardData.value = (dashRes as any).data || null;
  } catch (err) {
    message.error('Erro ao carregar dados');
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (!createForm.description || !createForm.amount || !createForm.dueDate) {
    message.error('Preencha os campos obrigatórios');
    return;
  }

  saving.value = true;
  const api = useApi();
  try {
    await api('/api/v1/accounts-payable', {
      method: 'POST',
      body: {
        ...createForm,
        dueDate: new Date(createForm.dueDate).toISOString().split('T')[0],
      }
    });
    message.success('Conta criada com sucesso!');
    showCreateModal.value = false;
    createForm.description = '';
    createForm.amount = 0;
    fetchPayables();
  } catch (err) {
    message.error('Erro ao salvar conta');
  } finally {
    saving.value = false;
  }
};

const openPayModal = (row: any) => {
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
      }
    });
    message.success('Pagamento registrado!');
    showPayModal.value = false;
    fetchPayables();
  } catch (err) {
    message.error('Erro ao registrar pagamento');
  } finally {
    saving.value = false;
  }
};

const handleUndo = async (row: any) => {
  if (!confirm('Deseja realmente desfazer este pagamento?')) return;
  const api = useApi();
  try {
    await api(`/api/v1/accounts-payable/${row.id}/undo-pay`, { method: 'PATCH' });
    message.success('Pagamento desfeito com sucesso!');
    fetchPayables();
  } catch (err) {
    message.error('Erro ao desfazer pagamento');
  }
};

watch(filters, fetchPayables, { deep: true });
onMounted(fetchPayables);



</script>

<style scoped>
:deep(.overdue-row td) {
  color: #d03050 !important;
  font-weight: 500;
}
</style>
