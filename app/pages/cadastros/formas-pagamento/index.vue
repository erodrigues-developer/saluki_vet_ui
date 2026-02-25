<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Formas de Pagamento</h1>
      <n-button type="primary" @click="openCreateModal">
        Nova Forma de Pagamento
      </n-button>
    </div>

    <n-card class="mb-6">
      <n-space>
        <n-input
          v-model:value="searchQuery"
          placeholder="Buscar por nome..."
          clearable
          @keyup.enter="handleSearch"
        />
        <n-button type="primary" @click="handleSearch">Buscar</n-button>
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

    <n-modal v-model:show="showModal" preset="card" :title="modalTitle" class="w-full max-w-md">
      <PaymentMethodForm
        v-if="showModal"
        :initial-data="selectedPaymentMethod"
        @saved="handleSaved"
        @cancel="showModal = false"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, resolveComponent } from 'vue';
import { NButton, NSpace, NTag, NPopconfirm, useMessage } from 'naive-ui';
import PaymentMethodForm from '~/components/payment-methods/PaymentMethodForm.vue';
import { format } from 'date-fns';

const message = useMessage();
const loading = ref(false);
const data = ref([]);
const searchQuery = ref('');
const showModal = ref(false);
const selectedPaymentMethod = ref(null);
const modalTitle = ref('Nova Forma de Pagamento');

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
});

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: 'Nome',
    key: 'name',
  },
  {
    title: 'Código',
    key: 'code',
  },
  {
    title: 'Status',
    key: 'isActive',
    render(row: any) {
      return h(
        resolveComponent('NTag'),
        {
          type: row.isActive ? 'success' : 'error',
          bordered: false,
        },
        { default: () => (row.isActive ? 'Ativo' : 'Inativo') }
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
              onClick: () => openEditModal(row),
            },
            { default: () => 'Editar' }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleDelete(row.id),
            },
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'error',
                  },
                  { default: () => 'Excluir' }
                ),
              default: () => 'Tem certeza que deseja excluir esta forma de pagamento?',
            }
          ),
        ],
      });
    },
  },
];

const fetchPaymentMethods = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/v1/payment-methods', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
        q: searchQuery.value || undefined,
      },
    });
    data.value = response.data;
    pagination.value.itemCount = response.total;
  } catch (error: any) {
    message.error('Erro ao carregar formas de pagamento');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchPaymentMethods();
};

const handleSearch = () => {
  pagination.value.page = 1;
  fetchPaymentMethods();
};

const openCreateModal = () => {
  selectedPaymentMethod.value = null;
  modalTitle.value = 'Nova Forma de Pagamento';
  showModal.value = true;
};

const openEditModal = (paymentMethod: any) => {
  selectedPaymentMethod.value = paymentMethod;
  modalTitle.value = 'Editar Forma de Pagamento';
  showModal.value = true;
};

const handleDelete = async (id: number) => {
  try {
    await $fetch(`/api/v1/payment-methods/${id}`, {
      method: 'DELETE',
    });
    message.success('Forma de Pagamento excluída com sucesso');
    fetchPaymentMethods();
  } catch (error) {
    message.error('Erro ao excluir forma de pagamento');
  }
};

const handleSaved = () => {
  showModal.value = false;
  fetchPaymentMethods();
};

onMounted(() => {
  fetchPaymentMethods();
});
</script>
