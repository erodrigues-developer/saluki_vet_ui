<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Cadastros</p>
        <h1>Produtos e Serviços</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Novo Item
      </n-button>
    </div>

    <!-- Filtros -->
    <n-card :bordered="false" size="small" style="margin-bottom: 16px;">
      <n-form inline :show-feedback="false">
        <n-form-item label="Nome">
          <n-input v-model:value="filters.name" placeholder="Buscar por nome" clearable @keyup.enter="handleFilter" />
        </n-form-item>
        <n-form-item label="SKU">
          <n-input v-model:value="filters.sku" placeholder="Buscar por SKU" clearable @keyup.enter="handleFilter" />
        </n-form-item>
        <n-form-item label="Tipo">
          <n-select v-model:value="filters.isService" :options="typeOptions" placeholder="Todos" clearable style="width: 150px" @update:value="handleFilter" />
        </n-form-item>
        <n-form-item>
          <n-button @click="handleFilter" type="info" secondary>Filtrar</n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div v-for="item in products" :key="item.id" class="entity-card" @click="openEdit(item)">
        <p class="card-title">{{ item.name }}</p>
        <p class="card-subtitle">SKU {{ item.sku || '-' }}</p>
        <p class="card-subtitle">Preço {{ item.salePrice !== undefined && item.salePrice !== null ? `R$ ${Number(item.salePrice).toFixed(2)}` : '-' }}</p>
        <div class="card-actions">
          <n-tag :type="item.isService ? 'info' : 'primary'" :bordered="false" size="small">{{ item.isService ? 'Serviço' : 'Produto' }}</n-tag>
          <n-button size="small" tertiary type="error" @click.stop="confirmDelete(item)">Excluir</n-button>
        </div>
      </div>
    </div>

    <div v-else class="table-mobile-wrapper">
      <n-data-table
        :loading="loading"
        :columns="columns"
        :data="products"
        :pagination="pagination"
        :bordered="false"
        :row-props="rowProps"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        remote
      />
    </div>

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      class="product-modal"
      style="width: 600px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingProduct ? 'Editar produto / serviço' : 'Novo produto / serviço' }}</h3>
          <p class="modal-subtitle">
            {{ editingProduct ? 'Atualize dados, tipo e status do item.' : 'Cadastre um novo produto ou serviço para o catálogo da clínica.' }}
          </p>
        </div>
      </template>
      <ProductForm
        ref="productFormRef"
        :value="editingProduct"
        :loading="saving"
        @submit="handleSubmit"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitProductForm">
            {{ editingProduct ? 'Salvar alterações' : 'Criar produto / serviço' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NTag, useMessage, useDialog } from 'naive-ui'
import ProductForm, { type Product } from '~/components/products/ProductForm.vue'

const message = useMessage()
const dialog = useDialog()

const products = ref<Product[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingProduct = ref<Product | null>(null)
const productFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const filters = reactive({
  name: '',
  sku: '',
  isService: null
})

const typeOptions = [
  { label: 'Produto', value: 'false' },
  { label: 'Serviço', value: 'true' }
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const columns = [
  { title: 'SKU', key: 'sku' },
  { title: 'Nome', key: 'name' },
  {
    title: 'Categoria',
    key: 'productCategory.name',
    render: (row: any) => row.productCategory?.name || '-'
  },
  {
    title: 'Preço de Venda',
    key: 'salePrice',
    render: (row: Product) => row.salePrice !== undefined && row.salePrice !== null ? `R$ ${Number(row.salePrice).toFixed(2)}` : '-'
  },
  {
    title: 'Tipo',
    key: 'isService',
    render: (row: Product) =>
      h(NTag, { type: row.isService ? 'info' : 'primary', bordered: false, size: 'small' }, { default: () => (row.isService ? 'Serviço' : 'Produto') })
  },
  {
    title: 'Estoque',
    key: 'currentStock',
    render: (row: any) => row.trackStock ? Number(row.currentStock ?? 0).toFixed(3) : '-'
  },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: Product) =>
      h(NTag, { type: row.isActive ? 'success' : 'error', bordered: false, size: 'small' }, { default: () => (row.isActive ? 'Ativo' : 'Inativo') })
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 100,
    render: (row: Product) =>
      h('div', { class: 'actions', style: 'justify-content: flex-end;' }, [
        h(NButton, {
          size: 'small',
          tertiary: true,
          type: 'error',
          onClick: (e) => {
            e.stopPropagation()
            confirmDelete(row)
          }
        }, { default: () => 'Excluir' })
      ])
  }
]

const fetchProducts = async () => {
  loading.value = true
  try {
    const queryParams: any = {
      page: pagination.page,
      limit: pagination.pageSize
    }
    if (filters.name) queryParams.name = filters.name
    if (filters.sku) queryParams.sku = filters.sku
    if (filters.isService !== null) queryParams.isService = filters.isService

    const api = useApi()
    const res = await api<any>('/api/v1/products', {
      query: queryParams
    })
    products.value = res.data
    pagination.itemCount = res.meta.total
  } catch (err) {
    message.error('Erro ao buscar produtos e serviços')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  pagination.page = 1
  fetchProducts()
}

const handlePageChange = (p: number) => {
  pagination.page = p
  fetchProducts()
}

const handlePageSizeChange = (s: number) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchProducts()
}

const handleSubmit = async (payload: Product) => {
  saving.value = true
  const api = useApi()
  try {
    if (payload.id) {
      await api(`/api/v1/products/${payload.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Item atualizado')
    } else {
      await api('/api/v1/products', {
        method: 'POST',
        body: payload
      })
      message.success('Item criado')
    }
    closeModal()
    fetchProducts()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar item')
  } finally {
    saving.value = false
  }
}

const submitProductForm = async () => {
  await productFormRef.value?.submit()
}

const confirmDelete = (product: Product) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o item ${product.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/products/${product.id}`, { method: 'DELETE' })
        message.success('Item excluído')
        fetchProducts()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir item')
      }
    }
  })
}

const openCreate = () => {
  editingProduct.value = null
  showModal.value = true
}

const openEdit = (product: Product) => {
  editingProduct.value = product
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const rowProps = (row: Product) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  fetchProducts()
})
onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateIsMobile)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: center; }
.eyebrow { font-size: 12px; color: #6b7280; text-transform: uppercase; margin: 0; }
h1 { margin: 4px 0 0; font-size: 24px; }
.actions { display: flex; gap: 8px; }

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

@media (max-width: 768px) {
  .card-list { display: flex; flex-direction: column; gap: 12px; }
  .entity-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fff; }
  .card-title { margin: 0; font-size: 16px; font-weight: 700; }
  .card-subtitle { margin: 4px 0 0; font-size: 12px; color: #64748b; }
  .card-actions { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>

<style>
:root .n-modal-container:has(.product-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.product-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.product-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.product-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.product-modal.n-card {
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

.product-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.product-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.product-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .product-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .product-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .product-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .product-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }
}
</style>
