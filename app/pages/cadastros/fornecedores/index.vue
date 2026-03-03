<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Cadastros</p>
        <h1>Fornecedores</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Novo Fornecedor
      </n-button>
    </div>

    <n-card :bordered="false" size="small" style="margin-bottom: 16px;">
      <n-form inline :show-feedback="false">
        <n-form-item label="Busca">
          <n-input
            v-model:value="filters.search"
            placeholder="Nome, razão social ou documento"
            clearable
            @keyup.enter="handleFilter"
          />
        </n-form-item>
        <n-form-item label="Status">
          <n-select
            v-model:value="filters.isActive"
            :options="statusOptions"
            placeholder="Todos"
            clearable
            style="width: 150px"
            @update:value="handleFilter"
          />
        </n-form-item>
        <n-form-item>
          <n-button @click="handleFilter" type="info" secondary>Filtrar</n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="suppliers"
      :pagination="pagination"
      :bordered="false"
      :row-props="rowProps"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      remote
    />

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      style="width: 700px"
    >
      <template #header>
        <p class="eyebrow" style="margin: 0">
          {{ editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor' }}
        </p>
      </template>
      <SupplierForm
        :value="editingSupplier"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import { NButton, NTag, useDialog, useMessage } from 'naive-ui'
import SupplierForm, { type Supplier } from '~/components/suppliers/SupplierForm.vue'

const message = useMessage()
const dialog = useDialog()

const suppliers = ref<Supplier[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingSupplier = ref<Supplier | null>(null)

const filters = reactive({
  search: '',
  isActive: null as boolean | null
})

const statusOptions = [
  { label: 'Ativo', value: true },
  { label: 'Inativo', value: false }
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const columns = [
  { title: 'Nome', key: 'name' },
  {
    title: 'Razão Social',
    key: 'legalName',
    render: (row: Supplier) => row.legalName || '-'
  },
  {
    title: 'Documento',
    key: 'document',
    render: (row: Supplier) => row.document || '-'
  },
  {
    title: 'Contato',
    key: 'contact',
    render: (row: Supplier) => row.email || row.phone || '-'
  },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: Supplier) =>
      h(
        NTag,
        {
          type: row.isActive ? 'success' : 'error',
          bordered: false,
          size: 'small'
        },
        { default: () => (row.isActive ? 'Ativo' : 'Inativo') }
      )
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 100,
    render: (row: Supplier) =>
      h('div', { class: 'actions', style: 'justify-content: flex-end;' }, [
        h(
          NButton,
          {
            size: 'small',
            tertiary: true,
            type: row.isActive ? 'error' : 'success',
            onClick: (e: MouseEvent) => {
              e.stopPropagation()
              if (row.isActive) {
                confirmDeactivate(row)
                return
              }

              confirmReactivate(row)
            }
          },
          { default: () => (row.isActive ? 'Inativar' : 'Reativar') }
        )
      ])
  }
]

const fetchSuppliers = async () => {
  loading.value = true
  try {
    const api = useApi()
    const query: any = {
      page: pagination.page,
      limit: pagination.pageSize,
      ...(filters.search ? { search: filters.search } : {})
    }

    if (typeof filters.isActive === 'boolean') {
      query.isActive = filters.isActive
    }

    const res = await api<any>('/api/v1/suppliers', { query })
    suppliers.value = res.data
    pagination.itemCount = res.meta.total
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao buscar fornecedores')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  pagination.page = 1
  fetchSuppliers()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchSuppliers()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchSuppliers()
}

const handleSubmit = async (payload: Supplier) => {
  saving.value = true
  const api = useApi()

  try {
    const { id, ...body } = payload

    if (id) {
      await api(`/api/v1/suppliers/${id}`, {
        method: 'PATCH',
        body
      })
      message.success('Fornecedor atualizado')
    } else {
      await api('/api/v1/suppliers', {
        method: 'POST',
        body
      })
      message.success('Fornecedor criado')
    }

    closeModal()
    fetchSuppliers()
  } catch (err: any) {
    const apiMessage = Array.isArray(err?.data?.message)
      ? err.data.message.join(', ')
      : err?.data?.message

    message.error(apiMessage || 'Erro ao salvar fornecedor')
  } finally {
    saving.value = false
  }
}

const confirmDeactivate = (supplier: Supplier) => {
  if (!supplier.id) return

  dialog.warning({
    title: 'Confirmar inativação',
    content: `Deseja inativar o fornecedor ${supplier.name}?`,
    positiveText: 'Inativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/suppliers/${supplier.id}`, {
          method: 'DELETE'
        })
        message.success('Fornecedor inativado')
        fetchSuppliers()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao inativar fornecedor')
      }
    }
  })
}

const confirmReactivate = (supplier: Supplier) => {
  if (!supplier.id) return

  dialog.success({
    title: 'Confirmar reativação',
    content: `Deseja reativar o fornecedor ${supplier.name}?`,
    positiveText: 'Reativar',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/suppliers/${supplier.id}`, {
          method: 'PATCH',
          body: {
            isActive: true
          }
        })
        message.success('Fornecedor reativado')
        fetchSuppliers()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao reativar fornecedor')
      }
    }
  })
}

const openCreate = () => {
  editingSupplier.value = null
  showModal.value = true
}

const openEdit = (supplier: Supplier) => {
  editingSupplier.value = supplier
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const rowProps = (row: Supplier) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  fetchSuppliers()
})
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
  align-items: center;
}

.eyebrow {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0;
}

h1 {
  margin: 4px 0 0;
  font-size: 24px;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>
