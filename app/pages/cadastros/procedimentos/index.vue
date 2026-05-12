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
      class="procedure-modal"
      style="width: 600px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingProcedure ? 'Editar procedimento' : 'Novo procedimento' }}</h3>
          <p class="modal-subtitle">
            {{ editingProcedure ? 'Atualize dados, preços e status do procedimento.' : 'Cadastre um novo procedimento para atendimento clínico.' }}
          </p>
        </div>
      </template>
      <ProcedureForm
        ref="procedureFormRef"
        :value="editingProcedure"
        :loading="saving"
        @submit="handleSubmit"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitProcedureForm">
            {{ editingProcedure ? 'Salvar alterações' : 'Criar procedimento' }}
          </n-button>
        </div>
      </template>
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
const procedureFormRef = ref<{ submit: () => Promise<void> } | null>(null)
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

const submitProcedureForm = async () => {
  await procedureFormRef.value?.submit()
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
:root .n-modal-container:has(.procedure-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.procedure-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.procedure-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.procedure-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.procedure-modal.n-card {
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

.procedure-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.procedure-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.procedure-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .procedure-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .procedure-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .procedure-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .procedure-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }
}
</style>
