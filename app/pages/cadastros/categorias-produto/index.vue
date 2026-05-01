<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Cadastros</p>
        <h1>Categorias de Produto</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Nova Categoria
      </n-button>
    </div>

    <div v-if="isMobile" class="card-list">
      <div v-for="item in categories" :key="item.id" class="entity-card" @click="openEdit(item)">
        <p class="card-title">{{ item.name }}</p>
        <p class="card-subtitle">{{ item.description || '-' }}</p>
        <div class="card-actions">
          <n-button size="small" tertiary type="error" @click.stop="confirmDelete(item)">Excluir</n-button>
        </div>
      </div>
    </div>

    <div v-else class="table-mobile-wrapper">
      <n-data-table
        :loading="loading"
        :columns="columns"
        :data="categories"
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
      style="width: 500px"
    >
      <template #header>
        <p class="eyebrow" style="margin: 0">{{ editingCategory ? 'Editar Categoria' : 'Nova Categoria' }}</p>
      </template>
      <ProductCategoryForm
        :value="editingCategory"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, useMessage, useDialog } from 'naive-ui'
import ProductCategoryForm, { type ProductCategory } from '~/components/product-categories/ProductCategoryForm.vue'

const message = useMessage()
const dialog = useDialog()

const categories = ref<ProductCategory[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingCategory = ref<ProductCategory | null>(null)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Nome', key: 'name' },
  { title: 'Descrição', key: 'description' },
  {
    title: 'Ações',
    key: 'actions',
    width: 100,
    render: (row: ProductCategory) =>
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

const fetchCategories = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<any>('/api/v1/product-categories', {
      query: {
        page: pagination.page,
        limit: pagination.pageSize
      }
    })
    categories.value = res.data
    pagination.itemCount = res.meta.total
  } catch (err) {
    message.error('Erro ao buscar categorias')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (p: number) => {
  pagination.page = p
  fetchCategories()
}

const handlePageSizeChange = (s: number) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchCategories()
}

const handleSubmit = async (payload: ProductCategory) => {
  saving.value = true
  const api = useApi()
  try {
    if (payload.id) {
      await api(`/api/v1/product-categories/${payload.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Categoria atualizada')
    } else {
      await api('/api/v1/product-categories', {
        method: 'POST',
        body: payload
      })
      message.success('Categoria criada')
    }
    closeModal()
    fetchCategories()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar categoria')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (category: ProductCategory) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir a categoria ${category.name}? Ela pode estar vinculada a produtos.`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/product-categories/${category.id}`, { method: 'DELETE' })
        message.success('Categoria excluída')
        fetchCategories()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir categoria')
      }
    }
  })
}

const openCreate = () => {
  editingCategory.value = null
  showModal.value = true
}

const openEdit = (category: ProductCategory) => {
  editingCategory.value = category
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const rowProps = (row: ProductCategory) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  fetchCategories()
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
@media (max-width: 768px) {
  .card-list { display: flex; flex-direction: column; gap: 12px; }
  .entity-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fff; }
  .card-title { margin: 0; font-size: 16px; font-weight: 700; }
  .card-subtitle { margin: 6px 0 0; font-size: 12px; color: #64748b; }
  .card-actions { margin-top: 12px; display: flex; justify-content: flex-end; }
}
</style>
