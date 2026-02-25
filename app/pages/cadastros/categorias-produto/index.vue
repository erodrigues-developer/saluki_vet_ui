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
import { h, onMounted, reactive, ref } from 'vue'
import { NButton, useMessage, useDialog } from 'naive-ui'
import ProductCategoryForm, { type ProductCategory } from '~/components/product-categories/ProductCategoryForm.vue'

const message = useMessage()
const dialog = useDialog()

const categories = ref<ProductCategory[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingCategory = ref<ProductCategory | null>(null)

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
    const res = await $fetch<any>('/api/v1/product-categories', {
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
  try {
    if (payload.id) {
      await $fetch(`/api/v1/product-categories/${payload.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Categoria atualizada')
    } else {
      await $fetch('/api/v1/product-categories', {
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
      try {
        await $fetch(`/api/v1/product-categories/${category.id}`, { method: 'DELETE' })
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
  fetchCategories()
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: center; }
.eyebrow { font-size: 12px; color: #6b7280; text-transform: uppercase; margin: 0; }
h1 { margin: 4px 0 0; font-size: 24px; }
.actions { display: flex; gap: 8px; }
</style>
