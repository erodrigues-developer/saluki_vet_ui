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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, h, resolveComponent, onMounted } from 'vue';
import { NButton, NSpace, NTag, useMessage } from 'naive-ui';
import SaleForm from '~/components/sales/SaleForm.vue';
import { format } from 'date-fns';

const message = useMessage();
const loading = ref(false);
const data = ref([]);
const showModal = ref(false);
const selectedSale = ref(null);
const modalTitle = ref('Nova Venda');
const isReadonly = ref(false);

const dateRange = ref<[number, number] | null>(null);

const filters = ref({
  status: null,
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
    width: 150,
    render(row: any) {
      return h(NSpace, {}, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              onClick: () => openViewModal(row),
            },
            { default: () => 'Ver / Editar' }
          )
        ],
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

    const response = await $fetch('/api/v1/sales', { params });
    data.value = response.data;
    pagination.value.itemCount = response.total;
  } catch (error: any) {
    message.error('Erro ao carregar vendas');
  } finally {
    loading.value = false;
  }
};

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
  // need to fetch complete sale with items
  try {
    const fullSale = await $fetch(`/api/v1/sales/${sale.id}`);
    selectedSale.value = fullSale;
    isReadonly.value = fullSale.status !== 'OPEN'; // If it's paid or canceled, only view
    modalTitle.value = isReadonly.value ? `Detalhes da Venda #${fullSale.id}` : `Editar Venda #${fullSale.id}`;
    showModal.value = true;
  } catch(e) {
    message.error("Erro ao carregar detalhes da venda");
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
