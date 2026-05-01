<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Cadastros</p>
        <h1>Procedimentos (Atendimento)</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Novo Procedimento
      </n-button>
    </div>

    <div v-if="isMobile" class="card-list">
      <div v-for="item in procedures" :key="item.id" class="entity-card" @click="openEdit(item)">
        <p class="card-title">{{ item.name }}</p>
        <p class="card-subtitle">Preço {{ item.defaultPrice ? `R$ ${Number(item.defaultPrice).toFixed(2)}` : '-' }}</p>
        <p class="card-subtitle">Comissão {{ `${Number(item.commissionPercent || 0).toFixed(2)}%` }}</p>
        <div class="card-actions">
          <n-tag :type="item.isActive ? 'success' : 'error'" :bordered="false" size="small">{{ item.isActive ? 'Ativo' : 'Inativo' }}</n-tag>
          <n-button size="small" tertiary type="error" @click.stop="confirmDelete(item)">Excluir</n-button>
        </div>
      </div>
    </div>

    <div v-else class="table-mobile-wrapper">
      <n-data-table
        :loading="loading"
        :columns="columns"
        :data="procedures"
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
      style="width: 600px"
    >
      <template #header>
        <p class="eyebrow" style="margin: 0">{{ editingProcedure ? 'Editar Procedimento' : 'Novo Procedimento' }}</p>
      </template>
      <ProcedureForm
        :value="editingProcedure"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NTag, useMessage, useDialog } from 'naive-ui'
import ProcedureForm, { type Procedure } from '~/components/procedures/ProcedureForm.vue'

const message = useMessage()
const dialog = useDialog()

const procedures = ref<Procedure[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingProcedure = ref<Procedure | null>(null)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

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
  {
    title: 'Preço Padrão',
    key: 'defaultPrice',
    render: (row: Procedure) => row.defaultPrice ? `R$ ${Number(row.defaultPrice).toFixed(2)}` : '-'
  },
  {
    title: 'Comissão',
    key: 'commissionPercent',
    render: (row: Procedure) => `${Number(row.commissionPercent || 0).toFixed(2)}%`
  },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: Procedure) =>
      h(NTag, { type: row.isActive ? 'success' : 'error', bordered: false, size: 'small' }, { default: () => (row.isActive ? 'Ativo' : 'Inativo') })
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 100,
    render: (row: Procedure) =>
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

const fetchProcedures = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<any>('/api/v1/procedures', {
      query: {
        page: pagination.page,
        limit: pagination.pageSize
      }
    })
    procedures.value = res.data
    pagination.itemCount = res.meta.total
  } catch (err) {
    message.error('Erro ao buscar procedimentos')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (p: number) => {
  pagination.page = p
  fetchProcedures()
}

const handlePageSizeChange = (s: number) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchProcedures()
}

const handleSubmit = async (payload: Procedure) => {
  saving.value = true
  const api = useApi()
  try {
    if (payload.id) {
      await api(`/api/v1/procedures/${payload.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Procedimento atualizado')
    } else {
      await api('/api/v1/procedures', {
        method: 'POST',
        body: payload
      })
      message.success('Procedimento criado')
    }
    closeModal()
    fetchProcedures()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar procedimento')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (procedure: Procedure) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o procedimento ${procedure.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/procedures/${procedure.id}`, { method: 'DELETE' })
        message.success('Procedimento excluído')
        fetchProcedures()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir procedimento')
      }
    }
  })
}

const openCreate = () => {
  editingProcedure.value = null
  showModal.value = true
}

const openEdit = (procedure: Procedure) => {
  editingProcedure.value = procedure
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const rowProps = (row: Procedure) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  fetchProcedures()
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
  .card-subtitle { margin: 4px 0 0; font-size: 12px; color: #64748b; }
  .card-actions { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
}
</style>
